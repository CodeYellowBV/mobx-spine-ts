import { ModelData } from "../Model";
/**
 * Interface for a model response provided bt Binder
 */
export interface Response<T extends ModelData> {
    data: T | T[];
    with: {
        [key: string]: ModelData[];
    };
    meta: object;
    with_mapping: {
        [key: string]: string;
    };
    with_related_name_mapping: {
        [key: string]: string;
    };
}
/**
 * In the old implementation, many of the methods in mobx-spine used an different object to denote a binder api response.
 * It had the same data, but with other naming.
 */
export interface LegacyResponse<T extends ModelData> {
    data: T | T[];
    repos?: {
        [key: string]: ModelData[];
    };
    relMapping?: {
        [key: string]: string;
    };
    reverseRelMapping?: {
        [key: string]: string;
    };
}
/**
 * Union of above types. This type supports both legacy interface or old interface
 */
export declare type ResponseAdapter<T extends ModelData> = Response<T> | LegacyResponse<T>;
/**
 * Function which takes the Response or LegacyResponse, and always returns a response
 * @param response
 */
export declare function modelResponseAdapter<T extends ModelData>(response: ResponseAdapter<T>): Response<T>;
