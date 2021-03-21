import axios, {AxiosInstance, AxiosPromise, AxiosRequestConfig, AxiosResponse, Method} from 'axios';

interface RequestOptions {
    // If true, returns the whole axios response. Otherwise, parse the response data,
    skipFormatter?: boolean
    params?: RequestData
    headers?: any
}

interface RequestData {

}


export class BinderApi {

    axios: AxiosInstance = axios.create();
    defaultHeaders: any = {}

    constructor() {
    }

    /**
     * Generic request to the binder api
     *
     * @param method
     * @param url
     * @param data
     * @param options
     */
    __request(method: Method, url: string, data?: RequestData, options?: RequestOptions): Promise<object> {

        if (!options) {
            options = {};
        }

        // Validate requested url
        this.__testUrl(url);

        const headers = Object.assign(
            {
                'Content-Type': 'application/json',
            },
            this.defaultHeaders,
            options.headers
        )

        const config: AxiosRequestConfig = {
            url: url,
            method: method,
            data: this.__formatData(method, data),
            params: this.__formatQueryParams(method, data, options),
            headers: headers
        };
        const xhr: AxiosPromise = this.axios(config);

        const onSuccess =
            options.skipFormatter === true
                ? foo => foo
                : this.__responseFormatter;


        return xhr.then(onSuccess);
    }

    /**
     * Format the request data that is send to the server, based upon the provided data, and the http method
     *
     * Mainly, makes sure that GET data is not send as data, but as parameterss
     *
     * @param method
     * @param data
     */
    __formatData(method: Method, data?: RequestData): RequestData {
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
    __formatQueryParams(method: Method, data?: RequestData, options?: RequestOptions): RequestData {
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
    __responseFormatter(res: AxiosResponse): object {
        // Formats the axios response to a data object
        return res.data
    }

    /**
     * Tests if the url is ok, and throws an error if an error is found
     * @param url
     */
    __testUrl(url: string) {
        if (!url.endsWith('/')) {
            throw new Error(
                `Binder does not accept urls that do not have a trailing slash: ${url}`
            );
        }
    }

    get(url: string, data?: RequestData, options ?: RequestOptions): Promise<object> {
        return this.__request('get', url, data, options);
    }
}

