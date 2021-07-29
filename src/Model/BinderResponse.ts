import {ModelData} from "../Model";

/**
 * Interface for a model response provided bt Binder
 */
export interface Response<T extends ModelData> {
    data: T | T[],
    with: { [key: string]: ModelData[] },
    meta: object
    with_mapping: { [key: string]: string },
    with_related_name_mapping: { [key: string]: string }
}


/**
 * In the old implementation, many of the methods in mobx-spine used an different object to denote a binder api response.
 * It had the same data, but with other naming.
 */
export interface LegacyResponse<T extends ModelData> {
    data: T | T[],
    repos?: { [key: string]: ModelData[] },
    relMapping?: { [key: string]: string },
    reverseRelMapping?: { [key: string]: string },
}

interface MetaResponse {
    // This is suboptimal, but I can't find a nice easy TypeScript way of defining this...
    data: object;
}

/**
 * Union of above types. This type supports both legacy interface or old interface
 */
export type ResponseAdapter<T extends ModelData> =
    Response<T>
    | LegacyResponse<T> | MetaResponse;

/**
 * Function which takes the Response or LegacyResponse, and always returns a response
 * @param response
 */
export function modelResponseAdapter<T extends ModelData>(response: ResponseAdapter<T>): Response<T> {
    if ((response as Response<T>).with !== undefined) {
        return response as Response<T>;
    }

    if (response.data) {
        const metaData = response.data['_meta'];
        if (metaData) {
            return {
                data: response.data as T,
                with: metaData['with'] || {},
                meta: {},
                with_mapping: metaData['with_mapping'] || {},
                with_related_name_mapping: metaData['with_related_name_mapping'] || {}
            };
        }
    }

    return {
        data: response.data as T,
        with: (response as LegacyResponse<T>).repos || {},
        meta: {},
        with_mapping: (response as LegacyResponse<T>).relMapping || {},
        with_related_name_mapping: (response as LegacyResponse<T>).reverseRelMapping || {},
    };
}
