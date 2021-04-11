import {Model} from "../Model";
import {modelResponseAdapter, ResponseAdapter, Response} from "./BinderResponse";
import {createRelationTree} from "../Utils";
import {isObject} from "lodash";

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

    for (const relationName in relationTree) {
        parseOneToRelations.bind(this)(response, relationName)
    }
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
    const relationDataRaw: number | object | null = response.data[backendRelationName]

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

    // For the withMapping, we need to strip the relation part of the withMapping. i.e. {"kind.breed": "animal_breed"}
    // for relation "kind", becomes {"breed": "animal_breed"}. WithMapping not belonging to this relation are ignored
    const filteredWithMapping: { [key: string]: string } = {}

    for (const withMappingName in response.with_mapping) {
        if (!withMappingName.startsWith(`${relationName}.`)) {
            continue;
        }

        // +1 is to account for the .
        const newKey = withMappingName.substr(relationName.length + 1);
        filteredWithMapping[newKey] = response.with_mapping[withMappingName];
    }

    this[relationName].fromBackend({
        data: relationData,
        with: response.with,
        meta: {},
        with_mapping: filteredWithMapping
    });
}