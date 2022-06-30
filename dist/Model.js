"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsPatch = exports.Model = void 0;
const mobx_1 = require("mobx");
const Utils_1 = require("./Utils");
const lodash_1 = require("lodash");
const Store_1 = require("./Store");
const FromBackend_1 = __importDefault(require("./Model/FromBackend"));
const axios_1 = __importDefault(require("axios"));
function concatInDict(dict, key, value) {
    dict[key] = dict[key] ? dict[key].concat(value) : value;
}
// Find the relation name before the first dot, and include all other relations after it
// Example: input `animal.kind.breed` output -> `['animal', 'kind.breed']`
const RE_SPLIT_FIRST_RELATION = /([^.]+)\.(.+)/;
class Model {
    constructor(data, options) {
        this.cid = (0, lodash_1.uniqueId)('m');
        this.api = null;
        // A list of all attributes of this model
        this.__attributes = [];
        // This contains the values of all relevant attributes at the time this model was created
        this.__originalAttributes = {};
        // List of relations that are currently active for this model
        this.__activeRelations = [];
        this.__activeCurrentRelations = [];
        this.__pendingRequestCount = 0;
        this.__fetchParams = {};
        this.__changes = [];
        this.__backendValidationErrors = {};
        // File state
        this.__fileChanges = {};
        this.__fileDeletions = {};
        this.__fileExists = {};
        this.fromBackend = FromBackend_1.default;
        // Make sure the model is patched, such that the afterConstruct is called
        if (!this.constructor['_isTsPatched']) {
            throw new Error("Model is not patched with @tsPatch");
        }
        // @ts-ignore
        if (!this.urlRoot) {
            // @ts-ignore
            this.urlRoot = () => {
                const bname = this.constructor['backendResourceName'];
                if (bname) {
                    return `/${bname}/`;
                }
                else {
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
    afterConstructor(data, options) {
        options = options || {};
        this.__store = options.store;
        this.abortController = new AbortController();
        // Fin all the attributes
        (0, lodash_1.forIn)(this, (value, key) => {
            // Keys startin with __ are internal
            if (key.startsWith('__')) {
                return;
            }
            if (!(0, mobx_1.isObservableProp)(this, key)) {
                return;
            }
            this.__attributes.push(key);
            let newValue = value;
            // An array or object observable can be mutated, so we want to ensure we always have
            // the original not-yet-mutated object/array.
            if ((0, mobx_1.isObservableArray)(value)) {
                newValue = value.slice();
            }
            else if ((0, mobx_1.isObservableObject)(value)) {
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
    setFetchParams(params) {
        this.__fetchParams = Object.assign({}, params);
    }
    wrapPendingRequestCount(promise) {
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
    parse(data) {
        if (!(0, lodash_1.isPlainObject)(data)) {
            throw Error(`Parameter supplied to \`parse()\` is not an object, got: ${JSON.stringify(data)}`);
        }
        (0, lodash_1.forIn)(data, (value, key) => {
            const attr = this.constructor['fromBackendAttrKey'](key);
            // parse normal attributes
            if (this.__attributes.includes(attr)) {
                this[attr] = this.__parseAttr(attr, value);
            }
            else if (this.__activeCurrentRelations.includes(attr)) {
                // Parse the relations
                if ((0, lodash_1.isPlainObject)(value) || ((0, lodash_1.isArray)(value) && value.every(lodash_1.isPlainObject))) {
                    this[attr].parse(value);
                }
                else if (value === null) {
                    // The relation is cleared.
                    this[attr].clear();
                }
            }
            // Mobx-spine should silently ignore undefined fields.
            //} else {
            //    console.warn(`Object has no attribute ${attr}. This value is ignored in the bootstrap`)
            //}
        });
        return this;
    }
    __parseAttr(attr, value) {
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
    pickFields() {
        return this.constructor['pickFields'];
    }
    omitFields() {
        return this.constructor['omitFields'];
    }
    casts() {
        return {};
    }
    get backendValidationErrors() {
        return this.__backendValidationErrors;
    }
    get fieldFilter() {
        const pickFields = this.pickFields();
        const omitFields = this.omitFields();
        return (name) => (!pickFields || pickFields.includes(name)) && !omitFields.includes(name);
    }
    __toJSAttr(attr, value) {
        const casts = this.casts();
        const cast = casts[attr];
        if (cast !== undefined) {
            return (0, mobx_1.toJS)(cast.toJS(attr, value));
        }
        return (0, mobx_1.toJS)(value);
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
    getEncodedFile(file) {
        // get the resource name from path
        const id = this['id'];
        if (this.fileFields().includes(file) && !this.isNew) {
            return `${(0, lodash_1.result)(this, 'urlRoot')}${id ? `${id}/` : ''}${file}/?encode=true`;
        }
        return '';
    }
    uuidv4() {
        // @ts-ignore
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    }
    saveFile(name) {
        const snakeName = (0, Utils_1.camelToSnake)(name);
        if (this.__fileChanges[name]) {
            const file = this.__fileChanges[name];
            const data = new FormData();
            if (this.isBase64(file)) {
                const newfile = this.dataURItoBlob(file);
                // TODO Stop hardcoding .png
                const fname = `${this.uuidv4()}.png`;
                data.append(name, newfile, fname);
            }
            else {
                data.append(name, file, file.name);
            }
            return (this.api.post(`${this.url}${snakeName}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
                .then((0, mobx_1.action)((res) => {
                this.__fileExists[name] = true;
                delete this.__fileChanges[name];
                this.saveFromBackend(res);
            })));
        }
        else if (this.__fileDeletions[name]) {
            if (this.__fileExists[name]) {
                return (this.api.delete(`${this.url}${snakeName}/`)
                    .then((0, mobx_1.action)(() => {
                    this.__fileExists[name] = false;
                    delete this.__fileDeletions[name];
                    this.saveFromBackend({ data: {
                            [snakeName]: null,
                        } });
                })));
            }
            else {
                delete this.__fileDeletions[name];
            }
        }
        else {
            return Promise.resolve();
        }
    }
    isBase64(str) {
        if (typeof str === 'object' || str === undefined || str === null) {
            return false;
        }
        if (str === '' || str.trim() === '') {
            return false;
        }
        str = str.replace(/^[^,]+,/, '');
        try {
            return btoa(atob(str)) === atob(btoa(str));
        }
        catch (err) {
            return false;
        }
    }
    dataURItoBlob(dataURI) {
        const mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const binary = atob(dataURI.split(',')[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: mime });
    }
    // This is just a pass-through to make it easier to override parsing backend responses from the backend.
    // Sometimes the backend won't return the model after a save because e.g. it is created async.
    saveFromBackend(res) {
        return this.fromBackend(res);
    }
    saveFiles() {
        return Promise.all(this.fileFields()
            .filter(this.fieldFilter)
            .map(this.saveFile));
    }
    clearUserFileChanges() {
        this.__fileChanges = {};
        this.__fileDeletions = {};
        this.__fileExists = {};
    }
    clearValidationErrors() {
        this.__backendValidationErrors = {};
        this.__activeCurrentRelations.forEach(currentRel => {
            this[currentRel].clearValidationErrors();
        });
    }
    clearUserFieldChanges() {
        this.__changes['clear']();
    }
    get hasUserChanges() {
        if (this.__changes.length > 0) {
            return true;
        }
        return this.__activeCurrentRelations.some(rel => {
            return this[rel].hasUserChanges;
        });
    }
    get isLoading() {
        return this.__pendingRequestCount > 0;
    }
    saveAllFiles(relations = {}) {
        const promises = [this.saveFiles()];
        for (const rel of Object.keys(relations)) {
            promises.push(this[rel].saveAllFiles(relations[rel]));
        }
        return Promise.all(promises);
    }
    _saveAll(options = {}) {
        this.clearValidationErrors();
        return this.wrapPendingRequestCount(this.__getApi()
            .saveAllModels({
            url: (0, lodash_1.result)(this, 'urlRoot'),
            model: this,
            data: this.toBackendAll({
                data: options.data,
                mapData: options.mapData,
                nestedRelations: (0, Utils_1.relationsToNestedKeys)(options.relations || []),
                onlyChanges: options.onlyChanges,
            }),
            requestOptions: (0, lodash_1.omit)(options, 'relations', 'data', 'mapData'),
        })
            .then((0, mobx_1.action)(res => {
            // Don't update the models if we are only validating them
            if (!options.params || !options.params.validate) {
                this.saveFromBackend(res);
                this.clearUserFieldChanges();
                (0, Utils_1.forNestedRelations)(this, (0, Utils_1.relationsToNestedKeys)(options.relations || []), relation => {
                    if (relation instanceof Model) {
                        relation.clearUserFieldChanges();
                    }
                    else {
                        relation.clearSetChanges();
                    }
                });
                return this.saveAllFiles((0, Utils_1.relationsToNestedKeys)(options.relations || [])).then(() => {
                    this.clearUserFileChanges();
                    (0, Utils_1.forNestedRelations)(this, (0, Utils_1.relationsToNestedKeys)(options.relations || []), relation => {
                        if (relation instanceof Model) {
                            relation.clearUserFileChanges();
                        }
                    });
                    return res;
                });
            }
        }))
            .catch((0, mobx_1.action)(err => {
            if (err.valErrors) {
                this.parseValidationErrors(err.valErrors);
            }
            throw err;
        })));
    }
    // After saving a model, we should get back an ID mapping from the backend which looks like:
    // `{ "animal": [[-1, 10]] }`
    __parseNewIds(idMaps) {
        const bName = this.constructor['backendResourceName'];
        if (bName && idMaps[bName]) {
            const idMap = idMaps[bName].find(ids => ids[0] === this.getInternalId());
            if (idMap) {
                // @ts-ignore
                this.id = idMap[1];
            }
        }
        (0, lodash_1.each)(this.__activeCurrentRelations, relName => {
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
    validate(options = {}) {
        // Add the validate parameter
        if (options.params) {
            options.params.validate = true;
        }
        else {
            options.params = { validate: true };
        }
        if (options.relations && options.relations.length > 0) {
            return this._saveAll(options).catch(error => { throw error; });
        }
        else {
            return this.save(options).catch((err) => { throw err; });
        }
    }
    save(options = {}) {
        if (options.relations && options.relations.length > 0) {
            return this._saveAll(options);
        }
        else {
            return this._save(options);
        }
    }
    _save(options = {}) {
        this.clearValidationErrors();
        return this.wrapPendingRequestCount(this.__getApi()
            .saveModel({
            url: options.url || this.url,
            data: this.toBackend({
                data: options.data,
                mapData: options.mapData,
                fields: options.fields,
                onlyChanges: options.onlyChanges,
            }),
            isNew: this.isNew,
            requestOptions: (0, lodash_1.omit)(options, 'url', 'data', 'mapData')
        })
            .then((0, mobx_1.action)(res => {
            // Don't update the model when we only want to validate
            if (!options.params || !options.params.validate) {
                this.saveFromBackend({
                    ...res,
                    data: (0, lodash_1.omit)(res.data, this.fileFields().map(Utils_1.camelToSnake)),
                });
                this.clearUserFieldChanges();
                return this.saveFiles().then(() => {
                    this.clearUserFileChanges();
                    return Promise.resolve(res);
                });
            }
        }))
            .catch((0, mobx_1.action)(err => {
            if (err.valErrors) {
                this.parseValidationErrors(err.valErrors);
            }
            throw err;
        })));
    }
    setInput(name, value) {
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
                if (!isBase64File) {
                    value = `${URL.createObjectURL(value)}?content_type=${value.type}`;
                }
                else {
                    const blob = this.dataURItoBlob(value);
                    value = `${URL.createObjectURL(blob)}`;
                }
            }
            else {
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
            if ((0, lodash_1.isArray)(value)) {
                this[name].clear();
                this[name].add(value.map(v => v.toJS()));
            }
            else if (value) {
                this[name].parse(value.toJS());
            }
            else {
                this[name].clear();
            }
        }
        else {
            this[name] = value;
        }
        if (this.backendValidationErrors[name]) {
            this.__backendValidationErrors = Object.assign(this.backendValidationErrors, { [name]: undefined });
        }
    }
    toBackend(params) {
        if (params === undefined) {
            params = {};
        }
        const data = params.data || {};
        const output = {};
        // By default we'll include all fields (attributes+relations), but sometimes you might want to specify the fields to be included.
        const fieldFilter = (field) => {
            if (!this.fieldFilter(field)) {
                return false;
            }
            if (params.fields) {
                return params.fields.includes(field);
            }
            if (!this.isNew && params.onlyChanges) {
                const forceFields = params.forceFields || [];
                return (forceFields.includes(field) ||
                    this.__changes.includes(field) ||
                    (this[field] instanceof Store_1.Store && this[field].hasSetChanges) ||
                    // isNew is always true for relations that haven't been saved.
                    // If no property has been tweaked, its id serializes as null.
                    // So, we need to skip saving the id if new and no changes.
                    (this[field] instanceof Model && this[field].isNew && this[field].hasUserChanges));
            }
            return true;
        };
        this.__attributes.filter(fieldFilter).forEach(attr => {
            if (!attr.startsWith('_')) {
                output[this.constructor['toBackendAttrKey'](attr)] = this.__toJSAttr(attr, this[attr]);
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
            const relBackendName = this.constructor['toBackendAttrKey'](currentRel);
            if (rel instanceof Model) {
                // @ts-ignore
                output[relBackendName] = rel.id;
            }
            if (rel instanceof Store_1.Store) {
                output[relBackendName] = rel.mapByPrimaryKey();
            }
        });
        Object.assign(output, data);
        if (params.mapData) {
            return params.mapData(output);
        }
        else {
            return output;
        }
    }
    // Useful to reference to this model in a relation - that is not yet saved to the backend.
    getNegativeId() {
        return -parseInt(this.cid.replace('m', ''));
    }
    /**
     * Get InternalId returns the id of a model or a negative id if the id is not set
     * @returns the id of a model or a negative id if the id is not set
     */
    getInternalId() {
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
    __getApi() {
        if (!this.api) {
            throw new Error('[mobx-spine] You are trying to perform an API request without an `api` property defined on the model.');
        }
        if (!(0, lodash_1.result)(this, 'urlRoot')) {
            throw new Error('You are trying to perform an API request without a `urlRoot` property defined on the model.');
        }
        return this.api;
    }
    buildFetchData(options) {
        return Object.assign(this.__getApi().buildFetchModelParams(this), this.__fetchParams, options.data);
    }
    delete(options = {}) {
        const removeFromStore = () => this.__store ? this.__store.remove(this) : null;
        if (options.immediate || this.isNew) {
            removeFromStore();
        }
        if (this.isNew) {
            return Promise.resolve();
        }
        return this.wrapPendingRequestCount(this.__getApi()
            .deleteModel({
            url: options.url || this.url,
            requestOptions: (0, lodash_1.omit)(options, ['immediate', 'url']),
        })
            .then((0, mobx_1.action)(() => {
            if (!options.immediate) {
                removeFromStore();
            }
        })));
    }
    fetch(options = {}) {
        if (this.isNew) {
            throw new Error('[mobx-spine] Trying to fetch a model without an id');
        }
        if (options.cancelPreviousFetch) {
            this.abortController.abort();
            this.abortController = new AbortController();
        }
        options.abortSignal = this.abortController.signal;
        const data = this.buildFetchData(options);
        const promise = this.wrapPendingRequestCount(this.__getApi()
            .fetchModel({
            url: options.url || this.url,
            data,
            requestOptions: (0, lodash_1.omit)(options, ['data', 'url']),
        })
            .then((0, mobx_1.action)(res => {
            this.fromBackend(res);
        }))
            .catch(e => {
            if (axios_1.default.isCancel(e)) {
                return null;
            }
            else {
                throw e;
            }
        }));
        return promise;
    }
    clear() {
        (0, lodash_1.forIn)(this.__originalAttributes, (value, key) => {
            // If it is our primary key, and the primary key is negative, we generate a new negative pk, else we set it
            // to the value
            if (key === this['id'] && value < 0) {
                this[key] = -1 * (0, lodash_1.uniqueId)();
            }
            else {
                this[key] = value;
            }
        });
        this.__activeCurrentRelations.forEach(currentRel => {
            this[currentRel].clear();
        });
    }
    validationErrorFormatter(obj) {
        return obj.code;
    }
    parseValidationErrors(valErrors) {
        const bname = this.constructor['backendResourceName'];
        if (valErrors[bname]) {
            const id = this.getInternalId();
            // When there is no id or negative id, the backend may use the string 'null'. Bit weird, but eh.
            const errorsForModel = valErrors[bname][id] || valErrors[bname]['null'];
            if (errorsForModel) {
                const camelCasedErrors = (0, lodash_1.mapKeys)(errorsForModel, (_value, key) => (0, Utils_1.snakeToCamel)(key));
                const formattedErrors = (0, lodash_1.mapValues)(camelCasedErrors, valError => {
                    return valError.map(this.validationErrorFormatter);
                });
                this.__backendValidationErrors = formattedErrors;
            }
        }
        this.__activeCurrentRelations.forEach(currentRel => {
            this[currentRel].parseValidationErrors(valErrors);
        });
    }
    toBackendAll(options = {}) {
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
                }
                else if ((0, lodash_1.isArray)(data[relBackendName])) {
                    data[relBackendName] = (0, lodash_1.uniq)(data[relBackendName].map((pk, i) => pk === null ? rel.at(i).getNegativeId() : pk));
                }
                else if (options.onlyChanges && !rel.hasUserChanges) {
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
                    relations[realBackendName] = (0, lodash_1.uniqBy)(relations[realBackendName], 'id');
                }
                // There could still be changes in nested relations,
                // include those anyway!
                (0, lodash_1.forIn)(relBackendData.relations, (relB, key) => {
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
    __parseRelations(activeRelations) {
        this.__activeRelations = activeRelations;
        const relations = this.relations();
        const relationModels = {};
        activeRelations.forEach((activeRelation) => {
            // If the activeRelation is null, tis relation is already defined by another activerelations.
            // e.g. town.restaurants.chef && town
            if (activeRelation === null || !!this[activeRelation]) {
                return;
            }
            const relationNames = activeRelation.split(".");
            const currentRelation = relationNames ? relationNames[0] : activeRelation;
            const otherRelationNames = relationNames[1] && relationNames.slice(1).join(".");
            const currentProperty = relationModels[currentRelation];
            const otherRelations = otherRelationNames && [otherRelationNames];
            if (otherRelations !== undefined || !currentProperty) {
                relationModels[currentRelation] = currentProperty ? currentProperty.concat(otherRelations) : otherRelations;
            }
            if (this.__attributes.includes(currentRelation)) {
                throw Error(`Cannot define \`${currentRelation}\` as both an attribute and a relation. You probably need to remove the attribute.`);
            }
            if (!this.__activeCurrentRelations.includes(currentRelation)) {
                this.__activeCurrentRelations.push(currentRelation);
            }
        });
        // extendObservable where we omit the fields that are already created from other relations
        (0, mobx_1.extendObservable)(this, (0, lodash_1.mapValues)((0, lodash_1.omit)(relationModels, Object.keys(relationModels).filter(rel => !!this[rel])), (otherRelationNames, relationName) => {
            const RelationModel = relations[relationName];
            if (!RelationModel) {
                throw Error(`Specified relation "${relationName}" does not exist on model.`);
            }
            const options = { relations: otherRelationNames };
            if (RelationModel.prototype instanceof Store_1.Store) {
                // @ts-ignore
                return new RelationModel(options);
            }
            // If we have a related model, we want to force the related model to have id null as that means there is no model set
            // @ts-ignore
            return new RelationModel({ id: null }, options);
        }));
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
    copy(rawSource = undefined, options = { copyChanges: true }) {
        let copiedModel;
        let source;
        // If our source is not a model it is 'probably' the options
        if (rawSource !== undefined && !(rawSource instanceof Model)) {
            options = rawSource;
            source = undefined;
        }
        else {
            source = rawSource;
        }
        // Make sure that we have the correct model
        if (source === undefined) {
            source = this;
            // @ts-ignore
            copiedModel = new source.constructor({ relations: source.__activeRelations });
        }
        else if (this.constructor !== source.constructor) {
            // @ts-ignore
            copiedModel = new source.constructor({ relations: source.__activeRelations });
        }
        else {
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
            copiedModel.__copyChanges(source);
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
    __copyChanges(source, store) {
        // Maintain the relations after copy
        this.__parseRelations(source.__activeRelations);
        // Copy all changed fields and notify the store that there are changes
        if (source.__changes.length > 0) {
            if (store) {
                store.__setChanged = true;
            }
            else if (this.__store) {
                this.__store.__setChanged = true;
            }
            source.__changes.forEach((changedAttribute) => {
                this.setInput(changedAttribute, source[changedAttribute]);
            });
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
                                    source[relation].models.forEach((relatedModel, index) => {
                                        this[relation].models[index].__copyChanges(relatedModel, this[relation]);
                                    });
                                }
                            }
                            else {
                                // Set the changes for the related model
                                this[relation].__copyChanges(source[relation], undefined);
                            }
                        }
                    }
                    else {
                        // Related object not in relations of the model we are copying
                        console.warn(`Found related object ${source.constructor['backendResourceName']} with relation ${relation},
                        which is not defined in the relations of the model you are copying. Skipping ${relation}.`);
                    }
                }
            });
        }
    }
    /**
     * A model is considered new if it does not have an id, or if the id is a negative integer.
     * @returns {boolean}   True if the model id is not set or a negative integer
     */
    get isNew() {
        // @ts-ignore
        return !this.id || this.id < 0;
    }
    /**
     * The get url returns the url for a model., it appends the id if there is one. If the model is new it should not
     * append an id.
     *
     * @returns {string}  the url for a model
     */
    get url() {
        // @ts-ignore
        const id = this.id;
        return `${(0, lodash_1.result)(this, 'urlRoot')}${!this.isNew ? `${id}/` : ''}`;
    }
    relations() {
        return {};
    }
    // Empty function, but can be overridden if you want to do something after initializing the model.
    initialize() {
    }
    /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    static toBackendAttrKey(attrKey) {
        return (0, Utils_1.camelToSnake)(attrKey);
    }
    /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    static fromBackendAttrKey(attrKey) {
        return (0, Utils_1.snakeToCamel)(attrKey);
    }
    set backendResourceName(v) {
        throw Error('`backendResourceName` should be a static property on the model.');
    }
}
/**
 * How the model is known at the backend. This is useful when the model is in a
 * relation that has a different name.
 */
Model.backendResourceName = '';
// Mobx-spine-ts doesn't support a different primary key than id
// but some of our code still relies on this static value being present
Model.primaryKey = 'id';
Model.fileFields = [];
Model.pickFields = undefined;
Model.omitFields = [];
__decorate([
    mobx_1.observable
], Model.prototype, "__pendingRequestCount", void 0);
__decorate([
    mobx_1.observable
], Model.prototype, "__fetchParams", void 0);
__decorate([
    mobx_1.observable
], Model.prototype, "__changes", void 0);
__decorate([
    mobx_1.observable
], Model.prototype, "__backendValidationErrors", void 0);
__decorate([
    mobx_1.observable
], Model.prototype, "__fileChanges", void 0);
__decorate([
    mobx_1.observable
], Model.prototype, "__fileDeletions", void 0);
__decorate([
    mobx_1.observable
], Model.prototype, "__fileExists", void 0);
__decorate([
    mobx_1.action
], Model.prototype, "parse", null);
__decorate([
    mobx_1.computed
], Model.prototype, "backendValidationErrors", null);
__decorate([
    mobx_1.computed
], Model.prototype, "fieldFilter", null);
__decorate([
    mobx_1.action
], Model.prototype, "clearValidationErrors", null);
__decorate([
    mobx_1.computed
], Model.prototype, "hasUserChanges", null);
__decorate([
    mobx_1.computed
], Model.prototype, "isLoading", null);
__decorate([
    mobx_1.action
], Model.prototype, "_saveAll", null);
__decorate([
    mobx_1.action
], Model.prototype, "_save", null);
__decorate([
    mobx_1.action
], Model.prototype, "setInput", null);
__decorate([
    mobx_1.action
], Model.prototype, "delete", null);
__decorate([
    mobx_1.action
], Model.prototype, "fetch", null);
__decorate([
    mobx_1.action
], Model.prototype, "clear", null);
__decorate([
    mobx_1.action
], Model.prototype, "parseValidationErrors", null);
__decorate([
    mobx_1.action
], Model.prototype, "__parseRelations", null);
__decorate([
    mobx_1.action
], Model.prototype, "fromBackend", void 0);
__decorate([
    mobx_1.computed
], Model.prototype, "isNew", null);
__decorate([
    mobx_1.computed
], Model.prototype, "url", null);
exports.Model = Model;
/**
 * Patches the model classes, such that
 * @param subClass
 */
function tsPatch(subClass) {
    var _a;
    // @ts-ignore
    return _a = class extends subClass {
            // TODO: we should  be able to fix this with types, such that the ts-ignores are not missed?
            constructor(data, options, ...args) {
                // @ts-ignore
                super(data, options, args);
                // @ts-ignore
                this.afterConstructor(data, options);
            }
        },
        // This denotes to the superclass that we have patched the model, which is checked to test that we have overwritten
        // the text correctly
        _a._isTsPatched = true,
        _a;
}
exports.tsPatch = tsPatch;
