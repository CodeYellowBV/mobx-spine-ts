import {
    action, computed, extendObservable, isObservableProp, isObservableArray,
    isObservableObject, observable, toJS
} from 'mobx';
import { camelToSnake, snakeToCamel, forNestedRelations, relationsToNestedKeys } from "./Utils";
import {
    forIn, uniqueId, result, mapValues, isPlainObject, isArray,
    uniq, uniqBy, get, omit, mapKeys, each
} from 'lodash';
import {Store} from "./Store";
import baseFromBackend from "./Model/FromBackend";
import Api from './Api';

function concatInDict(dict: object, key: string, value: any) {
    dict[key] = dict[key] ? dict[key].concat(value) : value;
}

// Find the relation name before the first dot, and include all other relations after it
// Example: input `animal.kind.breed` output -> `['animal', 'kind.breed']`
const RE_SPLIT_FIRST_RELATION = /([^.]+)\.(.+)/;

export interface ModelData {
    id?: number
}

// Use this special type to handle Casts types
export type ParseData<T> = { [P in keyof T]?: any };

// This type is complex because the attribute names between frontend and backend can differ
// (camelCase vs snake_case). For now, I will only list the id...
export type BackendData = { id?: number };

export type CopyOptions = { copyChanges: boolean };

export interface ToBackendParams<T extends ModelData> {
    data?: T;
    mapData?: (x: BackendData) => BackendData;

    onlyChanges?: boolean;
    fields?: string[];
    forceFields?: string[];
}

export interface SaveParams<T extends ModelData> {
    data?: T & { [x: string]: any; };
    mapData?: (x: Partial<T>) => any;

    onlyChanges?: boolean;
    fields?: string[];

    url?: string;

    [x: string]: any;
}

export interface SaveAllParams<T extends ModelData> extends SaveParams<T> {
    relations?: string[];
}

export interface NestedStrings {
    [nested: string]: NestedStrings;
}

export type NestedRelations = NestedStrings;

export interface ToBackendAllParams<T extends ModelData> {
    data?: T;
    mapData?: (x: Partial<T>) => Partial<T>;
    nestedRelations?: NestedRelations;

    onlyChanges?: boolean;
}

export interface ModelOptions<T> {
    relations?: string[],     // List of active relations for this model
    store?: Store<T, Model<T>>,
}

type StoreOrModelConstructor = (new () => Model<any>) | (new () => Store<any, any>);

interface WorkAround {
    urlRoot?: string | (() => string);
    api?: Api;
}

export abstract class Model<T extends ModelData> implements WorkAround {

    /**
     * How the model is known at the backend. This is useful when the model is in a
     * relation that has a different name.
     */
    static backendResourceName: string = '';
    // Mobx-spine-ts doesn't support a different primary key than id
    // but some of our code still relies on this static value being present
    static primaryKey: string = 'id';

    static fileFields: string[] = [];
    static pickFields?: string[] = undefined;
    static omitFields: string[] = [];

    cid: string = uniqueId('m');
    api: Api = null;

    // A list of all attributes of this model
    __attributes: string[] = [];

    // This contains the values of all relevant attributes at the time this model was created
    __originalAttributes: object = {};

    // List of relations that are currently active for this model
    __activeRelations: string[] = [];

    __activeCurrentRelations: string[] = [];

    __store: Store<T, Model<T>>;

    @observable __pendingRequestCount: number = 0;
    @observable __fetchParams: object = {};

    @observable __changes: string[] = [];

    @observable __backendValidationErrors: object = {};

    // File state
    @observable __fileChanges: object = {};
    @observable __fileDeletions: object = {};
    @observable __fileExists: object = {};

    public constructor(data?: ParseData<T>, options?: ModelOptions<T>) {
        // Make sure the model is patched, such that the afterConstruct is called
        if (!this.constructor['_isTsPatched']) {
            throw new Error("Model is not patched with @tsPatch")
        }

        // @ts-ignore
        if (!this.urlRoot) {
            // @ts-ignore
            this.urlRoot = () => {
                const bname = this.constructor['backendResourceName'];
                if (bname) {
                    return `/${bname}/`;
                } else {
                    return null;
                }
            };
        }
        this['__testingId'] = Math.floor(100000 * Math.random());

        this.saveFile = this.saveFile.bind(this);
    }

