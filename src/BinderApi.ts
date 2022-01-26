import Api, { FetchResponse, FetchStoreOptions, FetchStoreResponse, GetResponse, PutResponse, RequestData, RequestOptions } from './Api';
import axios, {AxiosInstance, AxiosPromise, AxiosRequestConfig, AxiosResponse} from 'axios';
import {get} from 'lodash';
import { Store } from './Store';
import { Model, ModelData } from './Model';
import { BootstrapResponse } from './Interfaces';

function csrfSafestring(method: string) {
    // These HTTP methods do not require CSRF protection.
    return /^(GET|HEAD|OPTIONS|TRACE)$/i.test(method);
}

export class BinderApi implements Api {
    axios: AxiosInstance = axios.create();
    defaultHeaders: any = {}
    baseUrl?: string = null;
    csrfToken?: string = null;
    onRequestError?: (reason: any) => any = null;

    constructor() {
        this.__initializeCsrfHandling();
    }

    __initializeCsrfHandling() {
        this.axios.interceptors.response.use(null, err => {
            const status = get(err, 'response.status');
            const statusErrCode = get(err, 'response.data.code');
            const doNotRetry = get(err, 'response.config.doNotRetry');
            if (
                status === 403 &&
                statusErrCode === 'CSRFFailure' &&
                !doNotRetry
            ) {
                return this.fetchCsrfToken().then(() =>
                    this.axios({
                        ...err.response.config,
                        doNotRetry: true,
                    })
                );
            }
            return Promise.reject(err);
        });
    }

    public fetchCsrfToken() {
        return this.get('/api/bootstrap/').then(res => {
            // This conversion is dirty because the BootstrapResponse is a
            // ... special get response
            this.csrfToken = (res as any as BootstrapResponse).csrf_token;
        });
    }

    /**
     * Determines the csrf token that needs to be added to the request, based upon the method, and the internally
     * set csrf token
     */
    protected __csrfToken(method: string): string | undefined {
        return csrfSafestring(method)
            ? undefined
            : this.csrfToken;
    }


    /**
     * Generic request to the binder api
     *
     * @param method
     * @param url
     * @param data
     * @param options
     */
    protected __request(method: string, url: string, data?: RequestData, options?: RequestOptions): Promise<any> {

        if (!options) {
            options = {};
        }

        // Validate requested url
        this.__testUrl(url);

        const csrfToken = this.__csrfToken(method);

        const headers = Object.assign(
            {
                'Content-Type': 'application/json',
                'X-Csrftoken': csrfToken,
            },
            this.defaultHeaders,
            options.headers
        );

        const config: AxiosRequestConfig = {
            baseURL: this.baseUrl,
            url: url,
            method: method,
            data: this.__formatData(method, data),
            params: this.__formatQueryParams(method, data, options)
        };
        Object.assign(config, options);
        config.headers = headers;
        const xhr: AxiosPromise = this.axios(config);

        // We fork the promise tree as we want to have the error traverse to the listeners
        if (this.onRequestError && options.skipRequestError !== true) {
            xhr.catch(this.onRequestError);
        }

        const onSuccess =
            options.skipFormatter === true
                ? foo => foo
                : this.__responseFormatter;


        return xhr.then(onSuccess);
    }

    parseBackendValidationErrors(response: object): object | null {
        const valErrors = get(response, 'data.errors');
        if (response['status'] === 400 && valErrors) {
            return valErrors;
        }
        return null;
    }

    buildFetchModelParams<T>(model: Model<T>) {
        return {
            // TODO: I really dislike that this is comma separated and not an array.
            // We should fix this in the Binder API.
            with:
                model.__activeRelations
                    .map(model.constructor['toBackendAttrKey'])
                    .join(',') || null,
        };
    }

    /**
     * Format the request data that is send to the server, based upon the provided data, and the http method
     *
     * Mainly, makes sure that GET data is not send as data, but as parameterss
     *
     * @param method
     * @param data
     */
    protected __formatData(method: string, data?: RequestData): RequestData {
        // in a get method, we have never data
        if (method.toLowerCase() === 'get') {
            return undefined;
        }
        return data || undefined;
    }

    /**
     * Returns the query params. For GET request, use the provided data. For POST request use the options
     *
     * @param method
     * @param data
     * @param options
     */
    protected __formatQueryParams(method: string, data?: RequestData, options?: RequestOptions): RequestData {
        if (method.toLowerCase() === 'get' && data) {
            return data;
        }

        return options.params;
    }

