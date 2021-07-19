export declare function camelToSnake(s: string): string;
export declare function snakeToCamel(s: string): string;
export declare function relationsToNestedKeys(relations: any): {};
export declare function forNestedRelations(model: any, nestedRelations: RelationTree, fn: (value: any) => void): void;
interface RelationTree {
    [member: string]: RelationTree;
}
/**
 * Get a list of relations e.g., ['foo', 'bar', 'foo.baz'], and return them into a tree format, i.e.
 *
 * {'foo': {'baz': {}}, 'bar': {}}
 *
 * @param relations
 */
export declare function createRelationTree(relations: string[]): RelationTree;
export {};
