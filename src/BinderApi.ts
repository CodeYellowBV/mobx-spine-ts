import axios, {AxiosInstance, AxiosPromise, AxiosRequestConfig, AxiosResponse, Method} from 'axios';
import {get} from 'lodash';

interface RequestOptions {
    // If true, returns the whole axios response. Otherwise, parse the response data,
    skipFormatter?: boolean
    params?: RequestData
    headers?: any
}

interface RequestData {

}

function csrfSafeMethod(method: Method) {
    // These HTTP methods do not require CSRF protection.
    return /^(GET|HEAD|OPTIONS|TRACE)$/i.test(method);
}


export class BinderApi {
    axios: AxiosInstance = axios.create();
    defaultHeaders: any = {}
    baseUrl?: string = null;
    csrfToken?: string = null;

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

    /**
     * Generic request to the binder api
     *
     * @param method
     * @param url
     * @param data
     * @param options
     */
    protected __request(method: Method, url: string, data?: RequestData, options?: RequestOptions): Promise<object> {

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
    protected __formatData(method: Method, data?: RequestData): RequestData {
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
    protected __formatQueryParams(method: Method, data?: RequestData, options?: RequestOptions): RequestData {
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


    public get(url: string, data?: RequestData, options ?: RequestOptions): Promise<object> {
        return this.__request('get', url, data, options);
    }

    public post(url: string, data?: RequestData, options ?: RequestOptions): Promise<object> {
        return this.__request('post', url, data, options);
    }

    public fetchCsrfToken() {
        return this.get('/api/bootstrap/').then(res => {
            this.csrfToken = (res as BootstrapResponse).csrf_token;
        });
    }

    /**
     * Determines the csrf token that needs to be added to the request, based upon the method, and the internally
     * set csrf token
     */
    protected __csrfToken(method: Method): string | undefined {
        return csrfSafeMethod(method)
            ? undefined
            : this.csrfToken;
    }


}