    /***
     * If we need to change things to a submodel, we can only access the data after running the constructor of the
     * submodel. This method is called after the constuctor is called
     *
     * @param data
     * @param options
     * @private
     */
    private afterConstructor(data?: ParseData<T>, options?: ModelOptions<T>) {
        options = options || {};
        this.__store = options.store;

        // Fin all the attributes
        forIn(this, (value: any, key: string) => {

            // Keys startin with __ are internal
            if (key.startsWith('__')) {
                return;
            }

            if (!isObservableProp(this, key)) {
                return;
            }

            this.__attributes.push(key);

            let newValue = value;
                // An array or object observable can be mutated, so we want to ensure we always have
                // the original not-yet-mutated object/array.
                if (isObservableArray(value)) {
                    newValue = value.slice();
                } else if (isObservableObject(value)) {
                    newValue = Object.assign({}, value);
                }
                this.__originalAttributes[key] = newValue;
        });


        if (options.relations) {
            this.__parseRelations(options.relations);
        }

        // The model will automatically be assigned a negative id, the id will still be overridden if it is supplied in the data
        this.assignInternalId();

        // We want our id to remain negative on a clear, only if it was not created with the id set to null
        // which is usually the case when the object is a related model in which case we want the id to be reset to null
        if ((data && data['id'] !== null) || !data) {
            this.__originalAttributes['id'] = this['id'];
        }

        // Parse the initial data
        if (data) {
            this.parse(data);
        }

        this.initialize();
    }

    setFetchParams(params: object) {
        this.__fetchParams = Object.assign({}, params);
    }

    wrapPendingRequestCount<T>(promise: Promise<T>): Promise<T> {
        this.__pendingRequestCount++;

        return promise
            .then((res) => {
                this.__pendingRequestCount--;
                return res;
            })
            .catch((err) => {
                this.__pendingRequestCount--;
                throw err;
            });
    }

