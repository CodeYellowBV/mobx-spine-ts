"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Model_1 = require("../Model");
var BinderResponse_1 = require("./BinderResponse");
var Utils_1 = require("../Utils");
var lodash_1 = require("lodash");
var Store_1 = require("../Store");
/**
 * The Model.fromBackend method, in a seperate file, because the relationship parsing is too damn complicated to be
 * done directly in the model
 *
 * @param input
 */
function fromBackend(input) {
    var response = BinderResponse_1.modelResponseAdapter(input);
    var data = response.data;
    parseFromBackendRelations.bind(this)(response);
    if (data) {
        this.parse(data);
    }
}
exports.default = fromBackend;
/**
 * When we get the backend data, we also get the data from the relations. This method parses the backend
 * relations for this model
 * @param response
 */
function parseFromBackendRelations(response) {
    var relationTree = Utils_1.createRelationTree(this.__activeRelations);
    if (!response.data) {
        return;
    }
    for (var relationName in relationTree) {
        var relations = this.relations();
        // Hack for now, Relations give a Store or Model class reference. We still need to figure how to check for this references
        // For now we initiate the relations, and then check with instanceof.  if it is a store or a model
        // @ts-ignore
        var relation = new relations[relationName]();
        if (relation instanceof Store_1.Store) {
            parseManyToRelations.bind(this)(response, relationName);
        }
        else if (relation instanceof Model_1.Model) {
            parseOneToRelations.bind(this)(response, relationName);
        }
        else {
            throw Error('ParseFromBackendRelation: Expect relation to be either a store or a model');
        }
    }
}
/**
 * Filter the with mapping, to strip down a relationname, such that it can be used in recursive calls
 *
 * e.g. if we get the with_mapping
 *
 * {
 *     foo: bla,
 *     foo.baz: bla2,
 *     foo.biz: bla3
 *     bar: bla4
 * }
 *
 * and relationName: foo
 *
 * then we get the following results:
 *
 * {
 *     baz: bla2,
 *     biz: bla3
 * }
 *
 * this allows the with mapping to be used recursively
 * @param response
 * @param relationName
 */
function filterWithMapping(response, backendRelationName) {
    // For the withMapping, we need to strip the relation part of the withMapping. i.e. {"kind.breed": "animal_breed"}
    // for relation "kind", becomes {"breed": "animal_breed"}. WithMapping not belonging to this relation are ignored
    var filteredWithMapping = {};
    for (var withMappingName in response.with_mapping) {
        if (!withMappingName.startsWith(backendRelationName + ".")) {
            continue;
        }
        // +1 is to account for the .
        var newKey = withMappingName.substr(backendRelationName.length + 1);
        filteredWithMapping[newKey] = response.with_mapping[withMappingName];
    }
    return filteredWithMapping;
}
function filterWithRelatedNameMapping(response, backendRelationName) {
    var filteredWithRelatedNameMapping = {};
    for (var withRelatedNameMappingName in response.with_related_name_mapping) {
        if (!withRelatedNameMappingName.startsWith(backendRelationName + ".")) {
            continue;
        }
        // +1 is to account for the .
        var newKey = withRelatedNameMappingName.substr(backendRelationName.length + 1);
        filteredWithRelatedNameMapping[newKey] = response.with_related_name_mapping[withRelatedNameMappingName];
    }
    return filteredWithRelatedNameMapping;
}
/**
 * Filter the list of active relations of a model for the child relations, by stripping the base relation
 *
 * e.g. input:
 *
 * [
 *   'foo',
 *   'foo.bar',
 *   'foo.baz',
 *   'bla',
 * ], 'foo'
 *
 * gives:
 *
 * ['bar', 'baz']
 * @param parentActiveRelations
 * @param relation
 */
function filterActiveRelations(parentActiveRelations, relation) {
    return parentActiveRelations.filter(function (activeRelation) {
        //if we do not have subrelations, do not include it
        if (activeRelation === relation) {
            return false;
        }
        return activeRelation.startsWith(relation);
    }).map(function (activeRelation) {
        // Add one to include for the .
        return activeRelation.substr(relation.length + 1);
    });
}
/**
 * The simplest relation, where we have a foreign key to an external object. Can either be a OneToMany, or a OneToOne.
 * But that doesn't matter.
 *
 * @param response
 * @param relationName
 */
