import { AxiosResponse } from "axios";
import { Model, ModelData } from "Model";

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
}

export interface FetchResponse<T> {
    data: T;
    repos: object;
    relMapping: object;
    reverseRelMapping: object;
}

export interface GetResponse<T extends ModelData> {
    data: T[] | T;
    with: object;
    with_mapping: object;
    with_related_name_mapping: object;
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

export interface RequestData {

}
