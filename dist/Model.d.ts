import { Store } from "./Store";
import baseFromBackend from "./Model/FromBackend";
import Api from './Api';
export interface ModelData {
    id?: number;
}
export declare type ParseData<T> = {
    [P in keyof T]?: any;
};
export declare type BackendData = {
    id?: number;
};
export declare type CopyOptions = {
    copyChanges: boolean;
};
export interface ToBackendParams<T extends ModelData> {
    data?: T;
    mapData?: (x: BackendData) => BackendData;
    onlyChanges?: boolean;
    fields?: string[];
    forceFields?: string[];
}
export interface SaveParams<T extends ModelData> {
    data?: T & {
        [x: string]: any;
    };
    mapData?: (x: Partial<T>) => any;
    onlyChanges?: boolean;
    fields?: string[];
    url?: string;
    [x: string]: any;
}
export interface SaveAllParams<T extends ModelData> extends SaveParams<T> {
    relations?: string[];
}
export interface NestedStrings {
    [nested: string]: NestedStrings;
}
export declare type NestedRelations = NestedStrings;
export interface ToBackendAllParams<T extends ModelData> {
    data?: T;
    mapData?: (x: Partial<T>) => Partial<T>;
    nestedRelations?: NestedRelations;
    onlyChanges?: boolean;
}
export interface ModelOptions<T> {
    relations?: string[];
    store?: Store<T, Model<T>>;
}
declare type StoreOrModelConstructor = (new () => Model<any>) | (new () => Store<any, any>);
interface WorkAround {
    urlRoot?: string | (() => string);
    api?: Api;
}
export declare abstract class Model<T extends ModelData> implements WorkAround {
    /**
     * How the model is known at the backend. This is useful when the model is in a
     * relation that has a different name.
     */
    static backendResourceName: string;
    static primaryKey: string;
    static fileFields: string[];
    static pickFields?: string[];
    static omitFields: string[];
    cid: string;
    api: Api;
    __attributes: string[];
    __originalAttributes: object;
    __activeRelations: string[];
    __activeCurrentRelations: string[];
    __store: Store<T, Model<T>>;
    __pendingRequestCount: number;
    __fetchParams: object;
    __changes: string[];
    __backendValidationErrors: object;
    __fileChanges: object;
    __fileDeletions: object;
    __fileExists: object;
    constructor(data?: ParseData<T>, options?: ModelOptions<T>);
    /***
     * If we need to change things to a submodel, we can only access the data after running the constructor of the
     * submodel. This method is called after the constuctor is called
     *
     * @param data
     * @param options
     * @private
     */
    private afterConstructor;
    setFetchParams(params: object): void;
    wrapPendingRequestCount<T>(promise: Promise<T>): Promise<T>;
    /**
     * Get a dictionary of all the data points, and initiate a model from thiss
     * @param data
     */
    parse(data: ParseData<T>): Model<T>;
    __parseAttr(attr: string, value: any): any;
    fileFields(): any;
    pickFields(): string[] | undefined;
    omitFields(): string[];
    casts(): {};
    get backendValidationErrors(): object;
    get fieldFilter(): (name: string) => boolean;
    __toJSAttr(attr: string, value: any): any;
    toJS(): ParseData<T>;
    getEncodedFile(file: string): string;
    uuidv4(): string;
    saveFile(name: string): Promise<any>;
    isBase64(str: any): boolean;
    dataURItoBlob(dataURI: string): Blob;
    saveFromBackend(res: any): void;
    saveFiles(): Promise<any[]>;
    clearUserFileChanges(): void;
    clearValidationErrors(): void;
    clearUserFieldChanges(): void;
    get hasUserChanges(): boolean;
    get isLoading(): boolean;
    saveAllFiles(relations?: NestedRelations): Promise<any[][]>;
    /**
     * Validates a model and relations by sending a save request to binder with the validate header set. Binder will return the validation
     * errors without actually committing the save
     *
     * @param options - same as for a normal saveAll request, example {relations:['foo'], onlyChanges: true}
     */
    validateAll(options?: SaveAllParams<T>): Promise<object>;
    saveAll(options?: SaveAllParams<T>): Promise<object>;
    __parseNewIds(idMaps: {
        [x: string]: number[][];
    }): void;
    /**
     * Validates a model by sending a save request to binder with the validate header set. Binder will return the validation
     * errors without actually committing the save
     *
     * @param options - same as for a normal save request, example: {onlyChanges: true}
     */
    validate(options?: SaveParams<T>): Promise<{
        data: ModelData;
    }>;
    save(options?: SaveParams<T>): Promise<{
        data: ModelData;
    }>;
    setInput(name: string, value: any): void;
    toBackend(params?: ToBackendParams<T> | undefined): BackendData;
    getNegativeId(): number;
    /**
     * Get InternalId returns the id of a model or a negative id if the id is not set
     * @returns the id of a model or a negative id if the id is not set
     */
    getInternalId(): number;
    /**
     * Gives the model the internal id, meaning that it will keep the set id of the model or it will receive a negative
     * id if the id is null. This is useful if you have a new model that you want to give an id so that it can be
     * referred to in a relation.
     */
    assignInternalId(): void;
    __getApi(): Api;
    buildFetchData(options: {
        data?: any;
    }): any;
    delete(options?: {
        immediate?: boolean;
        url?: string;
        [x: string]: any;
    }): Promise<void>;
    fetch(options?: {
        url?: string;
        data?: any;
        [x: string]: any;
    }): Promise<void>;
    clear(): void;
    validationErrorFormatter(obj: any): any;
    parseValidationErrors(valErrors: object): void;
    toBackendAll(options?: ToBackendAllParams<T>): {
        data: BackendData[];
        relations: object;
    };
    /**
     * Initiates all the relations. based upon the relations that are active (in the withs).
     *
     * @param activeRelations
     * @protected
     */
    protected __parseRelations(activeRelations: string[]): void;
    /**
     * Makes this model a copy of the specified model
     * or returns a copy of the current model when no model to copy is given
     * It also clones the changes that were in the specified model.
     * Cloning the changes requires recursion over all related models that have changes or are related to a model with changes.
     * Cloning
     *
     * @param source The model that should be copied
     * @param options Options, {copyChanges - only copy the changed attributes, requires recursion over all related objects with changes}
     */
    copy(rawSource?: CopyOptions | Model<T> | undefined, options?: CopyOptions): Model<T>;
    /**
     * Goes over model and all related models to set the changed values and notify the store
     *
     * @param source - the model to copy
     * @param store  - the store of the current model, to setChanged if there are changes
     * @private
     */
    __copyChanges(source: Model<T>, store?: Store<T, Model<T>>): void;
    fromBackend: typeof baseFromBackend;
    /**
     * A model is considered new if it does not have an id, or if the id is a negative integer.
     * @returns {boolean}   True if the model id is not set or a negative integer
     */
    get isNew(): boolean;
    /**
     * The get url returns the url for a model., it appends the id if there is one. If the model is new it should not
     * append an id.
     *
     * @returns {string}  the url for a model
     */
    get url(): string;
    protected relations(): {
        [name: string]: StoreOrModelConstructor;
    };
    protected initialize(): void;
    /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    static toBackendAttrKey(attrKey: string): string;
    /**
     * In the backend we use snake case names. In the frontend we use snakeCase names everywhere. THis translates
     * in between them
     *
     * @param attrKey
     */
    static fromBackendAttrKey(attrKey: string): string;
    set backendResourceName(v: any);
}
/**
 * Patches the model classes, such that
 * @param subClass
 */
export declare function tsPatch<U extends ModelData, T extends {
    new (data?: U, options?: ModelOptions<U>, ...args: any[]): {};
}>(subClass: T): {
    new (data?: U, options?: ModelOptions<T>, ...args: any[]): {};
    _isTsPatched: boolean;
} & T;
export {};