    /**
     * Get a dictionary of all the data points, and initiate a model from thiss
     * @param data
     */
    @action
    public parse(data: ParseData<T>): Model<T> {
        if (!isPlainObject(data)) {
            throw Error(`Parameter supplied to \`parse()\` is not an object, got: ${JSON.stringify(
                data
            )}`);
        }

        forIn(data, (value: object, key: string) => {
            const attr = this.constructor['fromBackendAttrKey'](key);
            // parse normal attributes
            if (this.__attributes.includes(attr)) {
                this[attr] = this.__parseAttr(attr, value);
            } else if (this.__activeCurrentRelations.includes(attr)) {

                // Parse the relations
                if (isPlainObject(value) || (isArray(value) && (isPlainObject(get(value, '[0]')) || value['length'] === 0))) {
                    this[attr].parse(value);
                } else if (value === null) {
                    // The relation is cleared.
                    this[attr].clear();
                }
            // Mobx-spine should silently ignore undefined fields.
            //} else {
            //    console.warn(`Object has no attribute ${attr}. This value is ignored in the bootstrap`)
            //}
        });

        return this;

    }

    __parseAttr(attr: string, value: any): any {
        const casts = this.casts();
        const cast = casts[attr];
        if (cast !== undefined) {
            return cast.parse(attr, value);
        }
        return value;
    }

    fileFields() {
        return this.constructor['fileFields'];
    }

    pickFields(): string[]|undefined {
        return this.constructor['pickFields'];
    }

    omitFields(): string[] {
        return this.constructor['omitFields'];
    }

    casts() {
        return {};
    }

    @computed
    get backendValidationErrors() {
        return this.__backendValidationErrors;
    }

    @computed get fieldFilter(): (name: string) => boolean {
        const pickFields = this.pickFields();
        const omitFields = this.omitFields();

        return (name) => (!pickFields || pickFields.includes(name)) && !omitFields.includes(name);
    }

    __toJSAttr(attr: string, value) {
        const casts = this.casts();
        const cast = casts[attr];
        if (cast !== undefined) {
            return toJS(cast.toJS(attr, value))
        }
        return toJS(value);
    }

    toJS(): ParseData<T> {
        const output: ParseData<T> = {};
        this.__attributes.forEach(attr => {
            output[attr] = this.__toJSAttr(attr, this[attr]);
        });

        this.__activeCurrentRelations.forEach(currentRel => {
            const model = this[currentRel];
            if (model) {
                output[currentRel] = model.toJS();
            }
        });
        return output;
    }

    getEncodedFile(file: string){
        // get the resource name from path
        const id = this['id'];

        if(this.fileFields().includes(file) && !this.isNew){
            return `${result(this, 'urlRoot')}${id ? `${id}/` : ''}${file}/?encode=true`;
        }
        return '';
    }

    uuidv4(): string {
        // @ts-ignore
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
      }

    saveFile(name: string): Promise<any> {
        const snakeName = camelToSnake(name);

        if (this.__fileChanges[name]) {
            const file = this.__fileChanges[name];

            const data = new FormData();

            if (this.isBase64(file)) {
                const newfile = this.dataURItoBlob(file);
                // TODO Stop hardcoding .png
                const fname = `${this.uuidv4()}.png`;
                data.append(name, newfile, fname);
            } else {
                data.append(name, file, file.name);
            }

            return (
                this.api.post(
                    `${this.url}${snakeName}/`,
                    data,
                    { headers: { 'Content-Type': 'multipart/form-data' } },
                )
                .then(action((res) => {
                    this.__fileExists[name] = true;
                    delete this.__fileChanges[name];
                    this.saveFromBackend(res);
                }))
            );
        } else if (this.__fileDeletions[name]) {
            if (this.__fileExists[name]) {
                return (
                    this.api.delete(`${this.url}${snakeName}/`)
                    .then(action(() => {
                        this.__fileExists[name] = false;
                        delete this.__fileDeletions[name];
                        this.saveFromBackend({ data: {
                            [snakeName]: null,
                        } });
                    }))
                );
            } else {
                delete this.__fileDeletions[name];
            }
        } else {
            return Promise.resolve();
        }
    }

    isBase64(str: any): boolean {
        if( typeof str === 'object' || str === undefined || str === null){ return false;}
        if (str ==='' || str.trim() ===''){ return false; }
        str = str.replace(/^[^,]+,/, '');
        try {
            return btoa(atob(str)) === atob(btoa(str));
        } catch (err) {
            return false;
        }
    }

    dataURItoBlob(dataURI: string) {
        const mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const binary = atob(dataURI.split(',')[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
           array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: mime});
    }

    // This is just a pass-through to make it easier to override parsing backend responses from the backend.
    // Sometimes the backend won't return the model after a save because e.g. it is created async.
    saveFromBackend(res) {
        return this.fromBackend(res);
    }

    saveFiles(): Promise<any[]> {
        return Promise.all(
            this.fileFields()
            .filter(this.fieldFilter)
            .map(this.saveFile)
        );
    }

    clearUserFileChanges() {
        this.__fileChanges = {};
        this.__fileDeletions = {};
        this.__fileExists = {};
    }

    @action
    clearValidationErrors() {
        this.__backendValidationErrors = {};
        this.__activeCurrentRelations.forEach(currentRel => {
            this[currentRel].clearValidationErrors();
        });
    }

    clearUserFieldChanges() {
        this.__changes['clear']();
    }

    @computed
    get hasUserChanges() {
        if (this.__changes.length > 0) {
            return true;
        }
        return this.__activeCurrentRelations.some(rel => {
            return this[rel].hasUserChanges;
        });
    }

    @computed
    get isLoading() {
        return this.__pendingRequestCount > 0;
    }

    saveAllFiles(relations: NestedRelations = {}) {
        const promises = [this.saveFiles()];
        for (const rel of Object.keys(relations)) {
            promises.push(this[rel].saveAllFiles(relations[rel]));
        }
        return Promise.all(promises);
    }

    /**
     * Validates a model and relations by sending a save request to binder with the validate header set. Binder will return the validation
     * errors without actually committing the save
     *
     * @param options - same as for a normal saveAll request, example {relations:['foo'], onlyChanges: true}
     */
    validateAll(options: SaveAllParams<T> = {}){
        // Add the validate option
        if (options.params){
            options.params.validate = true
        } else {
            options.params = { validate: true };
        }
        return this.saveAll(options).catch((err)=>{throw err});
    }

    @action
    saveAll(options: SaveAllParams<T> = {}): Promise<object> {
        this.clearValidationErrors();
        return this.wrapPendingRequestCount(
            this.__getApi()
            .saveAllModels({
                url: result(this, 'urlRoot'),
                model: this,
                data: this.toBackendAll({
                    data: options.data,
                    mapData: options.mapData,
                    nestedRelations: relationsToNestedKeys(options.relations || []),
                    onlyChanges: options.onlyChanges,
                }),
                requestOptions: omit(options, 'relations', 'data', 'mapData'),
            })
            .then(action(res => {
                // Don't update the models if we are only validating them
                if (!options.params || !options.params.validate) {
                    this.saveFromBackend(res);
                    this.clearUserFieldChanges();

                    forNestedRelations(this, relationsToNestedKeys(options.relations || []), relation => {
                        if (relation instanceof Model) {
                            relation.clearUserFieldChanges();
                        } else {
                            relation.clearSetChanges();
                        }
                    });
                    return this.saveAllFiles(relationsToNestedKeys(options.relations || [])).then(() => {
                        this.clearUserFileChanges();

                        forNestedRelations(this, relationsToNestedKeys(options.relations || []), relation => {
                            if (relation instanceof Model) {
                                relation.clearUserFileChanges();
                            }
                        });

                        return res;
                    });
                }
            }))
            .catch(
                action(err => {
                    if (err.valErrors) {
                        this.parseValidationErrors(err.valErrors);
                    }
                    throw err;
                })
            )
        );
    }

    // After saving a model, we should get back an ID mapping from the backend which looks like:
    // `{ "animal": [[-1, 10]] }`
    __parseNewIds(idMaps: { [x: string]: number[][]}) {
        const bName = this.constructor['backendResourceName'];
        if (bName && idMaps[bName]) {
            const idMap = idMaps[bName].find(
                ids => ids[0] === this.getInternalId()
            );
            if (idMap) {
                // @ts-ignore
                this.id = idMap[1];
            }
        }
        each(this.__activeCurrentRelations, relName => {
            const rel = this[relName];
            rel.__parseNewIds(idMaps);
        });
    }

    /**
     * Validates a model by sending a save request to binder with the validate header set. Binder will return the validation
     * errors without actually committing the save
     *
     * @param options - same as for a normal save request, example: {onlyChanges: true}
     */
    validate(options: SaveParams<T> = {}) {
        // Add the validate parameter
        if (options.params){
            options.params.validate = true
        } else {
            options.params = { validate: true };
        }
        return this.save(options).catch((err)=>{throw err});
    }

    @action
    save(options: SaveParams<T> = {}) {
        this.clearValidationErrors();
        return this.wrapPendingRequestCount(
            this.__getApi()
            .saveModel({
                url: options.url || this.url,
                data: this.toBackend({
                        data: options.data,
                        mapData: options.mapData,
                        fields: options.fields,
                        onlyChanges: options.onlyChanges,
                    }),
                isNew: this.isNew,
                requestOptions: omit(options, 'url', 'data', 'mapData')
            })
            .then(action(res => {
                // Don't update the model when we only want to validate
                if (!options.params || !options.params.validate) {
                    this.saveFromBackend({
                        ...res,
                        data: omit(res.data, this.fileFields().map(camelToSnake)),
                    });
                    this.clearUserFieldChanges();
                    return this.saveFiles().then(() => {
                        this.clearUserFileChanges();
                        return Promise.resolve(res);
                    });
                }
            }))
            .catch(
                action(err => {
                    if (err.valErrors) {
                        this.parseValidationErrors(err.valErrors);
                    }
                    throw err;
                })
            )
        );
    }

    @action
    setInput(name: string, value: any) {
        if (!this.__attributes.includes(name) && !this.__activeCurrentRelations.includes(name)) {
            throw new Error(`[mobx-spine] Field '${name}' doesn't exist on the model.`);
        }
        if (this.fileFields().includes(name)) {
            if (this.__fileExists[name] === undefined) {
                this.__fileExists[name] = this[name] !== null;
            }
            if (value) {
                this.__fileChanges[name] = value;
                delete this.__fileDeletions[name];

                const isBase64File = this.isBase64(value);

                if(!isBase64File){
                    value = `${URL.createObjectURL(value)}?content_type=${value.type}`;
                }
                else {
                    const blob = this.dataURItoBlob(value);
                    value = `${URL.createObjectURL(blob)}`;
                }
            } else {
                if (!this.__fileChanges[name] || this.__fileChanges[name].existed) {
                    this.__fileDeletions[name] = true;
                }
                delete this.__fileChanges[name];

                value = null;
            }
        }
        if (!this.__changes.includes(name)) {
            this.__changes.push(name);
        }
        if (this.__activeCurrentRelations.includes(name)) {
            if (isArray(value)) {
                this[name].clear();
                this[name].add(value.map(v => v.toJS()));
            } else if (value) {
                this[name].parse(value.toJS());
            } else {
                this[name].clear();
            }
        } else {
            this[name] = value;
        }
        if (this.backendValidationErrors[name]) {
            this.__backendValidationErrors = Object.assign(
                this.backendValidationErrors,
                { [name]: undefined }
            );
        }
    }

    toBackend(params?: ToBackendParams<T> | undefined): BackendData {
        if (params === undefined) {
            params = {};
        }

        const data = params.data || {};

        const output: BackendData = {};
        // By default we'll include all fields (attributes+relations), but sometimes you might want to specify the fields to be included.
        const fieldFilter = (field: string) => {
            if (!this.fieldFilter(field)) {
                return false;
            }
            if (params.fields) {
                return params.fields.includes(field);
            }
            if (!this.isNew && params.onlyChanges) {
                const forceFields = params.forceFields || [];
                return (
                    forceFields.includes(field) ||
                        this.__changes.includes(field) ||
                        (this[field] instanceof Store && this[field].hasSetChanges) ||
                        // isNew is always true for relations that haven't been saved.
                        // If no property has been tweaked, its id serializes as null.
                        // So, we need to skip saving the id if new and no changes.
                        (this[field] instanceof Model && this[field].isNew && this[field].hasUserChanges)
                );
            }
            return true;
        };
        this.__attributes.filter(fieldFilter).forEach(attr => {
            if (!attr.startsWith('_')) {
                output[
                    this.constructor['toBackendAttrKey'](attr)
                ] = this.__toJSAttr(attr, this[attr]);
            }
        });

        // Primary key is always forced to be included.
        // @ts-ignore
        output.id = this.id;

        // Add active relations as id.
        this.__activeCurrentRelations
            .filter(fieldFilter)
            .forEach(currentRel => {
                const rel = this[currentRel];
                const relBackendName = this.constructor['toBackendAttrKey'](
                    currentRel
                );
                if (rel instanceof Model) {
                    // @ts-ignore
                    output[relBackendName] = rel.id;
                }
                if (rel instanceof Store) {
                    output[relBackendName] = rel.mapByPrimaryKey();
                }
            });

        Object.assign(output, data);
        if (params.mapData) {
            return params.mapData(output);
        } else {
            return output;
        }
    }

    // Useful to reference to this model in a relation - that is not yet saved to the backend.
    getNegativeId(): number {
        return -parseInt(this.cid.replace('m', ''));
    }

    /**
     * Get InternalId returns the id of a model or a negative id if the id is not set
     * @returns the id of a model or a negative id if the id is not set
     */
    getInternalId(): number {
        if (!this['id']) {
            return this.getNegativeId();
        }
        // @ts-ignore
        return this.id;
    }

    /**
     * Gives the model the internal id, meaning that it will keep the set id of the model or it will receive a negative
     * id if the id is null. This is useful if you have a new model that you want to give an id so that it can be
     * referred to in a relation.
     */
    assignInternalId() {
        this['id'] = this.getInternalId();
    }

    __getApi(): Api {
        if (!this.api) {
            throw new Error(
                '[mobx-spine] You are trying to perform an API request without an `api` property defined on the model.'
            );
        }
        if (!result(this, 'urlRoot')) {
            throw new Error(
                'You are trying to perform an API request without a `urlRoot` property defined on the model.'
            );
        }
        return this.api;
    }

    buildFetchData(options: { data?: any }) {
        return Object.assign(
            this.__getApi().buildFetchModelParams(this),
            this.__fetchParams,
            options.data
        );
    }

    @action
    delete(options: { immediate?: boolean, url?: string, [x: string]: any } = {}) {
        const removeFromStore = () =>
            this.__store ? this.__store.remove(this) : null;
        if (options.immediate || this.isNew) {
            removeFromStore();
        }
        if (this.isNew) {
            return Promise.resolve();
        }

        return this.wrapPendingRequestCount(
            this.__getApi()
            .deleteModel({
                url: options.url || this.url,
                requestOptions: omit(options, ['immediate', 'url']),
            })
            .then(
                action(() => {
                    if (!options.immediate) {
                        removeFromStore();
                    }
                })
            )
        );
    }

    @action
    fetch(options: { url?: string, data?: any, [x: string]: any } = {}) {
        if (this.isNew) {
            throw new Error('[mobx-spine] Trying to fetch a model without an id');
        }

        const data = this.buildFetchData(options);
        const promise = this.wrapPendingRequestCount(
            this.__getApi()
            .fetchModel({
                url: options.url || this.url,
                data,
                requestOptions: omit(options, ['data', 'url']),
            })
            .then(action(res => {
                this.fromBackend(res);
            }))
        );

        return promise;
    }

    @action
    clear() {
        forIn(this.__originalAttributes, (value: any, key: string) => {
            // If it is our primary key, and the primary key is negative, we generate a new negative pk, else we set it
            // to the value
            if (key === this['id'] && value < 0){
                this[key] = -1 * (uniqueId() as unknown as number);
            } else {
                this[key] = value;
            }
        });

        this.__activeCurrentRelations.forEach(currentRel => {
            this[currentRel].clear();
        });
    }

    validationErrorFormatter(obj: any) {
        return obj.code;
    }

    @action
    parseValidationErrors(valErrors: object) {
        const bname = this.constructor['backendResourceName'];

        if (valErrors[bname]) {
            const id = this.getInternalId();
            // When there is no id or negative id, the backend may use the string 'null'. Bit weird, but eh.
            const errorsForModel =
                valErrors[bname][id] || valErrors[bname]['null'];
            if (errorsForModel) {
                const camelCasedErrors = mapKeys(errorsForModel, (_value: string, key: string) =>
                    snakeToCamel(key)
                );
                const formattedErrors = mapValues(
                    camelCasedErrors,
                    valError => {
                        return valError.map(this.validationErrorFormatter);
                    }
                );
                this.__backendValidationErrors = formattedErrors;
            }
        }

        this.__activeCurrentRelations.forEach(currentRel => {
            this[currentRel].parseValidationErrors(valErrors);
        });
    }

    toBackendAll(options: ToBackendAllParams<T> = {}): { data: BackendData[], relations: object } {
        const nestedRelations = options.nestedRelations || {};
        const data = this.toBackend({
            data: options.data,
            mapData: options.mapData,
            onlyChanges: options.onlyChanges,
        });

        if (data.id === null) {
            data.id = this.getNegativeId();
        }

        const relations = {};

        this.__activeCurrentRelations.forEach(currentRel => {
            const rel = this[currentRel];
            const relBackendName = this.constructor['toBackendAttrKey'](currentRel);
            const subRelations = nestedRelations[currentRel];

            if (subRelations !== undefined) {
                if (data[relBackendName] === null) {
                    data[relBackendName] = rel.getNegativeId();
                } else if (isArray(data[relBackendName])) {
                    data[relBackendName] = uniq(data[relBackendName].map(
                        (pk, i) =>
                            pk === null ? rel.at(i).getNegativeId() : pk
                    ));
                } else if (options.onlyChanges && !rel.hasUserChanges) {
                    return;
                }

                const relBackendData = rel.toBackendAll({
                    nestedRelations: subRelations,
                    onlyChanges: options.onlyChanges,
                });


                // Sometimes the backend knows the relation by a different name, e.g. the relation is called
                // `activities`, but the name in the backend is `activity`.
                // In that case, you can add `static backendResourceName = 'activity';` to that model.
                const realBackendName = rel.constructor.backendResourceName || relBackendName;

                if (relBackendData.data.length > 0) {
                    concatInDict(relations, realBackendName, relBackendData.data);

                    // De-duplicate relations based on id
                    // TODO: Avoid serializing recursively multiple times in the first place?
                    // TODO: What if different relations have different "freshness"?
                    relations[realBackendName] = uniqBy(
                        relations[realBackendName], 'id'
                    );
                }

                // There could still be changes in nested relations,
                // include those anyway!
                forIn(relBackendData.relations, (relB, key) => {
                    concatInDict(relations, key, relB);
                });
            }
        });

        return { data: [data], relations };
    }

    /**
     * Initiates all the relations. based upon the relations that are active (in the withs).
     *
     * @param activeRelations
     * @protected
     */
    @action
    protected __parseRelations(activeRelations: string[]) {
        this.__activeRelations = activeRelations;

        const relations = this.relations();
        const relationModels = {};


        activeRelations.forEach((activeRelation: string) => {
            // If the activeRelation is null, tis relation is already defined by another activerelations.
            // e.g. town.restaurants.chef && town
            if (activeRelation === null || !!this[activeRelation]) {
                return;
            }

            const relationNames: string[] = activeRelation.split(".");

            const currentRelation = relationNames ? relationNames[0] : activeRelation;

            const otherRelationNames = relationNames[1] && relationNames.slice(1).join(".");
            const currentProperty = relationModels[currentRelation];
            const otherRelations = otherRelationNames && [otherRelationNames];

            if (otherRelations !== undefined || !currentProperty) {
                relationModels[currentRelation] = currentProperty ? currentProperty.concat(otherRelations) : otherRelations;
            }

            if (this.__attributes.includes(currentRelation)) {
                throw Error(`Cannot define \`${currentRelation}\` as both an attribute and a relation. You probably need to remove the attribute.`)
            }

            if (!this.__activeCurrentRelations.includes(currentRelation)) {
                this.__activeCurrentRelations.push(currentRelation);
            }

        });

        // extendObservable where we omit the fields that are already created from other relations
        extendObservable(this, mapValues(
            omit(relationModels, Object.keys(relationModels).filter(rel => !!this[rel])),
            (otherRelationNames: string[], relationName: string) => {
                    const RelationModel = relations[relationName];
                    if (!RelationModel) {
                        throw Error(`Specified relation "${relationName}" does not exist on model.`);
                    }
                    const options: ModelOptions<T> = {relations: otherRelationNames};
                    if (RelationModel.prototype instanceof Store) {
                        // @ts-ignore
                        return new RelationModel(options);
                    }
                    // If we have a related model, we want to force the related model to have id null as that means there is no model set
                    // @ts-ignore
                    return new RelationModel({ id: null }, options);
                }
            )
        );
    }

    /**
     * Makes this model a copy of the specified model
     * or returns a copy of the current model when no model to copy is given
     * It also clones the changes that were in the specified model.
     * Cloning the changes requires recursion over all related models that have changes or are related to a model with changes.
     * Cloning
     *
     * @param source The model that should be copied
     * @param options Options, {copyChanges - only copy the changed attributes, requires recursion over all related objects with changes}
     */
    copy(rawSource: CopyOptions | Model<T> | undefined = undefined, options: CopyOptions = { copyChanges: true }): Model<T> {

        let copiedModel: Model<T>;
        let source: Model<T> | undefined;

        // If our source is not a model it is 'probably' the options
        if (rawSource !== undefined && !(rawSource instanceof Model)){
            options = rawSource;
            source = undefined;
        } else {
            source = rawSource as Model<T> | undefined;
        }

        // Make sure that we have the correct model
        if (source === undefined){
            source = this;
            // @ts-ignore
            copiedModel = new source.constructor({relations: source.__activeRelations});
        } else if (this.constructor !== source.constructor) {
            // @ts-ignore
            copiedModel = new source.constructor({relations: source.__activeRelations});
        } else {
            copiedModel = this;
        }

        const copyChanges = options.copyChanges;

        // Maintain the relations after copy
        // this.__activeRelations = source.__activeRelations;

        copiedModel.__parseRelations(source.__activeRelations);
        // Copy all fields and values from the specified model
        copiedModel.parse(source.toJS());


        // Set only the changed attributes
        if (copyChanges) {
            copiedModel.__copyChanges(source)
        }

        return copiedModel;
    }

    /**
     * Goes over model and all related models to set the changed values and notify the store
     *
     * @param source - the model to copy
     * @param store  - the store of the current model, to setChanged if there are changes
     * @private
     */
    __copyChanges(source: Model<T>, store?: Store<T, Model<T>>) {
        // Maintain the relations after copy
        this.__parseRelations(source.__activeRelations);

        // Copy all changed fields and notify the store that there are changes
        if (source.__changes.length > 0) {
            if (store) {
                store.__setChanged = true;
            } else if (this.__store) {
                this.__store.__setChanged = true;
            }

            source.__changes.forEach((changedAttribute) => {
                this.setInput(changedAttribute, source[changedAttribute])
            })
        }
        // Undefined safety
        if (source.__activeCurrentRelations.length > 0) {
            // Set the changes for all related models with changes
            source.__activeCurrentRelations.forEach((relation) => {
                if (relation && source[relation]) {
                    if (this[relation]) {
                        if (source[relation].hasUserChanges) {
                            if (source[relation].models) { // If related item is a store
                                if (source[relation].models.length === this[relation].models.length) { // run only if the store shares the same amount of items
                                    // Check if the store has some changes
                                    this[relation].__setChanged = source[relation].__setChanged;
                                    // Set the changes for all related models with changes
                                    source[relation].models.forEach((relatedModel: Model<any>, index: number) => {
                                        this[relation].models[index].__copyChanges(relatedModel, this[relation]);
                                    });
                                }
                            } else {
                                // Set the changes for the related model
                                this[relation].__copyChanges(source[relation], undefined)
                            }
                        }
                    } else {
                        // Related object not in relations of the model we are copying
                        console.warn(`Found related object ${source.constructor['backendResourceName']} with relation ${relation},
                        which is not defined in the relations of the model you are copying. Skipping ${relation}.`)
                    }
                }
            });
        }
    }

    @action
    fromBackend = baseFromBackend;

    /**
     * A model is considered new if it does not have an id, or if the id is a negative integer.
     * @returns {boolean}   True if the model id is not set or a negative integer
     */
    @computed
    get isNew(): boolean {
        // @ts-ignore
        return !this.id || this.id < 0;
    }

    /**
     * The get url returns the url for a model., it appends the id if there is one. If the model is new it should not
     * append an id.
     *
     * @returns {string}  the url for a model
     */
    @computed
    get url(): string {
        // @ts-ignore
        const id = this.id;
        return `${result(this, 'urlRoot')}${!this.isNew ? `${id}/` : ''}`;
    }

    protected relations(): { [name: string]: StoreOrModelConstructor } {
        return {};
    }

    // Empty function, but can be overridden if you want to do something after initializing the model.
    protected initialize() {
    }

    /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    static toBackendAttrKey(attrKey: string): string {
        return camelToSnake(attrKey);
    }

    /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    static fromBackendAttrKey(attrKey: string): string {
        return snakeToCamel(attrKey);
    }

    set backendResourceName(v: any) {
        throw Error(
            '`backendResourceName` should be a static property on the model.'
        );
    }

}


/**
 * Patches the model classes, such that
 * @param subClass
 */
export function tsPatch<U extends ModelData, T extends { new(data?: U, options?: ModelOptions<U>, ...args: any[]): {} }>(subClass: T) {
    // @ts-ignore
    return class extends subClass {
        // This denotes to the superclass that we have patched the model, which is checked to test that we have overwritten
        // the text correctly
        static _isTsPatched = true;

        // TODO: we should  be able to fix this with types, such that the ts-ignores are not missed?
        constructor(data?: U, options?: ModelOptions<T>, ...args) {
            // @ts-ignore
            super(data, options, args);

            // @ts-ignore
            this.afterConstructor(data, options);
        }
    };
}
