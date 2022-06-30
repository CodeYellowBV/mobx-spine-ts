"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRelationTree = exports.forNestedRelations = exports.relationsToNestedKeys = exports.snakeToCamel = exports.camelToSnake = void 0;
// lodash's `snakeCase` method removes dots from the string; this breaks mobx-spine
function camelToSnake(s) {
    return s.replace(/([A-Z])/g, $1 => '_' + $1.toLowerCase());
}
exports.camelToSnake = camelToSnake;
// lodash's `camelCase` method removes dots from the string; this breaks mobx-spine
function snakeToCamel(s) {
    if (s.startsWith('_')) {
        return s;
    }
    return s.replace(/_\w/g, m => m[1].toUpperCase());
}
exports.snakeToCamel = snakeToCamel;
function relationsToNestedKeys(relations) {
    const nestedRelations = {};
    relations.forEach(rel => {
        let current = nestedRelations;
        const components = rel.split('.');
        const len = components.length;
        for (var i = 0; i < len; ++i) {
            const head = components[i];
            if (current[head] === undefined) {
                current[head] = {};
            }
            current = current[head];
        }
    });
    return nestedRelations;
}
exports.relationsToNestedKeys = relationsToNestedKeys;
// Use output of relationsToNestedKeys to iterate each relation, fn is called on each model and store.
function forNestedRelations(model, nestedRelations, fn) {
    Object.keys(nestedRelations).forEach(key => {
        if (!model[key]) {
            // Check if passed relation is defined in relations
            throw new Error(`Relation '${key}' is not defined in relations`);
        }
        if (Object.keys(nestedRelations[key]).length > 0) {
            if (model[key].forEach) {
                model[key].forEach(m => {
                    forNestedRelations(m, nestedRelations[key], fn);
                });
                fn(model);
            }
            else {
                forNestedRelations(model[key], nestedRelations[key], fn);
            }
        }
        if (model[key].forEach) {
            model[key].forEach(fn);
        }
        fn(model[key]);
    });
}
exports.forNestedRelations = forNestedRelations;
/**
 * Get a list of relations e.g., ['foo', 'bar', 'foo.baz'], and return them into a tree format, i.e.
 *
 * {'foo': {'baz': {}}, 'bar': {}}
 *
 * @param relations
 */
function createRelationTree(relations) {
    const tree = {};
    /**
     * Recursively insert the list of subrelations to the tree
     *
     * @param tree
     * @param subRelations Split list of the relations, i.e. 'foo.bar.baz' becomes ['foo', 'bar', 'baz']
     */
    function insertIntoTree(tree, subRelations) {
        if (subRelations.length === 0) {
            return;
        }
        const headRelation = subRelations.shift();
        if (!(headRelation in tree)) {
            tree[headRelation] = {};
        }
        insertIntoTree(tree[headRelation], subRelations);
    }
    relations.forEach(relation => insertIntoTree(tree, relation.split('.')));
    return tree;
}
exports.createRelationTree = createRelationTree;
