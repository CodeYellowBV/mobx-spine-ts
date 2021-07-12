import {Model, ModelData, ModelOptions, NestedRelations, NestedStrings, ToBackendAllParams} from "Model";
import {action, computed, IObservableArray, observable, autorun } from "mobx";
import {modelResponseAdapter, ResponseAdapter} from "./Model/BinderResponse";
import { map, isArray, sortBy, filter, find, forIn, uniqBy } from 'lodash';

export interface StoreOptions<T> {
    relations?: string[],     // List of active relations for this store
}

export class Store<T extends ModelData, U extends Model<T>> {
    models: IObservableArray<Model<T>> = observable([]);
    __activeRelations: string[] = [];

    @observable __pendingRequestCount = 0;
    @observable __setChanged = false;

    /**
     * The comparator that will be used by the `sort` method of this Store. It can
     * be a string or a function. If it is a string, the models in this store will
     * be sorted by the model property whose name is the comparator. If it is a
     * function, the function will be called to decide which model is 'largest' for
     * each comparison that is needed during sorting.
     */
    comparator: string | ((o1: Model<T>, o2: Model<T>) => number);

    Model: (new (data?: T, options?: ModelOptions<T>) => Model<T>) = null;

    public constructor(options?: StoreOptions<T>) {
        this.__activeRelations = options?.relations || [];
    }

    public fromBackend<T>(input: ResponseAdapter<T>): void {
        const response = modelResponseAdapter(input);

        this.models.replace(
            (response.data as T[]).map(
                // (ModelData: T) is not working????

                (modelData: ModelData) => {
                    const model = this._newModel();
                    model.fromBackend(
                        {
                            data: modelData,
                            with: response.with,
                            meta: response.meta,
                            with_mapping: response.with_mapping
                        }
                    );
                    return model;
                }
            )
        )
    }

    protected _newModel(data?: T): Model<T> {
        return new this.Model(data, {
            store: this,
            relations: this.__activeRelations
        })
    }

    @computed
    get length(): number {
        return this.models.length;
    }

    map<V>(mapping: (model: Model<T>) => V): V[] {
        return map(this.models, mapping);
    }

    toBackendAll(options: ToBackendAllParams<T> = {}) {
        const relevantModels = options.onlyChanges ? this.models.filter(model => model.isNew || model.hasUserChanges) : this.models;
        const modelData = relevantModels.map(model => model.toBackendAll(options));

        let data = [];
        const relations = {};

        modelData.forEach(model => {
            data = data.concat(model.data);
            forIn(model.relations, (relModel, key) => {
                relations[key] = relations[key]
                    ? relations[key].concat(relModel)
                    : relModel;
                relations[key] = uniqBy(relations[key], 'id');
            });
        });

        return { data, relations };
    }

    // Create a new instance of this store with a predicate applied.
    // This new store will be automatically kept in-sync with all models that adhere to the predicate.
    virtualStore({ filter, comparator }) {
        // @ts-ignore
        const store: this = new this.constructor({
            relations: this.__activeRelations,
            comparator,
        });

        // Oh gawd MobX is so awesome.
        const events = autorun(() => {
            const models = this.filter(filter);
            store.models.replace(models);
            store.sort();

            // When the parent store is busy, make sure the virtual store is
            // also busy.
            store.__pendingRequestCount = this.__pendingRequestCount;
        });

        store['unsubscribeVirtualStore'] = events;

        return store;
    }

    __parseNewIds(idMaps: { [x: string]: number[][] }) {
        this.each(model => model.__parseNewIds(idMaps));
    }

    @action
    clear() {
        const length = this.models.length;
        this.models.clear();

        if (length > 0) {
            this.__setChanged = true;
        }
    }

    @action
    parse(models: T[]) {
        if (!isArray(models)) {
            throw Error(`Parameter supplied to \`parse()\` is not an array, got: ${JSON.stringify(
                models
            )}`)
        }

        // Parse does not mutate __setChanged, as it is used in
        // fromBackend in the model...
        this.models.replace(models.map(this._newModel.bind(this)));
        this.sort();

        return this;
    }

    parseValidationErrors(valErrors: object) {
        this.each(model => {
            model.parseValidationErrors(valErrors);
        });
    }

    clearValidationErrors(): void {
        this.each(model => {
            model.clearValidationErrors();
        });
    }

    /**
     * Adds model(s) with the given model value(s). These new model(s) will be
     * returned.
     */
    @action
    add(rawModels: T | Array<T>): Model<T> | Array<Model<T>> {
        const singular = !isArray(rawModels);
        const models = singular ? [rawModels as T] : (rawModels as Array<T>).slice();

        const modelInstances: Array<Model<T>> = models.map(this._newModel.bind(this));

        modelInstances.forEach(modelInstance => {
            const id = modelInstance['id'];
            if (id && this.get(id)) {
                throw new Error(
                    `A model with the same id ${id} already exists`
                );
            }
            this.__setChanged = true;
            this.models.push(modelInstance);
        });
        this.sort();

        return singular ? modelInstances[0] : modelInstances;
    }

