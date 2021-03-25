import {action} from 'mobx';
import {camelToSnake} from "./Utils";
import {forIn} from 'lodash'

interface ModelOptions {
    id: number;
}

export class Model<T> {

    constructor(data?: T, options?: ModelOptions) {


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
            const attr = this.constructor['fromBackendAttrKey'](key)
            this[attr] = value;
            debugger;
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