function parseOneToRelations(response, relationName) {
    var backendRelationName = this.constructor['toBackendAttrKey'](relationName);
    // The primary key of the relation
    var relationDataRaw = response.data[backendRelationName];
    // Case 0?: The relation is not given in the response. Just ignore it.
    if (relationDataRaw === undefined) {
        return;
    }
    // Case 1: The relation is None. Then, we set the relation to a new object without a pk
    // e.g. {foo: null} => this.foo = new Foo();
    if (relationDataRaw === null) {
        this[relationName].clear();
        return;
    }
    var relationData;
    if (lodash_1.isObject(relationDataRaw)) {
        // Case 2, we have a nested relation. Then we take the data directly
        relationData = relationDataRaw;
    }
    else {
        // Case 3 we have a numeric id. Now find the necessary model from the with data
        var backendModelName = response.with_mapping[backendRelationName];
        var collectionData = response.with[backendModelName];
        if (collectionData === undefined) {
            return;
        }
        relationData = collectionData.find(function (model) { return model['id'] === relationDataRaw; });
    }
    var filteredWithMapping = filterWithMapping(response, backendRelationName);
    this[relationName].fromBackend({
        data: relationData,
        with: response.with,
        meta: {},
        with_mapping: filteredWithMapping
    });
}
/**
 * The more complicated relation, in case we have a relation to a store. Eithery many to one, or many to many
 *
 * @param response
 * @param relationName
 */
function parseManyToRelations(response, relationName) {
    var backendRelationName = this.constructor['toBackendAttrKey'](relationName);
    // The primary keys of the relation
    var relationDataRaw = response.data[backendRelationName];
    if (!relationDataRaw) {
        // Handle reverse relations if needed
        var withKey = response.with_mapping[backendRelationName];
        relationDataRaw = [];
        if (withKey) {
            var withData = response.with[withKey];
            if (response.with_related_name_mapping) {
                var reverseIdKey = response.with_related_name_mapping[backendRelationName];
                for (var _i = 0, withData_1 = withData; _i < withData_1.length; _i++) {
                    var withObject = withData_1[_i];
                    if (withObject[reverseIdKey] === response.data['id']) {
                        relationDataRaw.push(withObject.id);
                    }
                }
            }
        }
        response.data[backendRelationName] = relationDataRaw;
    }
    // Heuristic if we have a nested relation. If it is not nested, it is a number. Otherwise it is an object
    // Relations that are empty are always not nested
    var isNested = relationDataRaw.length && lodash_1.isObject(relationDataRaw[0]);
    // Initate the store
    // @ts-ignore
    var RelationStore = this.relations()[relationName];
    // @ts-ignore
    // this[relationName] = new RelationStore({
    //     relations: filterActiveRelations(this.__activeRelations, relationName)
    // });
    var relationData = [];
    if (isNested) {
        relationData = response.data[backendRelationName];
    }
    else {
        // Find the collection data that we are references
        var backendModelName = response.with_mapping[backendRelationName];
        var collectionData = response.with[backendModelName];
        // Get the actual array of model data for the store
        if (collectionData) {
            relationData = collectionData.filter(function (modelData) {
                var relationId = modelData.id;
                return relationDataRaw.includes(relationId);
            });
        }
    }
    var relevant = false;
    for (var candidateName in response.with_mapping) {
        if (candidateName === backendRelationName) {
            if (response.data[backendRelationName] !== undefined) {
                relevant = true;
            }
            else if (response.with[response.with_mapping[candidateName]] && response.with_related_name_mapping[backendRelationName]) {
                relevant = true;
            }
        }
        if (candidateName.startsWith(backendRelationName + '.')) {
            relevant = true;
        }
    }
    if (relevant) {
        var filteredWithMapping = filterWithMapping(response, backendRelationName);
        var filteredWithRelatedNameMapping = filterWithRelatedNameMapping(response, backendRelationName);
        // And fill the store
        this[relationName].fromBackend({
            data: relationData,
            with: response.with,
            meta: {},
            with_mapping: filteredWithMapping,
            with_related_name_mapping: filteredWithRelatedNameMapping
        });
    }
}