    /**
     * Removes the given model(s) from this store and returns the removed model(s).
     */
    @action
    remove(models: Model<T> | Array<Model<T>>) {
        const singular = !isArray(models);
        const modelArray = singular ? [models as Model<T>] : (models as Array<Model<T>>).slice();

        modelArray.forEach(model => this.models.remove(model));
        if (modelArray.length > 0) {
            this.__setChanged = true;
        }
        return models;
    }

    /**
     * Removes the model(s) with the given rawID(s) from this store and returns the 
     * removed model(s).
     * @param rawIDs The id(s) for which the corresponding model(s) should be removed
     * @returns The removed model(s)
     */
    @action
    removeById(rawIDs: number | Array<number>) {
        const singular = !isArray(rawIDs);
        const ids = singular ? [rawIDs as number] : (rawIDs as Array<number>).slice();
        if (ids.some(isNaN)) {
            throw new Error(`
                [mobx-spine] Can't remove a model by id that is Not A Number:
                ${JSON.stringify(ids)}
            `);
        }

        const models = ids.map(id => this.get(id));

        models.forEach(model => {
            if (model) {
                this.models.remove(model);
                this.__setChanged = true;
            }
        });

        return models;
    }

    /**
     * Sorts (the models in) this store by the `comparator` of this store. If this
     * store doesn't have a comparator, this method won't do anything.
     * @returns this store
     */
    @action
    sort(): this {
        if (!this.comparator) {
            return this;
        }
        if (typeof this.comparator === 'string') {
            this.models.replace(this.sortBy(this.comparator));
        } else {
            this.models.replace(this.models.slice().sort(this.comparator));
        }

        return this;
    }

    /**
     * Sorts the models in this Store by the `iteratees` property (if it is a string)
     * or by the property returned by `iteratees` (if it is a function). For
     * instance, if `iteratees` is `(model) => model.id`, this will sort the models
     * in this Store by their id's. You can achieve the same result by using
     * `iteratees = 'id'`.
     * @param iteratees The function that picks the property by which the models will
     * be sorted, or the name of the property by which the models will be sorted.
     * @returns A new *sorted* array containing the models in this store.
     */
    sortBy(iteratees: string | ((model: Model<T>) => any)): Model<T>[] {
        return sortBy(this.models, iteratees);
    }

    /**
     * Get a model from the store by the id. If it doesn't exist, return null
     *
     * @param id
     */
    get(id: number): Model<T> | null {
        return this.models.find(
            // @ts-ignore
            model => model.id === id
        );
    }

    /**
     * Gets an array that contains all models in this Store whose id (or, more
     * accurately, primary key value) is included in *ids* (the parameter).
     * @param ids The id's to search for
     */
    getByIds(ids: number[]): Array<Model<T>> {
        // @ts-ignore
        return this.models.filter(model => ids.includes(model.id));
    }

    mapByPrimaryKey(): number[] {
        // @ts-ignore
        return this.map(model => model.id);
    }

    /**
     * Returns an array containing all models in this store for which the given
     * predicate returns true.
     */
    filter(predicate: (model: Model<T>) => boolean): Array<Model<T>> {
        return filter(this.models, predicate);
    }

    /**
     * Returns the first model for which the given predicate returns true, or
     * `undefined` if the predicate didn't return true for a single model.
     */
    find(predicate: (model: Model<T>) => boolean): Model<T> | undefined {
        return find(this.models, predicate);
    }

    /**
     * Calls the given `callbackFunction` for each model in this store.
     */
    each(callbackFunction: (model: Model<T>, index: number, array: Array<Model<T>>) => void): void {
        this.models.forEach(callbackFunction);
    }

    /**
     * Calls the given `callbackFunction` for each model in this store.
     */
    forEach(callbackFunction: (model: Model<T>, index: number, array: Array<Model<T>>) => void): void {
        this.models.forEach(callbackFunction);
    }

    /**
     * Get the model at the given `index` (position) in the array, or null if this
     * store doesn't have a model with the given `index`.
     * 
     * This method also accepts a negative `index`: -1 yields the last model,
     * -2 yields the second-last model, ...
     */
    at(index: number) : Model<T> | null {
        if (index < 0) {
            index += this.length;
        }

        if (index >= this.length) {
            return null;
        }

        return this.models[index];
    }

    wrapPendingRequestCount<T>(promise: Promise<T>): Promise<T> {
        this.__pendingRequestCount++;

        return promise
            .then((res) => {
                this.__pendingRequestCount--;
                return res;
            })
            .catch((err) => {
                this.__pendingRequestCount--;
                throw err;
            });
    }

    saveAllFiles(relations: NestedRelations = {}): Promise<any[]> {
        const promises = [];
        for (const model of this.models) {
            promises.push(model.saveAllFiles(relations));
        }
        return Promise.all(promises);
    }
}
