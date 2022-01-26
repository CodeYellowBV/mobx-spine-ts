import Api, { FetchResponse, FetchStoreOptions, FetchStoreResponse, GetResponse, PutResponse, RequestData, RequestOptions } from './Api';
import { AxiosInstance, AxiosResponse } from 'axios';
import { Store } from './Store';
import { Model, ModelData } from './Model';
export declare class BinderApi implements Api {
    axios: AxiosInstance;
    defaultHeaders: any;
    baseUrl?: string;
    csrfToken?: string;
    onRequestError?: (reason: any) => any;
    constructor();
    __initializeCsrfHandling(): void;
    fetchCsrfToken(): Promise<void>;
    /**
     * Determines the csrf token that needs to be added to the request, based upon the method, and the internally
     * set csrf token
     */
    protected __csrfToken(method: string): string | undefined;
    /**
     * Generic request to the binder api
     *
     * @param method
     * @param url
     * @param data
     * @param options
     */
    protected __request(method: string, url: string, data?: RequestData, options?: RequestOptions): Promise<any>;
    parseBackendValidationErrors(response: object): object | null;
    buildFetchModelParams<T>(model: Model<T>): {
        with: string;
    };
    /**
     * Format the request data that is send to the server, based upon the provided data, and the http method
     *
     * Mainly, makes sure that GET data is not send as data, but as parameterss
     *
     * @param method
     * @param data
     */
    protected __formatData(method: string, data?: RequestData): RequestData;
    /**
     * Returns the query params. For GET request, use the provided data. For POST request use the options
     *
     * @param method
     * @param data
     * @param options
     */
    protected __formatQueryParams(method: string, data?: RequestData, options?: RequestOptions): RequestData;
    /**
     * Formats the raw response (including http headers, status, etc)
     *
     * @param res
     */
    protected __responseFormatter(res: AxiosResponse): object;
    /**
     * Tests if the url is ok, and throws an error if an error is found
     * @param url
     */
    protected __testUrl(url: string): void;
    fetchModel<T extends ModelData>({ url, data, requestOptions }: {
        url: any;
        data: any;
        requestOptions: any;
    }): Promise<FetchResponse<T>>;
    saveModel<T extends ModelData>({ url, data, isNew, requestOptions }: {
        url: any;
        data: any;
        isNew: any;
        requestOptions: any;
    }): Promise<{
        data: T;
    }>;
    saveAllModels<T extends ModelData>(params: {
        url: string;
        data: any;
        model: Model<T>;
        requestOptions: RequestOptions;
    }): Promise<PutResponse | AxiosResponse>;
    get<T>(url: string, data?: RequestData, options?: RequestOptions): Promise<GetResponse<T>> | Promise<AxiosResponse>;
    post<T>(url: string, data?: RequestData, options?: RequestOptions): Promise<T> | Promise<AxiosResponse>;
    put(url: string, data?: RequestData, options?: RequestOptions): Promise<PutResponse> | Promise<AxiosResponse>;
    patch<T>(url: string, data?: RequestData, options?: RequestOptions): Promise<T> | Promise<AxiosResponse>;
    delete(url: string, data?: RequestData, options?: RequestOptions): Promise<void> | Promise<AxiosResponse>;
    deleteModel(options: {
        url: string;
        requestOptions: RequestOptions;
    }): Promise<void> | Promise<AxiosResponse>;
    buildFetchStoreParams<T extends ModelData, U extends Model<T>>(store: Store<T, U>): {
        with: string;
        limit: string | number;
        offset: number;
    };
    fetchStore<T extends ModelData>(options: FetchStoreOptions): Promise<FetchStoreResponse<T>>;
}
