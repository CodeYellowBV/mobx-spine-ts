import {Model, ModelData} from "../Model";
import {modelResponseAdapter, ResponseAdapter, Response} from "./BinderResponse";
import {createRelationTree} from "../Utils";
import {isObject} from "lodash";
import {Store} from "../Store";

/**
 * The Model.fromBackend method, in a seperate file, because the relationship parsing is too damn complicated to be
 * done directly in the model
 *
 * @param input
 */
export default function fromBackend<T>(this: Model<T>, input: ResponseAdapter<T>): void {
    const response = modelResponseAdapter(input);
    const {data} = response;

    parseFromBackendRelations.bind(this)(response);

    if (data) {
        this.parse(data as T);
    }
}

/**
 * When we get the backend data, we also get the data from the relations. This method parses the backend
 * relations for this model
 * @param response
 */
function parseFromBackendRelations<T>(this: Model<T>, response: Response<T>): void {
    const relationTree = createRelationTree(this.__activeRelations);
    if (!response.data) {
        return;
    }

    for (const relationName in relationTree) {
        const relations = this.relations();

        // Hack for now, Relations give a Store or Model class reference. We still need to figure how to check for this references
        // For now we initiate the relations, and then check with instanceof.  if it is a store or a model
        // @ts-ignore
        const relation = new relations[relationName]();
        if (relation instanceof Store) {
            parseManyToRelations.bind(this)(response, relationName)
        } else if (relation instanceof Model) {
            parseOneToRelations.bind(this)(response, relationName)
        } else {
            throw Error('ParseFromBackendRelation: Expect relation to by either a store or a model')
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
function filterWithMapping<T>(response: Response<T>, backendRelationName: string): { [key: string]: string } {
    // For the withMapping, we need to strip the relation part of the withMapping. i.e. {"kind.breed": "animal_breed"}
    // for relation "kind", becomes {"breed": "animal_breed"}. WithMapping not belonging to this relation are ignored
    const filteredWithMapping: { [key: string]: string } = {}

    for (const withMappingName in response.with_mapping) {
        if (!withMappingName.startsWith(`${backendRelationName}.`)) {
            continue;
        }

        // +1 is to account for the .
        const newKey = withMappingName.substr(backendRelationName.length + 1);
        filteredWithMapping[newKey] = response.with_mapping[withMappingName];
    }

    return filteredWithMapping;
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
function filterActiveRelations(parentActiveRelations: string[], relation: string): string[] {
    return parentActiveRelations.filter((activeRelation: string) => {
        //if we do not have subrelations, do not include it
        if (activeRelation === relation) {
            return false;
        }
        return activeRelation.startsWith(relation);
    }).map(
        (activeRelation) => {
            // Add one to include for the .
            return activeRelation.substr(relation.length + 1);
        }
    )
}

/**
 * The simplest relation, where we have a foreign key to an external object. Can either be a OneToMany, or a OneToOne.
 * But that doesn't matter.
 *
 * @param response
 * @param relationName
 */
function parseOneToRelations<T>(this: Model<T>, response: Response<T>, relationName: string): void {
    const backendRelationName = this.constructor['toBackendAttrKey'](relationName);
    // The primary key of the relation
    const relationDataRaw: number | object | null = response.data[backendRelationName];

    // Case 0?: The relation is not given in the response. Just ignore it.
    if (relationDataRaw === undefined) {
        return;
    }

    // Case 1: The relation is None. Then, we set the relation to a new object without a pk
    // e.g. {foo: null} => this.foo = new Foo();
    if (relationDataRaw === null) {
        const Relation = this.relations()[relationName];
        // @ts-ignore
        this[relationName] = new Relation();
        return;
    }


    let relationData: object;
    if (isObject(relationDataRaw)) {
        // Case 2, we have a nested relation. Then we take the data directly
        relationData = relationDataRaw as object;
    } else {
        // Case 3 we have a numeric id. Now find the necessary model from the with data
        const backendModelName = response.with_mapping[backendRelationName];
        const collectionData: object[] = response.with[backendModelName];
        relationData = collectionData.find(model => model['id'] === relationDataRaw as number);
    }

    const filteredWithMapping = filterWithMapping(response, backendRelationName);


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
function parseManyToRelations<T, U extends ModelData>(this: Model<T>, response: Response<T>, relationName: string): void {
    const backendRelationName = this.constructor['toBackendAttrKey'](relationName);
    // The primary keys of the relation
    const relationDataRaw: number[] | ModelData[] = response.data[backendRelationName];

    // Heuristic if we have a nested relation. If it is not nested, it is a number. Otherwise it is an object
    // Relations that are empty are always not nested
    const isNested = relationDataRaw.length && isObject(relationDataRaw[0]);



    // Initate the store
    // @ts-ignore
    const RelationStore = this.relations()[relationName] as Store<U, Model<U>>;


    // @ts-ignore
    this[relationName] = new RelationStore(null, {
        relations: filterActiveRelations(this.__activeRelations, relationName)
    });



    let relationData: ModelData[] = [];
    if (isNested) {
        relationData = response.data[backendRelationName];

    } else {
        // Find the collection data that we are references
        const backendModelName = response.with_mapping[backendRelationName];
        const collectionData: object[] = response.with[backendModelName];

        // Get the actual array of model data for the store
        relationData = collectionData.filter((modelData: ModelData) => {
            const relationId = modelData.id;
            return relationDataRaw.includes(relationId);
        });
    }


    const filteredWithMapping = filterWithMapping(response, backendRelationName);

    // And fill the store
    this[relationName].fromBackend({
        data: relationData,
        with: response.with,
        meta: {},
        with_mapping: filteredWithMapping
    });
}