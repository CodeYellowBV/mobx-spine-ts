import { AxiosResponse } from "axios";
import { Model, ModelData } from "./Model";


export default interface Api {
	get<T extends ModelData>(url: string, data?: RequestData, options?: RequestOptions): Promise<GetResponse<T>> | Promise<AxiosResponse>;
    post<T extends ModelData>(url: string, data?: RequestData, options?: RequestOptions): Promise<T> | Promise<AxiosResponse>;
    put(url: string, data?: RequestData, options?: RequestOptions): Promise<PutResponse> | Promise<AxiosResponse>;
    patch<T extends ModelData>(url: string, data?: RequestData, options?: RequestOptions): Promise<T> | Promise<AxiosResponse>;
    delete(url: string, data?: RequestData, options?: RequestOptions): Promise<void> | Promise<AxiosResponse>;

    fetchModel<T extends ModelData>(params: { url: string, data?: RequestData, requestOptions?: RequestOptions }): Promise<FetchResponse<T>>;

    saveModel<T extends ModelData>(params: { url: string, data?: RequestData, isNew?: boolean, requestOptions?: RequestOptions }): Promise<{ data: T }>;
    saveAllModels<T extends ModelData>(params: { url: string, data?: RequestData, model: Model<T>, requestOptions?: RequestOptions }): Promise<PutResponse | AxiosResponse>;

    deleteModel(params: { url: string, requestOptions?: RequestOptions }): Promise<void> | Promise<AxiosResponse>;

    buildFetchModelParams<T>(model: Model<T>): { with: string };
}

export interface FetchResponse<T> {
    data: T;
    repos: { [key: string]: ModelData[] };
    relMapping: { [key: string]: string };
    reverseRelMapping: { [key: string]: string };
}

export interface FetchStoreResponse<T> {
    data: T[];
    repos: { [key: string]: ModelData[] };
    relMapping: { [key: string]: string };
    reverseRelMapping: { [key: string]: string };
    totalRecords: number;
    response: GetResponse<T>;
}

export interface GetResponse<T extends ModelData> {
    data: T[] | T;
    with: { [key: string]: ModelData[] };
    with_mapping: { [key: string]: string };
    with_related_name_mapping: { [key: string]: string };
    meta: { total_records?: number };
    debug: { request_id: string };
}

export interface PutResponse {
    idmap: {
        [x: string]: number[][];
    }
}

export interface RequestOptions {
    // If true, returns the whole axios response. Otherwise, parse the response data,
    skipRequestError?: boolean;
    skipFormatter?: boolean;
    params?: RequestData;
    headers?: object;
}

export interface FetchStoreOptions {
    url?: string;
    data?: RequestData;
    requestOptions?: RequestOptions;
    with?: string;
    limit?: number | string;
    offset?: number;
}

export interface RequestData {

}
