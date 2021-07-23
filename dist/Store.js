"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
const mobx_1 = require("mobx");
const BinderResponse_1 = require("./Model/BinderResponse");
const lodash_1 = require("lodash");
class Store {
    constructor(rawOptions) {
        // @ts-ignore
        this.models = [];
        this.__activeRelations = [];
        this.__pendingRequestCount = 0;
        this.__setChanged = false;
        this.__state = {
            currentPage: 1,
            limit: 25,
            totalRecords: 0
        };
        this.params = {};
        this.api = null;
        this.Model = null;
        this.unsubscribeVirtualStore = undefined;
        // Nasty work-around for TS2425
        // @ts-ignore
        if (!this.url) {
            // @ts-ignore
            this.url = () => {
                const bname = this.constructor['backendResourceName'];
                if (bname) {
                    return `/${bname}/`;
                }
                return null;
            };
        }
        const options = rawOptions || {};
        this.__repository = options.repository;
        this.__activeRelations = options.relations || [];
        if (options.limit) {
            this.__state.limit = options.limit;
        }
        if (options.params) {
            this.params = options.params;
        }
        this.comparator = options.comparator;
        this.initialize();
    }
    __getApi() {
        if (!this.api) {
            throw new Error('[mobx-spine] You are trying to perform an API request without an `api` property defined on the store.');
        }
        if (!lodash_1.result(this, 'url')) {
            throw new Error('[mobx-spine] You are trying to perform an API request without a `url` property defined on the store.');
        }
        return this.api;
    }
    fromBackend(input) {
        const response = BinderResponse_1.modelResponseAdapter(input);
        const responseData = lodash_1.isArray(response.data) ? response.data : [response.data];
        this.models.replace(responseData.map((modelData) => {
            const model = this._newModel();
            model.fromBackend({
                data: modelData,
                with: response.with,
                meta: response.meta,
                with_mapping: response.with_mapping,
                with_related_name_mapping: response.with_related_name_mapping
            });
            return model;
        }));
        this.sort();
    }
    initialize() {
        // Subclasses can override this
    }
    get isLoading() {
        return this.__pendingRequestCount > 0;
    }
    _newModel(data) {
        return new this.Model(data, {
            store: this,
            relations: this.__activeRelations
        });
    }
    get length() {
        return this.models.length;
    }
    get hasUserChanges() {
        return this.hasSetChanges || this.models.some(m => m.hasUserChanges);
    }
    // TODO: Maybe we can keep track of what got added and what got
    // removed exactly.  For now this should be enough.
    get hasSetChanges() {
        return this.__setChanged;
    }
    clearSetChanges() {
        this.__setChanged = false;
    }
    map(mapping) {
        return lodash_1.map(this.models, mapping);
    }
    toBackendAll(options = {}) {
        const relevantModels = options.onlyChanges ? this.models.filter(model => model.isNew || model.hasUserChanges) : this.models;
        const modelData = relevantModels.map(model => model.toBackendAll(options));
        let data = [];
        const relations = {};
        modelData.forEach(model => {
            data = data.concat(model.data);
            lodash_1.forIn(model.relations, (relModel, key) => {
                relations[key] = relations[key]
                    ? relations[key].concat(relModel)
                    : relModel;
                relations[key] = lodash_1.uniqBy(relations[key], 'id');
            });
        });
        return { data, relations };
    }
    // Create a new instance of this store with a predicate applied.
    // This new store will be automatically kept in-sync with all models that adhere to the predicate.
    virtualStore(params) {
        // @ts-ignore
        const store = new this.constructor({
            relations: this.__activeRelations,
            comparator: params.comparator,
        });
        // Oh gawd MobX is so awesome.
        const events = mobx_1.autorun(() => {
            const models = this.filter(params.filter);
            store.models.replace(models);
            store.sort();
            // When the parent store is busy, make sure the virtual store is
            // also busy.
            store.__pendingRequestCount = this.__pendingRequestCount;
        });
        store.unsubscribeVirtualStore = events;
        return store;
    }
    __parseNewIds(idMaps) {
        this.each(model => model.__parseNewIds(idMaps));
    }
    toJS() {
        return this.models.map(model => model.toJS());
    }
    // Methods for pagination.
    getPageOffset() {
        return (this.__state.currentPage - 1) * this.__state.limit;
    }
    setLimit(limit) {
        this.__state.limit = limit || null;
    }
    get totalPages() {
        if (!this.__state.limit) {
            return 0;
        }
        return Math.ceil(this.__state.totalRecords / this.__state.limit);
    }
    get currentPage() {
        return this.__state.currentPage;
    }
    get hasNextPage() {
        return this.__state.currentPage + 1 <= this.totalPages;
    }
    get hasPreviousPage() {
        return this.__state.currentPage > 1;
    }
    getNextPage() {
        if (!this.hasNextPage) {
            throw new Error('[mobx-spine] There is no next page');
        }
        this.__state.currentPage += 1;
        return this.fetch();
    }
    getPreviousPage() {
        if (!this.hasPreviousPage) {
            throw new Error('[mobx-spine] There is no previous page');
        }
        this.__state.currentPage -= 1;
        return this.fetch();
    }
    setPage(page = 1, options = {}) {
        if (page <= 0) {
            throw new Error(`[mobx-spine] Page (${page}) should be greater than 0`);
        }
        if (page > (this.totalPages || 1)) {
            throw new Error(`[mobx-spine] Page (${page}) should be between 1 and ${this.totalPages || 1}`);
        }
        this.__state.currentPage = page;
        if (options.fetch === undefined || options.fetch) {
            return this.fetch();
        }
        return Promise.resolve();
    }
    clear() {
        const length = this.models.length;
        this.models.clear();
        if (length > 0) {
            this.__setChanged = true;
        }
    }
    buildFetchData(options) {
        return Object.assign(this.__getApi().buildFetchStoreParams(this), this.params, options.data);
    }
    fetch(options = {}) {
        const data = this.buildFetchData(options);
        const promise = this.wrapPendingRequestCount(this.__getApi()
            .fetchStore({
            url: options.url || lodash_1.result(this, 'url'),
            data,
            requestOptions: lodash_1.omit(options, 'data'),
        })
            .then(mobx_1.action(res => {
            this.__state.totalRecords = res.totalRecords;
            this.fromBackend(res);
            return res.response;
        })));
        return promise;
    }
    parse(models) {
        if (!lodash_1.isArray(models)) {
            throw Error(`Parameter supplied to \`parse()\` is not an array, got: ${JSON.stringify(models)}`);
        }
        // Parse does not mutate __setChanged, as it is used in
        // fromBackend in the model...
        this.models.replace(models.map(this._newModel.bind(this)));
        this.sort();
        return this;
    }
    parseValidationErrors(valErrors) {
        this.each(model => {
            model.parseValidationErrors(valErrors);
        });
    }
    clearValidationErrors() {
        this.each(model => {
            model.clearValidationErrors();
        });
    }
    /**
     * Adds model(s) with the given model value(s). These new model(s) will be
     * returned.
     */
    add(rawModels) {
        const singular = !lodash_1.isArray(rawModels);
        const models = singular ? [rawModels] : rawModels.slice();
        const modelInstances = models.map(this._newModel.bind(this));
        modelInstances.forEach(modelInstance => {
            const id = modelInstance['id'];
            if (id && this.get(id)) {
                throw new Error(`A model with the same id ${id} already exists`);
            }
            this.__setChanged = true;
            this.models.push(modelInstance);
        });
        this.sort();
        return singular ? modelInstances[0] : modelInstances;
    }
    /**
     * Removes the given model(s) from this store and returns the removed model(s).
     */
    remove(models) {
        const singular = !lodash_1.isArray(models);
        const modelArray = singular ? [models] : models.slice();
        modelArray.forEach(model => this.models.remove(model));
        if (modelArray.length > 0) {
            this.__setChanged = true;
        }
        return models;
    }
    /**
     * Removes the model(s) with the given rawID(s) from this store and returns the
     * removed model(s).
     * @param rawIDs The id(s) for which the corresponding model(s) should be removed
     * @returns The removed model(s)
     */
    removeById(rawIDs) {
        const singular = !lodash_1.isArray(rawIDs);
        const ids = singular ?
            [parseInt('' + rawIDs)] :
            rawIDs.map(rawID => parseInt('' + rawID));
        if (ids.some(isNaN)) {
            throw new Error(`[mobx-spine] Can't remove a model by id that is Not A Number: ${JSON.stringify(rawIDs)}`);
        }
        const models = ids.map(id => this.get(id));
        models.forEach(model => {
            if (model) {
                this.models.remove(model);
                this.__setChanged = true;
            }
        });
        return models;
    }
    /**
     * Sorts (the models in) this store by the `comparator` of this store. If this
     * store doesn't have a comparator, this method won't do anything.
     * @returns this store
     */
    sort(options = {}) {
        if (!lodash_1.isPlainObject(options)) {
            throw new Error('Expecting a plain object for options.');
        }
        if (!this.comparator) {
            return this;
        }
        if (typeof this.comparator === 'string') {
            this.models.replace(this.sortBy(this.comparator));
        }
        else {
            this.models.replace(this.models.slice().sort(this.comparator));
        }
        return this;
    }
    /**
     * Sorts the models in this Store by the `iteratees` property (if it is a string)
     * or by the property returned by `iteratees` (if it is a function). For
     * instance, if `iteratees` is `(model) => model.id`, this will sort the models
     * in this Store by their id's. You can achieve the same result by using
     * `iteratees = 'id'`.
     * @param iteratees The function that picks the property by which the models will
     * be sorted, or the name of the property by which the models will be sorted.
     * @returns A new *sorted* array containing the models in this store.
     */
    sortBy(iteratees) {
        return lodash_1.sortBy(this.models, iteratees);
    }
    /**
     * Get a model from the store by the id. If it doesn't exist, return null
     *
     * @param id
     */
    get(rawId) {
        const id = (typeof rawId === 'number') ? rawId : parseInt(rawId);
        return this.models.find(
        // @ts-ignore
        model => model.id === id);
    }
    /**
     * Gets an array that contains all models in this Store whose id (or, more
     * accurately, primary key value) is included in *ids* (the parameter).
     * @param ids The id's to search for
     */
    getByIds(rawIds) {
        const ids = rawIds.map(rawId => (typeof rawId === 'number') ? rawId : parseInt(rawId));
        // @ts-ignore
        return this.models.filter(model => ids.includes(model.id));
    }
    mapByPrimaryKey() {
        // @ts-ignore
        return this.map(model => model.id);
    }
    /**
     * Returns an array containing all models in this store for which the given
     * predicate returns true.
     */
    filter(predicate) {
        return lodash_1.filter(this.models, predicate);
    }
    /**
     * Returns the first model for which the given predicate returns true, or
     * `undefined` if the predicate didn't return true for a single model.
     */
    find(predicate) {
        return lodash_1.find(this.models, predicate);
    }
    /**
     * Calls the given `callbackFunction` for each model in this store.
     */
    each(callbackFunction) {
        this.models.forEach(callbackFunction);
    }
    /**
     * Calls the given `callbackFunction` for each model in this store.
     */
    forEach(callbackFunction) {
        this.models.forEach(callbackFunction);
    }
    /**
     * Get the model at the given `index` (position) in the array, or null if this
     * store doesn't have a model with the given `index`.
     *
     * This method also accepts a negative `index`: -1 yields the last model,
     * -2 yields the second-last model, ...
     */
    at(index) {
        if (index < 0) {
            index += this.length;
        }
        if (index >= this.length) {
            throw new Error(`[mobx-spine] Index ${index} is out of bounds (max ${this.length - 1}).`);
        }
        return this.models[index];
    }
    set backendResourceName(_value) {
        throw new Error('[mobx-spine] `backendResourceName` should be a static property on the store,');
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
    saveAllFiles(relations = {}) {
        const promises = [];
        for (const model of this.models) {
            promises.push(model.saveAllFiles(relations));
        }
        return Promise.all(promises);
    }
}
__decorate([
    mobx_1.observable
], Store.prototype, "models", void 0);
__decorate([
    mobx_1.observable
], Store.prototype, "__pendingRequestCount", void 0);
__decorate([
    mobx_1.observable
], Store.prototype, "__setChanged", void 0);
__decorate([
    mobx_1.observable
], Store.prototype, "__state", void 0);
__decorate([
    mobx_1.observable
], Store.prototype, "params", void 0);
__decorate([
    mobx_1.computed
], Store.prototype, "isLoading", null);
__decorate([
    mobx_1.computed
], Store.prototype, "length", null);
__decorate([
    mobx_1.computed
], Store.prototype, "hasUserChanges", null);
__decorate([
    mobx_1.computed
], Store.prototype, "hasSetChanges", null);
__decorate([
    mobx_1.action
], Store.prototype, "setLimit", null);
__decorate([
    mobx_1.computed
], Store.prototype, "totalPages", null);
__decorate([
    mobx_1.computed
], Store.prototype, "currentPage", null);
__decorate([
    mobx_1.computed
], Store.prototype, "hasNextPage", null);
__decorate([
    mobx_1.computed
], Store.prototype, "hasPreviousPage", null);
__decorate([
    mobx_1.action
], Store.prototype, "getNextPage", null);
__decorate([
    mobx_1.action
], Store.prototype, "getPreviousPage", null);
__decorate([
    mobx_1.action
], Store.prototype, "setPage", null);
__decorate([
    mobx_1.action
], Store.prototype, "clear", null);
__decorate([
    mobx_1.action
], Store.prototype, "fetch", null);
__decorate([
    mobx_1.action
], Store.prototype, "parse", null);
__decorate([
    mobx_1.action
], Store.prototype, "add", null);
__decorate([
    mobx_1.action
], Store.prototype, "remove", null);
__decorate([
    mobx_1.action
], Store.prototype, "removeById", null);
__decorate([
    mobx_1.action
], Store.prototype, "sort", null);
exports.Store = Store;
