import {action} from 'mobx';
import {camelToSnake} from "./Utils";
import {forIn, uniqueId} from 'lodash'

// Find the relation name before the first dot, and include all other relations after it
// Example: input `animal.kind.breed` output -> `['animal', 'kind.breed']`
const RE_SPLIT_FIRST_RELATION = /([^.]+)\.(.+)/;

export interface ModelOptions {
    relations?: string[],     // List of active relations for this model
}

export class Model<T> {
    cid: string = uniqueId('m');

    // A list of all attributes of this model
    __attributes: string[] = [];

    // List of relations that are currently active for this model
    __activeRelations: string[] = [];

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

            this.__attributes.push(key)


        });


        if (options.relations) {
            this.__parseRelations(options.relations);
        }

        // Parse the initial data
        if (data) {
            this.parse(data);
        }
    }

    /**
     * Get a dictionary of all the data points, and initiate a model from thiss
     * @param data
     */
    @action
    public parse(data: T): Model<T> {

        forIn(data, (value: string, key: object) => {
            const attr = this.constructor['fromBackendAttrKey'](key);


            if (attr in this) {
                // @ts-ignore
                this[attr] = value;
            } else {
                console.warn(`Object has no attribute ${attr}. This value is ignored in the bootstrap`)
            }
        });

        return this;

    }

    protected __parseRelations(activeRelations: string[]) {
        this.__activeRelations = activeRelations;

        const relations = this.relations();
        const relationModels = {};

        debugger;

        activeRelations.forEach(activeRelation => {
            // If the activeRelation is null, tis relation is already defined by another activerelations.
            // e.g. town.restaurants.chef && town
            if (activeRelation === null) {
                return;
            }

            const relationNames = activeRelation.split(RE_SPLIT_FIRST_RELATION);

            const currentRelation = relationNames ? relationNames[0]: activeRelation;
            const otherRelationNames = relationNames[1] && relationNames[1];
            const currentProperty = relationModels[currentRelation];
            const otherRelations = otherRelationNames && [otherRelationNames];

            relationModels[currentRelation] = currentProperty ? currentProperty.concat(otherRelations) : otherRelations

            debugger;

            if (this.__attributes.includes(currentRelation)) {
                throw Error( `Cannot define \`${currentRelation}\` as both an attribute and a relation. You probably need to remove the attribute.`)
            }

        });

    }

    protected relations() {
        return [];
    }

    /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    static fromBackendAttrKey(attrKey: string): string {
        return camelToSnake(attrKey);
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
