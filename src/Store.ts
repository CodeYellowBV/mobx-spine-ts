import {BackendData, Model, ModelData, ModelOptions, NestedRelations, ToBackendAllParams} from "Model";
import {action, computed, IObservableArray, observable, autorun } from "mobx";
import {modelResponseAdapter, ResponseAdapter} from "./Model/BinderResponse";
import { map, isArray, sortBy, filter, find, forIn, uniqBy, result, omit } from 'lodash';
import { BinderApi } from "BinderApi";
import { FetchStoreOptions, GetResponse } from "Api";

export interface StoreOptions<U> {
    /**
     * List of active relations for this store
     */
    relations?: string[];

    /**
     * Maximum number of entries this store will have per page
     */
    limit?: number;

    /**
     * Used for sorting entries
     */
    comparator?: string | ((o1: U, o2: U) => number);

    /**
     * This property can be used to pass arbitrary options to store.params. These properties will
     * be ignored by mobx-spine, but can be useful for applications to pass data around.
     */
    params?: object;

    /**
     * I have no idea what this is for.
     */
    repository?: any;
}

interface WorkAround {
    url?: string | (() => string);
    api?: BinderApi;
}

export class Store<T extends ModelData, U extends Model<T>> implements WorkAround {
    models: IObservableArray<U> = observable([]);
    __activeRelations: string[] = [];
    /**
     * I have no clue what this is for.
     */
    __repository?: any;

    @observable __pendingRequestCount = 0;
    @observable __setChanged = false;
    @observable __state = {
        currentPage: 1,
        limit: 25,
        totalRecords: 0
    };

    @observable params: object = {};

    /**
     * The comparator that will be used by the `sort` method of this Store. It can
     * be a string or a function. If it is a string, the models in this store will
     * be sorted by the model property whose name is the comparator. If it is a
     * function, the function will be called to decide which model is 'largest' for
     * each comparison that is needed during sorting.
     */
    comparator: string | ((o1: U, o2: U) => number);

    api?: BinderApi = null;

    Model: (new (data?: T, options?: ModelOptions<T>) => U) = null;

    public constructor(rawOptions?: StoreOptions<U>) {

        // Nasty work-around for TS2425
        // @ts-ignore
        if (!this.url) {
            // @ts-ignore
            this.url = () => {
                const bname = this.constructor['backendResourceName'];
                if (bname) {
                    return `/${bname}/`;
                }
                return null;
            };
        }
        
        const options = rawOptions || {};
        this.__repository = options.repository;
        this.__activeRelations = options.relations || [];
        if (options.limit) {
            this.__state.limit = options.limit;
        }
        if (options.params) {
            this.params = options.params;
        }
        this.comparator = options.comparator;
        this.initialize();
    }

    __getApi(): BinderApi {
        if (!this.api) {
            throw new Error(
                '[mobx-spine] You are trying to perform an API request without an `api` property defined on the store.'
            );
        }
        if (!result(this, 'url')) {
            throw new Error(
                '[mobx-spine] You are trying to perform an API request without a `url` property defined on the store.'
            );
        }
        return this.api;
    }

