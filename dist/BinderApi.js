"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinderApi = void 0;
const axios_1 = __importDefault(require("axios"));
const lodash_1 = require("lodash");
function csrfSafeMethod(method) {
    // These HTTP methods do not require CSRF protection.
    return /^(GET|HEAD|OPTIONS|TRACE)$/i.test(method);
}
class BinderApi {
    constructor() {
        this.axios = axios_1.default.create();
        this.defaultHeaders = {};
        this.baseUrl = null;
        this.csrfToken = null;
        this.onRequestError = null;
        this.__initializeCsrfHandling();
    }
    __initializeCsrfHandling() {
        this.axios.interceptors.response.use(null, err => {
            const status = lodash_1.get(err, 'response.status');
            const statusErrCode = lodash_1.get(err, 'response.data.code');
            const doNotRetry = lodash_1.get(err, 'response.config.doNotRetry');
            if (status === 403 &&
                statusErrCode === 'CSRFFailure' &&
                !doNotRetry) {
                return this.fetchCsrfToken().then(() => this.axios(Object.assign(Object.assign({}, err.response.config), { doNotRetry: true })));
            }
            return Promise.reject(err);
        });
    }
    fetchCsrfToken() {
        return this.get('/api/bootstrap/').then(res => {
            // This conversion is dirty because the BootstrapResponse is a
            // ... special get response
            this.csrfToken = res.csrf_token;
        });
    }
    /**
     * Determines the csrf token that needs to be added to the request, based upon the method, and the internally
     * set csrf token
     */
    __csrfToken(method) {
        return csrfSafeMethod(method)
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
    __request(method, url, data, options) {
        if (!options) {
            options = {};
        }
        // Validate requested url
        this.__testUrl(url);
        const csrfToken = this.__csrfToken(method);
        const headers = Object.assign({
            'Content-Type': 'application/json',
            'X-Csrftoken': csrfToken,
        }, this.defaultHeaders, options.headers);
        const config = {
            baseURL: this.baseUrl,
            url: url,
            method: method,
            data: this.__formatData(method, data),
            params: this.__formatQueryParams(method, data, options)
        };
        Object.assign(config, options);
        config.headers = headers;
        const xhr = this.axios(config);
        // We fork the promise tree as we want to have the error traverse to the listeners
        if (this.onRequestError && options.skipRequestError !== true) {
            xhr.catch(this.onRequestError);
        }
        const onSuccess = options.skipFormatter === true
            ? foo => foo
            : this.__responseFormatter;
        return xhr.then(onSuccess);
    }
    parseBackendValidationErrors(response) {
        const valErrors = lodash_1.get(response, 'data.errors');
        if (response['status'] === 400 && valErrors) {
            return valErrors;
        }
        return null;
    }
    buildFetchModelParams(model) {
        return {
            // TODO: I really dislike that this is comma separated and not an array.
            // We should fix this in the Binder API.
            with: model.__activeRelations
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
    __formatData(method, data) {
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
    __formatQueryParams(method, data, options) {
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
    __responseFormatter(res) {
        // Formats the axios response to a data object
        return res.data;
    }
    /**
     * Tests if the url is ok, and throws an error if an error is found
     * @param url
     */
    __testUrl(url) {
        if (!url.endsWith('/')) {
            throw new Error(`Binder does not accept urls that do not have a trailing slash: ${url}`);
        }
    }
    fetchModel({ url, data, requestOptions }) {
        return this.get(url, data, requestOptions).then((rawRes) => {
            // This will go wrong if requestOptions contains skipFormatter
            const res = rawRes;
            return {
                data: res.data,
                repos: res.with,
                relMapping: res.with_mapping,
                reverseRelMapping: res.with_related_name_mapping,
            };
        });
    }
    saveModel({ url, data, isNew, requestOptions }) {
        const method = isNew ? 'post' : 'patch';
        return this[method](url, data, requestOptions)
            .then((newData) => {
            // This won't go well if the skipFormatter parameter is used
            return { data: newData };
        })
            .catch(err => {
            if (err.response) {
                err.valErrors = this.parseBackendValidationErrors(err.response);
            }
            throw err;
        });
    }
    saveAllModels(params) {
        return this.put(params.url, {
            data: params.data.data,
            with: params.data.relations,
        }, params.requestOptions)
            .then((res) => {
            if (res['idmap']) {
                params.model.__parseNewIds(res['idmap']);
            }
            return res;
        })
            .catch(err => {
            if (err.response) {
                err.valErrors = this.parseBackendValidationErrors(err.response);
            }
            throw err;
        });
    }
    get(url, data, options) {
        return this.__request('get', url, data, options);
    }
    post(url, data, options) {
        return this.__request('post', url, data, options);
    }
    put(url, data, options) {
        return this.__request('put', url, data, options);
    }
    patch(url, data, options) {
        return this.__request('patch', url, data, options);
    }
    delete(url, data, options) {
        return this.__request('delete', url, data, options);
    }
    deleteModel(options) {
        // TODO: kind of silly now, but we'll probably want better error handling soon.
        return this.delete(options.url, null, options.requestOptions);
    }
    buildFetchStoreParams(store) {
        const offset = store.getPageOffset();
        const limit = store.__state.limit;
        return {
            with: store.__activeRelations
                .map(store.Model['toBackendAttrKey'])
                .join(',') || null,
            limit: limit === null ? 'none' : limit,
            // Hide offset if zero so the request looks cleaner in DevTools.
            offset: offset || null,
        };
    }
    fetchStore(options) {
        return this.get(options.url, options.data, options.requestOptions).then((rawRes) => {
            // This won't go well if the skipFormatting option is used
            const res = rawRes;
            return {
                response: res,
                data: res.data,
                repos: res.with,
                relMapping: res.with_mapping,
                reverseRelMapping: res.with_related_name_mapping,
                totalRecords: res.meta.total_records,
            };
        });
    }
}
exports.BinderApi = BinderApi;
