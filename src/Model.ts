import {action} from 'mobx';
import {camelToSnake} from "./Utils";
import {forIn} from 'lodash'
import construct = Reflect.construct;

export interface ModelOptions {
}

export class Model<T> {

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
        if (data) {
            this.parse(data);
        }
    }

    /**
     * Get a dictionary of all the data points, and initiate a model from thiss
     * @param data
     */
    @action
    public parse(data: T) {

        forIn(data, (value: string, key: object) => {
            const attr = this.constructor['fromBackendAttrKey'](key);

            // @ts-ignore
            this[attr] = value;

        });

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
