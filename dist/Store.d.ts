import { BackendData, Model, ModelData, ModelOptions, NestedRelations, ToBackendAllParams } from "Model";
import { IObservableArray, IReactionDisposer } from "mobx";
import { ResponseAdapter } from "./Model/BinderResponse";
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
export declare class Store<T extends ModelData, U extends Model<T>> implements WorkAround {
    models: IObservableArray<U>;
    __activeRelations: string[];
    /**
     * I have no clue what this is for.
     */
    __repository?: any;
    __pendingRequestCount: number;
    __setChanged: boolean;
    __state: {
        currentPage: number;
        limit: number;
        totalRecords: number;
    };
    params: object;
    /**
     * The comparator that will be used by the `sort` method of this Store. It can
     * be a string or a function. If it is a string, the models in this store will
     * be sorted by the model property whose name is the comparator. If it is a
     * function, the function will be called to decide which model is 'largest' for
     * each comparison that is needed during sorting.
     */
    comparator: string | ((o1: U, o2: U) => number);
    api?: BinderApi;
    Model: (new (data?: T, options?: ModelOptions<T>) => U);
    constructor(rawOptions?: StoreOptions<U>);
    __getApi(): BinderApi;
    fromBackend<T>(input: ResponseAdapter<T>): void;
    initialize(): void;
    get isLoading(): boolean;
    protected _newModel(data?: T): U;
    get length(): number;
    get hasUserChanges(): boolean;
    get hasSetChanges(): boolean;
    clearSetChanges(): void;
    map<V>(mapping: string | ((model: U) => V)): V[];
    toBackendAll(options?: ToBackendAllParams<T>): {
        data: BackendData[];
        relations: object;
    };
    virtualStore(params: {
        filter?: any[] | ((model: U) => boolean);
        comparator?: string | ((o1: U, o2: U) => number);
    }): Store<T, U>;
    unsubscribeVirtualStore?: IReactionDisposer;
    __parseNewIds(idMaps: {
        [x: string]: number[][];
    }): void;
    toJS(): import("Model").ParseData<T>[];
    getPageOffset(): number;
    setLimit(limit?: number): void;
    get totalPages(): number;
    get currentPage(): number;
    get hasNextPage(): boolean;
    get hasPreviousPage(): boolean;
    getNextPage(): Promise<GetResponse<T>>;
    getPreviousPage(): Promise<GetResponse<T>>;
    setPage(page?: number, options?: {
        fetch?: boolean;
    }): Promise<GetResponse<T> | void>;
    clear(): void;
    buildFetchData(options: FetchStoreOptions): object;
    fetch(options?: FetchStoreOptions): Promise<GetResponse<T>>;
    parse(models: T[]): this;
    parseValidationErrors(valErrors: object): void;
    clearValidationErrors(): void;
    /**
     * Adds model(s) with the given model value(s). These new model(s) will be
     * returned.
     */
    add(rawModels: T | Array<T>): U | Array<U>;
    /**
     * Removes the given model(s) from this store and returns the removed model(s).
     */
    remove(models: U | Array<U>): U | U[];
    /**
     * Removes the model(s) with the given rawID(s) from this store and returns the
     * removed model(s).
     * @param rawIDs The id(s) for which the corresponding model(s) should be removed
     * @returns The removed model(s)
     */
    removeById(rawIDs: string | number | Array<string | number>): U[];
    /**
     * Sorts (the models in) this store by the `comparator` of this store. If this
     * store doesn't have a comparator, this method won't do anything.
     * @returns this store
     */
    sort(options?: object): this;
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
    sortBy(iteratees: string | ((model: U) => any)): U[];
    /**
     * Get a model from the store by the id. If it doesn't exist, return null
     *
     * @param id
     */
    get(rawId: number | string): U | null;
    /**
     * Gets an array that contains all models in this Store whose id (or, more
     * accurately, primary key value) is included in *ids* (the parameter).
     * @param ids The id's to search for
     */
    getByIds(rawIds: (number | string)[]): Array<U>;
    mapByPrimaryKey(): number[];
    /**
     * Returns an array containing all models in this store for which the given
     * predicate returns true.
     */
    filter(predicate: any[] | ((model: U) => boolean)): Array<U>;
    /**
     * Returns the first model for which the given predicate returns true, or
     * `undefined` if the predicate didn't return true for a single model.
     */
    find(predicate: object | ((model: U) => boolean)): U | undefined;
    /**
     * Calls the given `callbackFunction` for each model in this store.
     */
    each(callbackFunction: (model: U, index: number, array: Array<U>) => void): void;
    /**
     * Calls the given `callbackFunction` for each model in this store.
     */
    forEach(callbackFunction: (model: U, index: number, array: Array<U>) => void): void;
    /**
     * Get the model at the given `index` (position) in the array, or null if this
     * store doesn't have a model with the given `index`.
     *
     * This method also accepts a negative `index`: -1 yields the last model,
     * -2 yields the second-last model, ...
     */
    at(index: number): U | null;
    set backendResourceName(_value: any);
    wrapPendingRequestCount<T>(promise: Promise<T>): Promise<T>;
    saveAllFiles(relations?: NestedRelations): Promise<any[]>;
}
export {};
