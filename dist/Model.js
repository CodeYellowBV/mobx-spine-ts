"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var mobx_1 = require("mobx");
var Utils_1 = require("./Utils");
var lodash_1 = require("lodash");
var Store_1 = require("./Store");
var FromBackend_1 = __importDefault(require("./Model/FromBackend"));
function concatInDict(dict, key, value) {
    dict[key] = dict[key] ? dict[key].concat(value) : value;
}
// Find the relation name before the first dot, and include all other relations after it
// Example: input `animal.kind.breed` output -> `['animal', 'kind.breed']`
var RE_SPLIT_FIRST_RELATION = /([^.]+)\.(.+)/;
var Model = /** @class */ (function () {
    function Model(data, options) {
        var _this = this;
        this.cid = lodash_1.uniqueId('m');
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
            this.urlRoot = function () {
                var bname = _this.constructor['backendResourceName'];
                if (bname) {
                    return "/" + bname + "/";
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
    Model.prototype.afterConstructor = function (data, options) {
        var _this = this;
        options = options || {};
        this.__store = options.store;
        // Fin all the attributes
        lodash_1.forIn(this, function (value, key) {
            // Keys startin with __ are internal
            if (key.startsWith('__')) {
                return;
            }
            if (!mobx_1.isObservableProp(_this, key)) {
                return;
            }
            _this.__attributes.push(key);
            var newValue = value;
            // An array or object observable can be mutated, so we want to ensure we always have
            // the original not-yet-mutated object/array.
            if (mobx_1.isObservableArray(value)) {
                newValue = value.slice();
            }
            else if (mobx_1.isObservableObject(value)) {
                newValue = Object.assign({}, value);
            }
            _this.__originalAttributes[key] = newValue;
        });
        if (options.relations) {
            this.__parseRelations(options.relations);
        }
        // Parse the initial data
        if (data) {
            this.parse(data);
        }
        this.initialize();
    };
    Model.prototype.setFetchParams = function (params) {
        this.__fetchParams = Object.assign({}, params);
    };
    Model.prototype.wrapPendingRequestCount = function (promise) {
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
    /**
     * Get a dictionary of all the data points, and initiate a model from thiss
     * @param data
     */
    Model.prototype.parse = function (data) {
        var _this = this;
        if (!lodash_1.isPlainObject(data)) {
            throw Error("Parameter supplied to `parse()` is not an object, got: " + JSON.stringify(data));
        }
        lodash_1.forIn(data, function (value, key) {
            var attr = _this.constructor['fromBackendAttrKey'](key);
            // parse normal attributes
            if (_this.__attributes.includes(attr)) {
                _this[attr] = _this.__parseAttr(attr, value);
            }
            else if (_this.__activeCurrentRelations.includes(attr)) {
                // Parse the relations
                if (lodash_1.isPlainObject(value) || (lodash_1.isArray(value) && (lodash_1.isPlainObject(lodash_1.get(value, '[0]')) || value['length'] === 0))) {
                    _this[attr].parse(value);
                }
                else if (value === null) {
                    // The relation is cleared.
                    _this[attr].clear();
                }
            }
            else {
                console.warn("Object has no attribute " + attr + ". This value is ignored in the bootstrap");
            }
        });
        return this;
    };
    Model.prototype.__parseAttr = function (attr, value) {
        var casts = this.casts();
        var cast = casts[attr];
        if (cast !== undefined) {
            return cast.parse(attr, value);
        }
        return value;
    };
    Model.prototype.fileFields = function () {
        return this.constructor['fileFields'];
    };
    Model.prototype.pickFields = function () {
        return this.constructor['pickFields'];
    };
    Model.prototype.omitFields = function () {
        return this.constructor['omitFields'];
    };
    Model.prototype.casts = function () {
        return {};
    };
    Object.defineProperty(Model.prototype, "backendValidationErrors", {
        get: function () {
            return this.__backendValidationErrors;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "fieldFilter", {
        get: function () {
            var pickFields = this.pickFields();
            var omitFields = this.omitFields();
            return function (name) { return (!pickFields || pickFields.includes(name)) && !omitFields.includes(name); };
        },
        enumerable: false,
        configurable: true
    });
    Model.prototype.__toJSAttr = function (attr, value) {
        var casts = this.casts();
        var cast = casts[attr];
        if (cast !== undefined) {
            return mobx_1.toJS(cast.toJS(attr, value));
        }
        return mobx_1.toJS(value);
    };
    Model.prototype.toJS = function () {
        var _this = this;
        var output = {};
        this.__attributes.forEach(function (attr) {
            output[attr] = _this.__toJSAttr(attr, _this[attr]);
        });
        this.__activeCurrentRelations.forEach(function (currentRel) {
            var model = _this[currentRel];
            if (model) {
                output[currentRel] = model.toJS();
            }
        });
        return output;
    };
    Model.prototype.saveFile = function (name) {
        var _this = this;
        var snakeName = Utils_1.camelToSnake(name);
        if (this.__fileChanges[name]) {
            var file = this.__fileChanges[name];
            var data = new FormData();
            data.append(name, file, file.name);
            return (this.api.post("" + this.url + snakeName + "/", data, { headers: { 'Content-Type': 'multipart/form-data' } })
                .then(mobx_1.action(function (res) {
                _this.__fileExists[name] = true;
                delete _this.__fileChanges[name];
                _this.saveFromBackend(res);
            })));
        }
        else if (this.__fileDeletions[name]) {
            if (this.__fileExists[name]) {
                return (this.api.delete("" + this.url + snakeName + "/")
                    .then(mobx_1.action(function () {
                    var _a;
                    _this.__fileExists[name] = false;
                    delete _this.__fileDeletions[name];
                    _this.saveFromBackend({ data: (_a = {},
                            _a[snakeName] = null,
                            _a) });
                })));
            }
            else {
                delete this.__fileDeletions[name];
            }
        }
        else {
            return Promise.resolve();
        }
    };
    // This is just a pass-through to make it easier to override parsing backend responses from the backend.
    // Sometimes the backend won't return the model after a save because e.g. it is created async.
    Model.prototype.saveFromBackend = function (res) {
        return this.fromBackend(res);
    };
    Model.prototype.saveFiles = function () {
        return Promise.all(this.fileFields()
            .filter(this.fieldFilter)
            .map(this.saveFile));
    };
    Model.prototype.clearUserFileChanges = function () {
        this.__fileChanges = {};
        this.__fileDeletions = {};
        this.__fileExists = {};
    };
    Model.prototype.clearValidationErrors = function () {
        var _this = this;
        this.__backendValidationErrors = {};
        this.__activeCurrentRelations.forEach(function (currentRel) {
            _this[currentRel].clearValidationErrors();
        });
    };
    Model.prototype.clearUserFieldChanges = function () {
        this.__changes['clear']();
    };
    Object.defineProperty(Model.prototype, "hasUserChanges", {
        get: function () {
            var _this = this;
            if (this.__changes.length > 0) {
                return true;
            }
            return this.__activeCurrentRelations.some(function (rel) {
                return _this[rel].hasUserChanges;
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "isLoading", {
        get: function () {
            return this.__pendingRequestCount > 0;
        },
        enumerable: false,
        configurable: true
    });
    Model.prototype.saveAllFiles = function (relations) {
        if (relations === void 0) { relations = {}; }
        var promises = [this.saveFiles()];
        for (var _i = 0, _a = Object.keys(relations); _i < _a.length; _i++) {
            var rel = _a[_i];
            promises.push(this[rel].saveAllFiles(relations[rel]));
        }
        return Promise.all(promises);
    };
    Model.prototype.saveAll = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.clearValidationErrors();
        return this.wrapPendingRequestCount(this.__getApi()
            .saveAllModels({
            url: lodash_1.result(this, 'urlRoot'),
            model: this,
            data: this.toBackendAll({
                data: options.data,
                mapData: options.mapData,
                nestedRelations: Utils_1.relationsToNestedKeys(options.relations || []),
                onlyChanges: options.onlyChanges,
            }),
            requestOptions: lodash_1.omit(options, 'relations', 'data', 'mapData'),
        })
            .then(mobx_1.action(function (res) {
            _this.saveFromBackend(res);
            _this.clearUserFieldChanges();
            Utils_1.forNestedRelations(_this, Utils_1.relationsToNestedKeys(options.relations || []), function (relation) {
                if (relation instanceof Model) {
                    relation.clearUserFieldChanges();
                }
                else {
                    relation.clearSetChanges();
                }
            });
            return _this.saveAllFiles(Utils_1.relationsToNestedKeys(options.relations || [])).then(function () {
                _this.clearUserFileChanges();
                Utils_1.forNestedRelations(_this, Utils_1.relationsToNestedKeys(options.relations || []), function (relation) {
                    if (relation instanceof Model) {
                        relation.clearUserFileChanges();
                    }
                });
                return res;
            });
        }))
            .catch(mobx_1.action(function (err) {
            if (err.valErrors) {
                _this.parseValidationErrors(err.valErrors);
            }
            throw err;
        })));
    };
    // After saving a model, we should get back an ID mapping from the backend which looks like:
    // `{ "animal": [[-1, 10]] }`
    Model.prototype.__parseNewIds = function (idMaps) {
        var _this = this;
        var bName = this.constructor['backendResourceName'];
        if (bName && idMaps[bName]) {
            var idMap = idMaps[bName].find(function (ids) { return ids[0] === _this.getInternalId(); });
            if (idMap) {
                // @ts-ignore
                this.id = idMap[1];
            }
        }
        lodash_1.each(this.__activeCurrentRelations, function (relName) {
            var rel = _this[relName];
            rel.__parseNewIds(idMaps);
        });
    };
    Model.prototype.save = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
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
            requestOptions: lodash_1.omit(options, 'url', 'data', 'mapData')
        })
            .then(mobx_1.action(function (res) {
            _this.saveFromBackend(__assign(__assign({}, res), { data: lodash_1.omit(res.data, _this.fileFields().map(Utils_1.camelToSnake)) }));
            _this.clearUserFieldChanges();
            return _this.saveFiles().then(function () {
                _this.clearUserFileChanges();
                return Promise.resolve(res);
            });
        }))
            .catch(mobx_1.action(function (err) {
            if (err.valErrors) {
                _this.parseValidationErrors(err.valErrors);
            }
            throw err;
        })));
    };
    Model.prototype.setInput = function (name, value) {
        var _a;
        if (!this.__attributes.includes(name) && !this.__activeCurrentRelations.includes(name)) {
            throw new Error("[mobx-spine] Field '" + name + "' doesn't exist on the model.");
        }
        if (this.fileFields().includes(name)) {
            if (this.__fileExists[name] === undefined) {
                this.__fileExists[name] = this[name] !== null;
            }
            if (value) {
                this.__fileChanges[name] = value;
                delete this.__fileDeletions[name];
                value = URL.createObjectURL(value) + "?content_type=" + value.type;
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
            if (lodash_1.isArray(value)) {
                this[name].clear();
                this[name].add(value.map(function (v) { return v.toJS(); }));
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
            this.__backendValidationErrors = Object.assign(this.backendValidationErrors, (_a = {}, _a[name] = undefined, _a));
        }
    };
    Model.prototype.toBackend = function (params) {
        var _this = this;
        if (params === undefined) {
            params = {};
        }
        var data = params.data || {};
        var output = {};
        // By default we'll include all fields (attributes+relations), but sometimes you might want to specify the fields to be included.
        var fieldFilter = function (field) {
            if (!_this.fieldFilter(field)) {
                return false;
            }
            if (params.fields) {
                return params.fields.includes(field);
            }
            if (!_this.isNew && params.onlyChanges) {
                var forceFields = params.forceFields || [];
                return (forceFields.includes(field) ||
                    _this.__changes.includes(field) ||
                    (_this[field] instanceof Store_1.Store && _this[field].hasSetChanges) ||
                    // isNew is always true for relations that haven't been saved.
                    // If no property has been tweaked, its id serializes as null.
                    // So, we need to skip saving the id if new and no changes.
                    (_this[field] instanceof Model && _this[field].isNew && _this[field].hasUserChanges));
            }
            return true;
        };
        this.__attributes.filter(fieldFilter).forEach(function (attr) {
            if (!attr.startsWith('_')) {
                output[_this.constructor['toBackendAttrKey'](attr)] = _this.__toJSAttr(attr, _this[attr]);
            }
        });
        // Primary key is always forced to be included.
        // @ts-ignore
        output.id = this.id;
        // Add active relations as id.
        this.__activeCurrentRelations
            .filter(fieldFilter)
            .forEach(function (currentRel) {
            var rel = _this[currentRel];
            var relBackendName = _this.constructor['toBackendAttrKey'](currentRel);
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
    };
    // Useful to reference to this model in a relation - that is not yet saved to the backend.
    Model.prototype.getNegativeId = function () {
        return -parseInt(this.cid.replace('m', ''));
    };
    Model.prototype.getInternalId = function () {
        if (this.isNew) {
            return this.getNegativeId();
        }
        // @ts-ignore
        return this.id;
    };
    Model.prototype.__getApi = function () {
        if (!this.api) {
            throw new Error('[mobx-spine] You are trying to perform an API request without an `api` property defined on the model.');
        }
        if (!lodash_1.result(this, 'urlRoot')) {
            throw new Error('You are trying to perform an API request without a `urlRoot` property defined on the model.');
        }
        return this.api;
    };
    Model.prototype.buildFetchData = function (options) {
        return Object.assign(this.__getApi().buildFetchModelParams(this), this.__fetchParams, options.data);
    };
    Model.prototype.delete = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var removeFromStore = function () {
            return _this.__store ? _this.__store.remove(_this) : null;
        };
        if (options.immediate || this.isNew) {
            removeFromStore();
        }
        if (this.isNew) {
            return Promise.resolve();
        }
        return this.wrapPendingRequestCount(this.__getApi()
            .deleteModel({
            url: options.url || this.url,
            requestOptions: lodash_1.omit(options, ['immediate', 'url']),
        })
            .then(mobx_1.action(function () {
            if (!options.immediate) {
                removeFromStore();
            }
        })));
    };
    Model.prototype.fetch = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (this.isNew) {
            throw new Error('[mobx-spine] Trying to fetch a model without an id');
        }
        var data = this.buildFetchData(options);
        var promise = this.wrapPendingRequestCount(this.__getApi()
            .fetchModel({
            url: options.url || this.url,
            data: data,
            requestOptions: lodash_1.omit(options, ['data', 'url']),
        })
            .then(mobx_1.action(function (res) {
            _this.fromBackend(res);
        })));
        return promise;
    };
    Model.prototype.clear = function () {
        var _this = this;
        lodash_1.forIn(this.__originalAttributes, function (value, key) {
            _this[key] = value;
        });
        this.__activeCurrentRelations.forEach(function (currentRel) {
            _this[currentRel].clear();
        });
    };
    Model.prototype.validationErrorFormatter = function (obj) {
        return obj.code;
    };
    Model.prototype.parseValidationErrors = function (valErrors) {
        var _this = this;
        var bname = this.constructor['backendResourceName'];
        if (valErrors[bname]) {
            var id = this.getInternalId();
            // When there is no id or negative id, the backend may use the string 'null'. Bit weird, but eh.
            var errorsForModel = valErrors[bname][id] || valErrors[bname]['null'];
            if (errorsForModel) {
                var camelCasedErrors = lodash_1.mapKeys(errorsForModel, function (_value, key) {
                    return Utils_1.snakeToCamel(key);
                });
                var formattedErrors = lodash_1.mapValues(camelCasedErrors, function (valError) {
                    return valError.map(_this.validationErrorFormatter);
                });
                this.__backendValidationErrors = formattedErrors;
            }
        }
        this.__activeCurrentRelations.forEach(function (currentRel) {
            _this[currentRel].parseValidationErrors(valErrors);
        });
    };
    Model.prototype.toBackendAll = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var nestedRelations = options.nestedRelations || {};
        var data = this.toBackend({
            data: options.data,
            mapData: options.mapData,
            onlyChanges: options.onlyChanges,
        });
        if (data.id === null) {
            data.id = this.getNegativeId();
        }
        var relations = {};
        this.__activeCurrentRelations.forEach(function (currentRel) {
            var rel = _this[currentRel];
            var relBackendName = _this.constructor['toBackendAttrKey'](currentRel);
            var subRelations = nestedRelations[currentRel];
            if (subRelations !== undefined) {
                if (data[relBackendName] === null) {
                    data[relBackendName] = rel.getNegativeId();
                }
                else if (lodash_1.isArray(data[relBackendName])) {
                    data[relBackendName] = lodash_1.uniq(data[relBackendName].map(function (pk, i) {
                        return pk === null ? rel.at(i).getNegativeId() : pk;
                    }));
                }
                else if (options.onlyChanges && !rel.hasUserChanges) {
                    return;
                }
                var relBackendData = rel.toBackendAll({
                    nestedRelations: subRelations,
                    onlyChanges: options.onlyChanges,
                });
                // Sometimes the backend knows the relation by a different name, e.g. the relation is called
                // `activities`, but the name in the backend is `activity`.
                // In that case, you can add `static backendResourceName = 'activity';` to that model.
                var realBackendName = rel.constructor.backendResourceName || relBackendName;
                if (relBackendData.data.length > 0) {
                    concatInDict(relations, realBackendName, relBackendData.data);
                    // De-duplicate relations based on id
                    // TODO: Avoid serializing recursively multiple times in the first place?
                    // TODO: What if different relations have different "freshness"?
                    relations[realBackendName] = lodash_1.uniqBy(relations[realBackendName], 'id');
                }
                // There could still be changes in nested relations,
                // include those anyway!
                lodash_1.forIn(relBackendData.relations, function (relB, key) {
                    concatInDict(relations, key, relB);
                });
            }
        });
        return { data: [data], relations: relations };
    };
    /**
     * Initiates all the relations. based upon the relations that are active (in the withs).
     *
     * @param activeRelations
     * @protected
     */
    Model.prototype.__parseRelations = function (activeRelations) {
        var _this = this;
        this.__activeRelations = activeRelations;
        var relations = this.relations();
        var relationModels = {};
        activeRelations.forEach(function (activeRelation) {
            // If the activeRelation is null, tis relation is already defined by another activerelations.
            // e.g. town.restaurants.chef && town
            if (activeRelation === null) {
                return;
            }
            var relationNames = activeRelation.split(".");
            var currentRelation = relationNames ? relationNames[0] : activeRelation;
            var otherRelationNames = relationNames[1] && relationNames.slice(1).join(".");
            var currentProperty = relationModels[currentRelation];
            var otherRelations = otherRelationNames && [otherRelationNames];
            if (otherRelations !== undefined || !currentProperty) {
                relationModels[currentRelation] = currentProperty ? currentProperty.concat(otherRelations) : otherRelations;
            }
            if (_this.__attributes.includes(currentRelation)) {
                throw Error("Cannot define `" + currentRelation + "` as both an attribute and a relation. You probably need to remove the attribute.");
            }
            if (!_this.__activeCurrentRelations.includes(currentRelation)) {
                _this.__activeCurrentRelations.push(currentRelation);
            }
        });
        mobx_1.extendObservable(this, lodash_1.mapValues(relationModels, function (otherRelationNames, relationName) {
            var RelationModel = relations[relationName];
            if (!RelationModel) {
                throw Error("Specified relation \"" + relationName + "\" does not exist on model.");
            }
            var options = { relations: otherRelationNames };
            if (RelationModel.prototype instanceof Store_1.Store) {
                // @ts-ignore
                return new RelationModel(options);
            }
            // @ts-ignore
            return new RelationModel(null, options);
        }));
    };
    Object.defineProperty(Model.prototype, "isNew", {
        get: function () {
            // @ts-ignore
            return !this.id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "url", {
        get: function () {
            // @ts-ignore
            var id = this.id;
            return "" + lodash_1.result(this, 'urlRoot') + (id ? id + "/" : '');
        },
        enumerable: false,
        configurable: true
    });
    Model.prototype.relations = function () {
        return {};
    };
    // Empty function, but can be overridden if you want to do something after initializing the model.
    Model.prototype.initialize = function () {
    };
    /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    Model.toBackendAttrKey = function (attrKey) {
        return Utils_1.camelToSnake(attrKey);
    };
    /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    Model.fromBackendAttrKey = function (attrKey) {
        return Utils_1.snakeToCamel(attrKey);
    };
    Object.defineProperty(Model.prototype, "backendResourceName", {
        set: function (v) {
            throw Error('`backendResourceName` should be a static property on the model.');
        },
        enumerable: false,
        configurable: true
    });
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
    ], Model.prototype, "saveAll", null);
    __decorate([
        mobx_1.action
    ], Model.prototype, "save", null);
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
    return Model;
}());
exports.Model = Model;
/**
 * Patches the model classes, such that
 * @param subClass
 */
function tsPatch(subClass) {
    var _a;
    // @ts-ignore
    return _a = /** @class */ (function (_super) {
            __extends(class_1, _super);
            // TODO: we should  be able to fix this with types, such that the ts-ignores are not missed?
            function class_1(data, options) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
                var _this = 
                // @ts-ignore
                _super.call(this, data, options, args) || this;
                // @ts-ignore
                _this.afterConstructor(data, options);
                return _this;
            }
            return class_1;
        }(subClass)),
        // This denotes to the superclass that we have patched the model, which is checked to test that we have overwritten
        // the text correctly
        _a._isTsPatched = true,
        _a;
}
exports.tsPatch = tsPatch;
