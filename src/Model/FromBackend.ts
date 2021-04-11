import {Model} from "../Model";
import {modelResponseAdapter, ResponseAdapter, Response} from "./BinderResponse";
import {createRelationTree} from "../Utils";


export default function fromBackend<T>(this: Model<T>, input: ResponseAdapter<T>): void {
    const response = modelResponseAdapter(input);
    const {data} = response;

    __parseFromBackendRelations.bind(this)(response);


    if (data) {
        this.parse(data);
    }
}

/**
 * When we get the backend data, we also get the data from the relations. This method parses the backend
 * relations for this model
 * @param response
 */
function __parseFromBackendRelations<T>(this: Model<T>, response: Response<T>): void {
    const relationTree = createRelationTree(this.__activeRelations);


    for (const relationName in relationTree) {
        const backendRelationName = this.constructor['toBackendAttrKey'](relationName);
        // The primary key of the relation
        const relationId: number = response.data[backendRelationName]
        debugger;

        // Not set relations do not have to be traversed
        if (!relationId) {
            const Relation = this.relations()[relationName];
            // @ts-ignore
            this[relationName] = new Relation();
            continue;
        }

        const backendModelName = response.with_mapping[backendRelationName];
        const collectionData: object[] = response.with[backendModelName];
        const relationData = collectionData.find(model => model['id'] === relationId);

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
}