    /**
     * Formats the raw response (including http headers, status, etc)
     *
     * @param res
     */
    protected __responseFormatter(res: AxiosResponse): object {
        // Formats the axios response to a data object
        return res.data
    }

    /**
     * Tests if the url is ok, and throws an error if an error is found
     * @param url
     */
    protected __testUrl(url: string) {
        if (!url.endsWith('/')) {
            throw new Error(
                `Binder does not accept urls that do not have a trailing slash: ${url}`
            );
        }
    }

    fetchModel<T extends ModelData>({ url, data, requestOptions }): Promise<FetchResponse<T>> {
        return this.get<T>(url, data, requestOptions).then((rawRes: GetResponse<T> | AxiosResponse) => {
            // This will go wrong if requestOptions contains skipFormatter
            const res = rawRes as GetResponse<T>;
            return {
                data: res.data as T,
                repos: res.with,
                relMapping: res.with_mapping,
                reverseRelMapping: res.with_related_name_mapping,
            };
        });
    }

    saveModel<T extends ModelData>({ url, data, isNew, requestOptions }): Promise<{ data: T }> {
        const method = isNew ? 'post' : 'patch';

        return this[method](url, data, requestOptions)
            // @ts-ignore
            .then((newData: T | AxiosResponse) => {
                // This won't go well if the skipFormatter parameter is used
                return { data: newData as T};
            })
            .catch(err => {
                if (err.response) {
                    err.valErrors = this.parseBackendValidationErrors(
                        err.response
                    );
                }
                throw err;
            });
    }

    saveAllModels<T extends ModelData>(params: { url: string, data: any, model: Model<T>, requestOptions: RequestOptions }): Promise<PutResponse | AxiosResponse> {
        return this.put(
            params.url,
            {
                data: params.data.data,
                with: params.data.relations,
            },
            params.requestOptions
        )
            .then((res: PutResponse | AxiosResponse) => {
                if (res['idmap']) {
                    params.model.__parseNewIds(res['idmap']);
                }
                return res;
            })
            .catch(err => {
                if (err.response) {
                    err.valErrors = this.parseBackendValidationErrors(
                        err.response
                    );
                }
                throw err;
            });
    }

    public get<T>(url: string, data?: RequestData, options ?: RequestOptions): Promise<GetResponse<T>> | Promise<AxiosResponse> {
        return this.__request('get', url, data, options);
    }

    public post<T>(url: string, data?: RequestData, options ?: RequestOptions): Promise<T> | Promise<AxiosResponse> {
        return this.__request('post', url, data, options);
    }

    public put(url: string, data?: RequestData, options ?: RequestOptions): Promise<PutResponse> | Promise<AxiosResponse> {
        return this.__request('put', url, data, options);
    }

    public patch<T>(url: string, data?: RequestData, options ?: RequestOptions): Promise<T> | Promise<AxiosResponse> {
        return this.__request('patch', url, data, options);
    }

    public delete(url: string, data?: RequestData, options ?: RequestOptions): Promise<void> | Promise<AxiosResponse> {
        return this.__request('delete', url, data, options);
    }

    deleteModel(options: { url: string, requestOptions: RequestOptions }): Promise<void> | Promise<AxiosResponse> {
        // TODO: kind of silly now, but we'll probably want better error handling soon.
        return this.delete(options.url, null, options.requestOptions);
    }

    buildFetchStoreParams<T extends ModelData, U extends Model<T>>(store: Store<T, U>) {
        const offset = store.getPageOffset();
        const limit = store.__state.limit;
        return {
            with:
                store.__activeRelations
                    .map(store.Model['toBackendAttrKey'])
                    .join(',') || null,
            limit: limit === null ? 'none' : limit,
            // Hide offset if zero so the request looks cleaner in DevTools.
            offset: offset || null,
        };
    }

    fetchStore<T extends ModelData>(options: FetchStoreOptions): Promise<FetchStoreResponse<T>> {
        return this.get<T>(options.url, options.data, options.requestOptions).then((rawRes: GetResponse<T> | AxiosResponse) => {
            // This won't go well if the skipFormatting option is used
            const res = rawRes as GetResponse<T>;
            return {
                response: res,
                data: res.data as T[],
                repos: res.with,
                relMapping: res.with_mapping,
                reverseRelMapping: res.with_related_name_mapping,
                totalRecords: res.meta.total_records,
            };
        });
    }
}
