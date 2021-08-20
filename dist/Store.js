"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
var mobx_1 = require("mobx");
var BinderResponse_1 = require("./Model/BinderResponse");
var lodash_1 = require("lodash");
var Store = /** @class */ (function () {
    function Store(rawOptions) {
        var _this = this;
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
            this.url = function () {
                var bname = _this.constructor['backendResourceName'];
                if (bname) {
                    return "/" + bname + "/";
                }
                return null;
            };
        }
        this['__testingId'] = Math.floor(100000 * Math.random());
        var options = rawOptions || {};
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
    Store.prototype.__getApi = function () {
        if (!this.api) {
            throw new Error('[mobx-spine] You are trying to perform an API request without an `api` property defined on the store.');
        }
        if (!lodash_1.result(this, 'url')) {
            throw new Error('[mobx-spine] You are trying to perform an API request without a `url` property defined on the store.');
        }
        return this.api;
    };
    Store.prototype.fromBackend = function (input) {
        var _this = this;
        var response = BinderResponse_1.modelResponseAdapter(input);
        var responseData = lodash_1.isArray(response.data) ? response.data : [response.data];
        this.models.replace(responseData.map(function (modelData) {
            var model = _this._newModel();
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
    };
    Store.prototype.initialize = function () {
        // Subclasses can override this
    };
    Object.defineProperty(Store.prototype, "isLoading", {
        get: function () {
            return this.__pendingRequestCount > 0;
        },
        enumerable: false,
        configurable: true
    });
    Store.prototype._newModel = function (data) {
        return new this.Model(data, {
            store: this,
            relations: this.__activeRelations
        });
    };
    Object.defineProperty(Store.prototype, "length", {
        get: function () {
            return this.models.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Store.prototype, "hasUserChanges", {
        get: function () {
            return this.hasSetChanges || this.models.some(function (m) { return m.hasUserChanges; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Store.prototype, "hasSetChanges", {
        // TODO: Maybe we can keep track of what got added and what got
        // removed exactly.  For now this should be enough.
        get: function () {
            return this.__setChanged;
        },
        enumerable: false,
        configurable: true
    });
    Store.prototype.clearSetChanges = function () {
        this.__setChanged = false;
    };
    Store.prototype.map = function (mapping) {
        return lodash_1.map(this.models, mapping);
    };
    Store.prototype.toBackendAll = function (options) {
        if (options === void 0) { options = {}; }
        var relevantModels = options.onlyChanges ? this.models.filter(function (model) { return model.isNew || model.hasUserChanges; }) : this.models;
        var modelData = relevantModels.map(function (model) { return model.toBackendAll(options); });
        var data = [];
        var relations = {};
        modelData.forEach(function (model) {
            data = data.concat(model.data);
            lodash_1.forIn(model.relations, function (relModel, key) {
                relations[key] = relations[key]
                    ? relations[key].concat(relModel)
                    : relModel;
                relations[key] = lodash_1.uniqBy(relations[key], 'id');
            });
        });
        return { data: data, relations: relations };
    };
    // Create a new instance of this store with a predicate applied.
    // This new store will be automatically kept in-sync with all models that adhere to the predicate.
    Store.prototype.virtualStore = function (params) {
        var _this = this;
        // @ts-ignore
        var store = new this.constructor({
            relations: this.__activeRelations,
            comparator: params.comparator,
        });
        // Oh gawd MobX is so awesome.
        var events = mobx_1.autorun(function () {
            var models = _this.filter(params.filter);
            store.models.replace(models);
            store.sort();
            // When the parent store is busy, make sure the virtual store is
            // also busy.
            store.__pendingRequestCount = _this.__pendingRequestCount;
        });
        store.unsubscribeVirtualStore = events;
        return store;
    };
    Store.prototype.__parseNewIds = function (idMaps) {
        this.each(function (model) { return model.__parseNewIds(idMaps); });
    };
    Store.prototype.toJS = function () {
        return this.models.map(function (model) { return model.toJS(); });
    };
    // Methods for pagination.
    Store.prototype.getPageOffset = function () {
        return (this.__state.currentPage - 1) * this.__state.limit;
    };
    Store.prototype.setLimit = function (limit) {
        this.__state.limit = limit || null;
    };
    Object.defineProperty(Store.prototype, "totalPages", {
        get: function () {
            if (!this.__state.limit) {
                return 0;
            }
            return Math.ceil(this.__state.totalRecords / this.__state.limit);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Store.prototype, "currentPage", {
        get: function () {
            return this.__state.currentPage;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Store.prototype, "hasNextPage", {
        get: function () {
            return this.__state.currentPage + 1 <= this.totalPages;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Store.prototype, "hasPreviousPage", {
        get: function () {
            return this.__state.currentPage > 1;
        },
        enumerable: false,
        configurable: true
    });
    Store.prototype.getNextPage = function () {
        if (!this.hasNextPage) {
            throw new Error('[mobx-spine] There is no next page');
        }
        this.__state.currentPage += 1;
        return this.fetch();
    };
    Store.prototype.getPreviousPage = function () {
        if (!this.hasPreviousPage) {
            throw new Error('[mobx-spine] There is no previous page');
        }
        this.__state.currentPage -= 1;
        return this.fetch();
    };
    Store.prototype.setPage = function (page, options) {
        if (page === void 0) { page = 1; }
        if (options === void 0) { options = {}; }
        if (page <= 0) {
            throw new Error("[mobx-spine] Page (" + page + ") should be greater than 0");
        }
        if (page > (this.totalPages || 1)) {
            throw new Error("[mobx-spine] Page (" + page + ") should be between 1 and " + (this.totalPages || 1));
        }
        this.__state.currentPage = page;
        if (options.fetch === undefined || options.fetch) {
            return this.fetch();
        }
        return Promise.resolve();
    };
    Store.prototype.clear = function () {
        var length = this.models.length;
        this.models.clear();
        if (length > 0) {
            this.__setChanged = true;
        }
    };
    Store.prototype.buildFetchData = function (options) {
        return Object.assign(this.__getApi().buildFetchStoreParams(this), this.params, options.data);
    };
    Store.prototype.fetch = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var data = this.buildFetchData(options);
        var promise = this.wrapPendingRequestCount(this.__getApi()
            .fetchStore({
            url: options.url || lodash_1.result(this, 'url'),
            data: data,
            requestOptions: lodash_1.omit(options, 'data'),
        })
            .then(mobx_1.action(function (res) {
            _this.__state.totalRecords = res.totalRecords;
            _this.fromBackend(res);
            return res.response;
        })));
        return promise;
    };
    Store.prototype.parse = function (models) {
        if (!lodash_1.isArray(models)) {
            throw Error("Parameter supplied to `parse()` is not an array, got: " + JSON.stringify(models));
        }
        // Parse does not mutate __setChanged, as it is used in
        // fromBackend in the model...
        this.models.replace(models.map(this._newModel.bind(this)));
        this.sort();
        return this;
    };
    Store.prototype.parseValidationErrors = function (valErrors) {
        this.each(function (model) {
            model.parseValidationErrors(valErrors);
        });
    };
    Store.prototype.clearValidationErrors = function () {
        this.each(function (model) {
            model.clearValidationErrors();
        });
    };
    /**
     * Adds model(s) with the given model value(s). These new model(s) will be
     * returned.
     */
    Store.prototype.add = function (rawModels) {
        var _this = this;
        var singular = !lodash_1.isArray(rawModels);
        var models = singular ? [rawModels] : rawModels.slice();
        var modelInstances = models.map(this._newModel.bind(this));
        modelInstances.forEach(function (modelInstance) {
            var id = modelInstance['id'];
            if (id && _this.get(id)) {
                throw new Error("A model with the same id " + id + " already exists");
            }
            _this.__setChanged = true;
            _this.models.push(modelInstance);
        });
        this.sort();
        return singular ? modelInstances[0] : modelInstances;
    };
    /**
     * Removes the given model(s) from this store and returns the removed model(s).
     */
    Store.prototype.remove = function (models) {
        var _this = this;
        var singular = !lodash_1.isArray(models);
        var modelArray = singular ? [models] : models.slice();
        modelArray.forEach(function (model) { return _this.models.remove(model); });
        if (modelArray.length > 0) {
            this.__setChanged = true;
        }
        return models;
    };
    /**
     * Removes the model(s) with the given rawID(s) from this store and returns the
     * removed model(s).
     * @param rawIDs The id(s) for which the corresponding model(s) should be removed
     * @returns The removed model(s)
     */
    Store.prototype.removeById = function (rawIDs) {
        var _this = this;
        var singular = !lodash_1.isArray(rawIDs);
        var ids = singular ?
            [parseInt('' + rawIDs)] :
            rawIDs.map(function (rawID) { return parseInt('' + rawID); });
        if (ids.some(isNaN)) {
            throw new Error("[mobx-spine] Can't remove a model by id that is Not A Number: " + JSON.stringify(rawIDs));
        }
        var models = ids.map(function (id) { return _this.get(id); });
        models.forEach(function (model) {
            if (model) {
                _this.models.remove(model);
                _this.__setChanged = true;
            }
        });
        return models;
    };
    /**
     * Sorts (the models in) this store by the `comparator` of this store. If this
     * store doesn't have a comparator, this method won't do anything.
     * @returns this store
     */
    Store.prototype.sort = function (options) {
        if (options === void 0) { options = {}; }
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
    };
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
    Store.prototype.sortBy = function (iteratees) {
        return lodash_1.sortBy(this.models, iteratees);
    };
    /**
     * Get a model from the store by the id. If it doesn't exist, return null
     *
     * @param id
     */
    Store.prototype.get = function (rawId) {
        var id = (typeof rawId === 'number') ? rawId : parseInt(rawId);
        return this.models.find(
        // @ts-ignore
        function (model) { return model.id === id; });
    };
    /**
     * Gets an array that contains all models in this Store whose id (or, more
     * accurately, primary key value) is included in *ids* (the parameter).
     * @param ids The id's to search for
     */
    Store.prototype.getByIds = function (rawIds) {
        var ids = rawIds.map(function (rawId) { return (typeof rawId === 'number') ? rawId : parseInt(rawId); });
        // @ts-ignore
        return this.models.filter(function (model) { return ids.includes(model.id); });
    };
    Store.prototype.mapByPrimaryKey = function () {
        // @ts-ignore
        return this.map(function (model) { return model.id; });
    };
    /**
     * Returns an array containing all models in this store for which the given
     * predicate returns true.
     */
    Store.prototype.filter = function (predicate) {
        return lodash_1.filter(this.models, predicate);
    };
    /**
     * Returns the first model for which the given predicate returns true, or
     * `undefined` if the predicate didn't return true for a single model.
     */
    Store.prototype.find = function (predicate) {
        return lodash_1.find(this.models, predicate);
    };
    /**
     * Calls the given `callbackFunction` for each model in this store.
     */
    Store.prototype.each = function (callbackFunction) {
        this.models.forEach(callbackFunction);
    };
    /**
     * Calls the given `callbackFunction` for each model in this store.
     */
    Store.prototype.forEach = function (callbackFunction) {
        this.models.forEach(callbackFunction);
    };
    /**
     * Get the model at the given `index` (position) in the array, or null if this
     * store doesn't have a model with the given `index`.
     *
     * This method also accepts a negative `index`: -1 yields the last model,
     * -2 yields the second-last model, ...
     */
    Store.prototype.at = function (index) {
        if (index < 0) {
            index += this.length;
        }
        if (index >= this.length) {
            throw new Error("[mobx-spine] Index " + index + " is out of bounds (max " + (this.length - 1) + ").");
        }
        return this.models[index];
    };
    Object.defineProperty(Store.prototype, "backendResourceName", {
        set: function (_value) {
            throw new Error('[mobx-spine] `backendResourceName` should be a static property on the store,');
        },
        enumerable: false,
        configurable: true
    });
    Store.prototype.wrapPendingRequestCount = function (promise) {
        var _this = this;
        this.__pendingRequestCount++;
        return promise
            .then(function (res) {
            _this.__pendingRequestCount--;
            return res;
        })
            .catch(function (err) {
            _this.__pendingRequestCount--;
            throw err;
        });
    };
    Store.prototype.saveAllFiles = function (relations) {
        if (relations === void 0) { relations = {}; }
        var promises = [];
        for (var _i = 0, _a = this.models; _i < _a.length; _i++) {
            var model = _a[_i];
            promises.push(model.saveAllFiles(relations));
        }
        return Promise.all(promises);
    };
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
    return Store;
}());
exports.Store = Store;
