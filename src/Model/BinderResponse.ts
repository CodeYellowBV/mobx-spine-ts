import {ModelData} from "../Model";

/**
 * Interface for a model response provided bt Binder
 */
export interface Response<T extends ModelData> {
    data: T,
    with: { [key: string]: ModelData[] },
    meta: object
    with_mapping: { [key: string]: string },
}


/**
 * In the old implementation, many of the methods in mobx-spine used an different object to denote a binder api response.
 * It had the same data, but with other naming.
 */
export interface LegacyResponse<T extends ModelData> {
    data: T,
    repos?: { [key: string]: ModelData[] },
    relMapping?: { [key: string]: string },
}

/**
 * Union of above types. This type supports both legacy interface or old interface
 */
export type ResponseAdapter<T extends ModelData> =
    Response<T>
    | LegacyResponse<T>;

/**
 * Function which takes the Response or LegacyResponse, and always returns a response
 * @param response
 */
export function modelResponseAdapter<T extends ModelData>(response: ResponseAdapter<T>): Response<T> {
    if ((response as Response<T>).with !== undefined) {
        return response as Response<T>;
    }

    return {
        data: response.data,
        with: (response as LegacyResponse<T>).repos || {},
        meta: {},
        with_mapping: (response as LegacyResponse<T>).relMapping || {}
    }
}
