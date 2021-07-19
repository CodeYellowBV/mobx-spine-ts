import { Store } from "./Store";
import baseFromBackend from "./Model/FromBackend";
import Api from 'Api';
export interface ModelData {
    id?: number;
}
export declare type ParseData<T> = {
    [P in keyof T]?: any;
};
export declare type BackendData = {
    id?: number;
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
    toJS(): {
        [key: string]: any;
    };
    saveFile(name: string): Promise<any>;
    saveFromBackend(res: any): void;
    saveFiles(): Promise<any[]>;
    clearUserFileChanges(): void;
    clearValidationErrors(): void;
    clearUserFieldChanges(): void;
    get hasUserChanges(): boolean;
    get isLoading(): boolean;
    saveAllFiles(relations?: NestedRelations): Promise<any[][]>;
    saveAll(options?: SaveAllParams<T>): Promise<object>;
    __parseNewIds(idMaps: {
        [x: string]: number[][];
    }): void;
    save(options?: SaveParams<T>): Promise<{
        data: ModelData;
    }>;
    setInput(name: string, value: any): void;
    toBackend(params?: ToBackendParams<T> | undefined): BackendData;
    getNegativeId(): number;
    getInternalId(): number;
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
    fromBackend: typeof baseFromBackend;
    get isNew(): boolean;
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
