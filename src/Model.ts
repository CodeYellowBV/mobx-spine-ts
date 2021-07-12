import {
    action, computed, extendObservable, isObservableProp, isObservableArray,
    isObservableObject, observable, toJS
} from 'mobx';
import { camelToSnake, snakeToCamel, forNestedRelations, relationsToNestedKeys } from "./Utils";
import {
    forIn, uniqueId, result, mapValues, isPlainObject, isArray, 
    uniq, uniqBy, get, omit, mapKeys, each
} from 'lodash'
import {Store} from "./Store";
import baseFromBackend from "./Model/FromBackend";
import Api from 'Api';

function concatInDict(dict: object, key: string, value: any) {
    dict[key] = dict[key] ? dict[key].concat(value) : value;
}

// Find the relation name before the first dot, and include all other relations after it
// Example: input `animal.kind.breed` output -> `['animal', 'kind.breed']`
const RE_SPLIT_FIRST_RELATION = /([^.]+)\.(.+)/;



export interface ModelData {
    id?: number
}

export interface ToBackendParams<T extends ModelData> {
    data?: T;
    mapData?: (x: Partial<T>) => Partial<T>;

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

export abstract class Model<T extends ModelData> {
    
    /**
     * How the model is known at the backend. This is useful when the model is in a
     * relation that has a different name.
     */
    static backendResourceName: string = '';

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

    __pendingRequestCount: number = 0;
    @observable __fetchParams: object = {};

    @observable __changes: string[] = [];

    @observable __backendValidationErrors: object = {};

    // File state
    @observable __fileChanges: object = {};
    @observable __fileDeletions: object = {};
    @observable __fileExists: object = {};

    public constructor(data?: T, options?: ModelOptions<T>) {
        // Make sure the model is patched, such that the afterConstruct is called
        if (!this.constructor['_isTsPatched']) {
            throw new Error("Model is not patched with @tsPatch")
        }

    }

    /***
     * If we need to change things to a submodel, we can only access the data after running the constructor of the
     * submodel. This method is called after the constuctor is called
     *
     * @param data
     * @param options
     * @private
     */
    private afterConstructor(data?: T, options?: ModelOptions<T>) {
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

    urlRoot: (string|(() => string)) = () => {
        const bname = this.constructor['backendResourceName'];
        if (bname) {
            return `/${bname}/`;
        } else {
            return null;
        }
    }

    /**
     * Get a dictionary of all the data points, and initiate a model from thiss
     * @param data
     */
    @action
    public parse(data: T): Model<T> {
        if (!isPlainObject(data)) {
            throw Error(`Parameter supplied to \`parse()\` is not an object, got: ${JSON.stringify(
                data
            )}`);
        }

        forIn(data, (value: object, key: string) => {
            const attr = this.constructor['fromBackendAttrKey'](key);
            // parse normal attributes
            if (this.__attributes.includes(key)) {
                // @ts-ignore
                this[attr] = value;
            } else if (this.__activeCurrentRelations.includes(key)) {

                // Parse the relations
                if (isPlainObject(value) || isPlainObject(get(value, '[0]'))) {
                    this[attr].parse(value);
                } else if (value === null) {
                    // The relation is cleared.
                    this[attr].clear();
                }

            } else {
                console.warn(`Object has no attribute ${attr}. This value is ignored in the bootstrap`)
            }
        });

        return this;

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
        return [];
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

    toJS() {
        const output = {};
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

    saveFile(name: string): Promise<any> {
        const snakeName = camelToSnake(name);

        if (this.__fileChanges[name]) {
            const file = this.__fileChanges[name];

            const data = new FormData();
            data.append(name, file, file.name);

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
                this.saveFromBackend({
                    ...res,
                    data: omit(res.data, this.fileFields().map(camelToSnake)),
                });
                this.clearUserFieldChanges();
                return this.saveFiles().then(() => {
                    this.clearUserFileChanges();
                    return Promise.resolve(res);
                });
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

                value = `${URL.createObjectURL(value)}?content_type=${value.type}`;
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

    toBackend(params?: ToBackendParams<T> | undefined): Partial<T> {
        if (params === undefined) {
            params = {};
        }

        const data = params.data || {};

        const output: Partial<T> = {};
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
            return output as T;
        }
    }

    // Useful to reference to this model in a relation - that is not yet saved to the backend.
    getNegativeId(): number {
        return -parseInt(this.cid.replace('m', ''));
    }

    getInternalId(): number {
        if (this.isNew) {
            return this.getNegativeId();
        }
        // @ts-ignore
        return this.id;
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
            this[key] = value;
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

    toBackendAll(options: ToBackendAllParams<T> = {}): { data: Partial<T>[], relations: object } {
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
            if (activeRelation === null) {
                return;
            }

            const relationNames: string[] = activeRelation.split(".");

            const currentRelation = relationNames ? relationNames[0] : activeRelation;

            const otherRelationNames = relationNames[1] && relationNames.slice(1).join(".");
            const currentProperty = relationModels[currentRelation];
            const otherRelations = otherRelationNames && [otherRelationNames];

            relationModels[currentRelation] = currentProperty ? currentProperty.concat(otherRelations) : otherRelations
            // debugger;

            if (this.__attributes.includes(currentRelation)) {
                throw Error(`Cannot define \`${currentRelation}\` as both an attribute and a relation. You probably need to remove the attribute.`)
            }

            if (!this.__activeCurrentRelations.includes(currentRelation)) {
                this.__activeCurrentRelations.push(currentRelation);
            }

        });


        extendObservable(this,
            mapValues(relationModels, (otherRelationNames: string[], relationName: string) => {
                    const RelationModel = relations[relationName];
                    if (!RelationModel) {
                        throw Error(`Specified relation "${relationName}" does not exist on model.`);
                    }
                    const options: ModelOptions<T> = {relations: otherRelationNames};
                    if (RelationModel.prototype instanceof Store) {
                        // @ts-ignore
                        return new RelationModel(options);
                    }
                    // @ts-ignore
                    return new RelationModel(null, options);
                }
            )
        );
    }

    @action
    fromBackend = baseFromBackend;

    @computed
    get isNew(): boolean {
        // @ts-ignore
        return !this.id;
    }

    @computed
    get url(): string {
        // @ts-ignore
        const id = this.id;
        return `${result(this, 'urlRoot')}${id ? `${id}/` : ''}`;
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
