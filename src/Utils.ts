// lodash's `snakeCase` method removes dots from the string; this breaks mobx-spine
export function camelToSnake(s: string): string {
    return s.replace(/([A-Z])/g, $1 => '_' + $1.toLowerCase());
}

// lodash's `camelCase` method removes dots from the string; this breaks mobx-spine
export function snakeToCamel(s: string): string {
    if (s.startsWith('_')) {
        return s;
    }
    return s.replace(/_\w/g, m => m[1].toUpperCase());
}


// Interface and not type, because types cannot do recursion?
interface RelationTree {
    [member: string]: RelationTree
}

/**
 * Get a list of relations e.g., ['foo', 'bar', 'foo.baz'], and return them into a tree format, i.e.
 *
 * {'foo': {'baz': {}}, 'bar': {}}
 *
 * @param relations
 */
export function createRelationTree(relations: string[]): RelationTree {
    const tree: RelationTree = {};

    /**
     * Recursively insert the list of subrelations to the tree
     *
     * @param tree
     * @param subRelations Split list of the relations, i.e. 'foo.bar.baz' becomes ['foo', 'bar', 'baz']
     */
    function insertIntoTree(tree: RelationTree, subRelations: string[]) {
        if (subRelations.length === 0) {
            return;
        }

        const headRelation: string = subRelations.shift();
        if (!(headRelation in tree)) {
            tree[headRelation] = {};
        }

        insertIntoTree(tree[headRelation], subRelations);
    }

    relations.forEach(relation => insertIntoTree(tree, relation.split('.')));


    return tree;
}