import {action, computed, extendObservable, isObservableProp} from 'mobx';
import {camelToSnake, createRelationTree, snakeToCamel} from "./Utils";
import {forIn, uniqueId, result, mapValues, isPlainObject, get, each} from 'lodash'
import {Store} from "./Store";
import {modelResponseAdapter, Response, ResponseAdapter} from "./Model/BinderResponse";

// Find the relation name before the first dot, and include all other relations after it
// Example: input `animal.kind.breed` output -> `['animal', 'kind.breed']`
const RE_SPLIT_FIRST_RELATION = /([^.]+)\.(.+)/;

export interface ModelData {

}

export interface ModelOptions {
    relations?: string[],     // List of active relations for this model
}


export class Model<T extends ModelData> {
    static primaryKey: string = 'id';

    cid: string = uniqueId('m');

    // A list of all attributes of this model
    __attributes: string[] = [];

    // List of relations that are currently active for this model
    __activeRelations: string[] = [];

    __activeCurrentRelations: string[] = [];

    public constructor(data?: T, options?: ModelOptions) {
        // Make sure the model is patched, such that the afterConstruct is called
        if (!this.constructor['_isTsPatched']) {
            throw new Error("Model is not patched with @tsPatch")
        }

    }

    /***
     * If we need to change things to a submodel, we can only access the data after running the constructor of the
     * submodel. This method is called after the constuctor is called
     *
     * @param data
     * @param options
     * @private
     */
    private afterConstructor(data?: T, options?: ModelOptions) {
        options = options || {};

        // Fin all the attributes
        forIn(this, (value: any, key: string) => {

            // Keys startin with __ are internal
            if (key.startsWith('__')) {
                return;
            }

            if (!isObservableProp(this, key)) {
                return;
            }

            this.__attributes.push(key)
        });


        if (options.relations) {
            this.__parseRelations(options.relations);
        }

        // Parse the initial data
        if (data) {
            this.parse(data);
        }
        ;

        this.initialize();
    }

    /**
     * Get a dictionary of all the data points, and initiate a model from thiss
     * @param data
     */
    @action
    public parse(data: T): Model<T> {
        if (!isPlainObject(data)) {
            throw Error(`Parameter supplied to \`parse()\` is not an object, got: ${JSON.stringify(
                data
            )}`);
        }

        forIn(data, (value: object, key: string) => {
            const attr = this.constructor['fromBackendAttrKey'](key);
            // parse normal attributes
            if (this.__attributes.includes(key)) {
                // @ts-ignore
                this[attr] = value;
            } else if (this.__activeCurrentRelations.includes(key)) {

                // Parse the relations
                if (isPlainObject(value) || isPlainObject(get(value, '[0]'))) {
                    this[attr].parse(value);
                } else if (value === null) {
                    // The relation is cleared.
                    this[attr].clear();
                }

            } else {
                console.warn(`Object has no attribute ${attr}. This value is ignored in the bootstrap`)
            }
        });

        return this;

    }

    /**
     * Initiates all the relations. based upon the relations that are active (in the withs).
     *
     * @param activeRelations
     * @protected
     */
    protected __parseRelations(activeRelations: string[]) {
        this.__activeRelations = activeRelations;

        const relations = this.relations();
        const relationModels = {};


        activeRelations.forEach((activeRelation: string) => {
            // If the activeRelation is null, tis relation is already defined by another activerelations.
            // e.g. town.restaurants.chef && town
            if (activeRelation === null) {
                return;
            }

            const relationNames: string[] = activeRelation.split(".");

            const currentRelation = relationNames ? relationNames[0] : activeRelation;

            const otherRelationNames = relationNames[1] && relationNames.slice(1).join(".");
            const currentProperty = relationModels[currentRelation];
            const otherRelations = otherRelationNames && [otherRelationNames];

            relationModels[currentRelation] = currentProperty ? currentProperty.concat(otherRelations) : otherRelations
            // debugger;

            if (this.__attributes.includes(currentRelation)) {
                throw Error(`Cannot define \`${currentRelation}\` as both an attribute and a relation. You probably need to remove the attribute.`)
            }

            if (!this.__activeCurrentRelations.includes(currentRelation)) {
                this.__activeCurrentRelations.push(currentRelation);
            }

        });


        extendObservable(this,
            mapValues(relationModels, (otherRelationNames: string[], relationName: string) => {
                    const RelationModel = relations[relationName];
                    if (!RelationModel) {
                        throw Error(`Specified relation "${relationName}" does not exist on model.`);
                    }
                    const options: ModelOptions = {relations: otherRelationNames};
                    if (RelationModel.prototype instanceof Store) {
                        // @ts-ignore
                        return new RelationModel(options);
                    }
                    // @ts-ignore
                    return new RelationModel(null, options);
                }
            )
        );
    }

    @action
    fromBackend(input: ResponseAdapter<T>): void {
        const response = modelResponseAdapter(input);
        const {data} = response;

        this.__parseFromBackendRelations(response);


        if (data) {
            this.parse(data);
        }
    }


    /**
     * When we get the backend data, we also get the data from the relations. This method parses the backend
     * relations for this model
     * @param response
     */
    __parseFromBackendRelations(response: Response<T>): void {
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


    @computed
    get isNew(): boolean {
        return !this[this.constructor['primaryKey']];
    }

    @computed
    get url(): string {
        const id = this[this.constructor['primaryKey']];
        return `${result(this, 'urlRoot')}${id ? `${id}/` : ''}`;
    }


    protected relations(): { [name: string]: (new () => Model<any>) } {
        return {};
    }

    // Empty function, but can be overridden if you want to do something after initializing the model.
    protected initialize() {
    }

  /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    static toBackendAttrKey(attrKey: string): string {
        return camelToSnake(attrKey);
    }

    /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    static fromBackendAttrKey(attrKey: string): string {
        return snakeToCamel(attrKey);
    }

    set primaryKey(v: any) {
        throw Error(
            '`primaryKey` should be a static property on the model.'
        );
    }

    set backendResourceName(v: any) {
        throw Error(
            '`backendResourceName` should be a static property on the model.'
        );
    }

}


/**
 * Patches the model classes, such that
 * @param subClass
 */
export function tsPatch<U, T extends { new(data?: U, options?: ModelOptions, ...args: any[]): {} }>(subClass: T) {
    // @ts-ignore
    return class extends subClass {
        // This denotes to the superclass that we have patched the model, which is checked to test that we have overwritten
        // the text correctly
        static _isTsPatched = true;

        // TODO: we should  be able to fix this with types, such that the ts-ignores are not missed?
        constructor(data?: U, options?: ModelOptions, ...args) {
            // @ts-ignore
            super(data, options, args);

            // @ts-ignore
            this.afterConstructor(data, options);
        }
    };
}