    public fromBackend<T>(input: ResponseAdapter<T>): void {
        const response = modelResponseAdapter(input);

        const responseData: T[] = isArray(response.data) ? response.data as T[]: [response.data as T];
        this.models.replace(
            responseData.map(
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

    initialize(): void {
        // Subclasses can override this
    }

    protected _newModel(data?: T): U {
        return new this.Model(data, {
            store: this,
            relations: this.__activeRelations
        })
    }

    @computed
    get length(): number {
        return this.models.length;
    }

    @computed
    get hasUserChanges(): boolean {
        return this.hasSetChanges || this.models.some(m => m.hasUserChanges);
    }

    // TODO: Maybe we can keep track of what got added and what got
    // removed exactly.  For now this should be enough.
    @computed
    get hasSetChanges(): boolean {
        return this.__setChanged;
    }

    clearSetChanges(): void {
        this.__setChanged = false;
    }

    map<V>(mapping: (model: U) => V): V[] {
        return map(this.models, mapping);
    }

    toBackendAll(options: ToBackendAllParams<T> = {}): { data: BackendData[], relations: object } {
        const relevantModels = options.onlyChanges ? this.models.filter(model => model.isNew || model.hasUserChanges) : this.models;
        const modelData = relevantModels.map(model => model.toBackendAll(options));

        let data: BackendData[] = [];
        const relations = {};

        modelData.forEach(model => {
            data = data.concat(model.data);
            forIn(model.relations, (relModel, key: string) => {
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
    virtualStore({ filter, comparator }): Store<T, U> {
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

    __parseNewIds(idMaps: { [x: string]: number[][] }): void {
        this.each(model => model.__parseNewIds(idMaps));
    }

    toJS() {
        return this.models.map(model => model.toJS());
    }

    // Methods for pagination.

    getPageOffset(): number {
        return (this.__state.currentPage - 1) * this.__state.limit;
    }

    @action
    setLimit(limit?: number): void {
        this.__state.limit = limit || null;
    }

    @computed
    get totalPages(): number {
        if (!this.__state.limit) {
            return 0;
        }
        return Math.ceil(this.__state.totalRecords / this.__state.limit);
    }

    @computed
    get currentPage(): number {
        return this.__state.currentPage;
    }

    @computed
    get hasNextPage(): boolean {
        return this.__state.currentPage + 1 <= this.totalPages;
    }

    @computed
    get hasPreviousPage(): boolean {
        return this.__state.currentPage > 1;
    }

    @action
    getNextPage(): Promise<GetResponse<T>> {
        if (!this.hasNextPage) {
            throw new Error('[mobx-spine] There is no next page');
        }
        this.__state.currentPage += 1;
        return this.fetch();
    }

    @action
    getPreviousPage(): Promise<GetResponse<T>> {
        if (!this.hasPreviousPage) {
            throw new Error('[mobx-spine] There is no previous page');
        }
        this.__state.currentPage -= 1;
        return this.fetch();
    }

    @action
    setPage(page: number = 1, options: { fetch?: boolean } = {}): Promise<GetResponse<T> | void> {
        if (page <= 0) {
            throw new Error(`[mobx-spine] Page (${page}) should greater than 0`);
        }
        if (page > (this.totalPages || 1)) {
            throw new Error(`[mobx-spine] Page (${page}) should be between 1 and ${this.totalPages || 1}`);
        }
        this.__state.currentPage = page;
        if (options.fetch === undefined || options.fetch) {
            return this.fetch();
        }
        return Promise.resolve();
    }

    @action
    clear() {
        const length = this.models.length;
        this.models.clear();

        if (length > 0) {
            this.__setChanged = true;
        }
    }

    buildFetchData(options: FetchStoreOptions): FetchStoreOptions {
        return Object.assign(
            this.__getApi().buildFetchStoreParams(this),
            this.params,
            options.data
        );
    }

    @action
    fetch(options: FetchStoreOptions = {}): Promise<GetResponse<T>> {

        const data = this.buildFetchData(options);
        const promise = this.wrapPendingRequestCount(
            this.__getApi()
            .fetchStore<T>({
                url: options.url || result(this, 'url'),
                data,
                requestOptions: omit(options, 'data'),
            })
            .then(action(res => {
                this.__state.totalRecords = res.totalRecords;
                this.fromBackend(res);

                return res.response;
            }))
        );

        return promise;
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
    add(rawModels: T | Array<T>): U | Array<U> {
        const singular = !isArray(rawModels);
        const models = singular ? [rawModels as T] : (rawModels as Array<T>).slice();

        const modelInstances: Array<U> = models.map(this._newModel.bind(this));

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
    remove(models: U | Array<U>) {
        const singular = !isArray(models);
        const modelArray = singular ? [models as U] : (models as Array<U>).slice();

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
    sortBy(iteratees: string | ((model: U) => any)): U[] {
        return sortBy(this.models, iteratees);
    }

    /**
     * Get a model from the store by the id. If it doesn't exist, return null
     *
     * @param id
     */
    get(id: number): U | null {
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
    getByIds(ids: number[]): Array<U> {
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
    filter(predicate: (model: U) => boolean): Array<U> {
        return filter(this.models, predicate);
    }

    /**
     * Returns the first model for which the given predicate returns true, or
     * `undefined` if the predicate didn't return true for a single model.
     */
    find(predicate: (model: U) => boolean): U | undefined {
        return find(this.models, predicate);
    }

    /**
     * Calls the given `callbackFunction` for each model in this store.
     */
    each(callbackFunction: (model: U, index: number, array: Array<U>) => void): void {
        this.models.forEach(callbackFunction);
    }

    /**
     * Calls the given `callbackFunction` for each model in this store.
     */
    forEach(callbackFunction: (model: U, index: number, array: Array<U>) => void): void {
        this.models.forEach(callbackFunction);
    }

    /**
     * Get the model at the given `index` (position) in the array, or null if this
     * store doesn't have a model with the given `index`.
     * 
     * This method also accepts a negative `index`: -1 yields the last model,
     * -2 yields the second-last model, ...
     */
    at(index: number) : U | null {
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
