import {ModelData} from "../Model";

export interface Response<T extends ModelData> {
    data: T,
    with: Map<string, Response<any>>,
    meta: object
    withMapping: Map<string, string>
}


/**
 * In the old implementation, many of the methods in mobx-spine used an different object to denote a binder api response.
 * It had the same data, but with other naming.
 */
export interface LegacyResponse<T extends ModelData> {
    data: T,
    repos: Map<string, Response<any>>,
    relMapping: Map<string, string>
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
        with: (response as LegacyResponse<T>).repos,
        meta: {},
        withMapping: (response as LegacyResponse<T>).relMapping
    }
}
