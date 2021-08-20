"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinderApi = void 0;
var axios_1 = __importDefault(require("axios"));
var lodash_1 = require("lodash");
function csrfSafeMethod(method) {
    // These HTTP methods do not require CSRF protection.
    return /^(GET|HEAD|OPTIONS|TRACE)$/i.test(method);
}
var BinderApi = /** @class */ (function () {
    function BinderApi() {
        this.axios = axios_1.default.create();
        this.defaultHeaders = {};
        this.baseUrl = null;
        this.csrfToken = null;
        this.onRequestError = null;
        this.__initializeCsrfHandling();
    }
    BinderApi.prototype.__initializeCsrfHandling = function () {
        var _this = this;
        this.axios.interceptors.response.use(null, function (err) {
            var status = lodash_1.get(err, 'response.status');
            var statusErrCode = lodash_1.get(err, 'response.data.code');
            var doNotRetry = lodash_1.get(err, 'response.config.doNotRetry');
            if (status === 403 &&
                statusErrCode === 'CSRFFailure' &&
                !doNotRetry) {
                return _this.fetchCsrfToken().then(function () {
                    return _this.axios(__assign(__assign({}, err.response.config), { doNotRetry: true }));
                });
            }
            return Promise.reject(err);
        });
    };
    BinderApi.prototype.fetchCsrfToken = function () {
        var _this = this;
        return this.get('/api/bootstrap/').then(function (res) {
            // This conversion is dirty because the BootstrapResponse is a
            // ... special get response
            _this.csrfToken = res.csrf_token;
        });
    };
    /**
     * Determines the csrf token that needs to be added to the request, based upon the method, and the internally
     * set csrf token
     */
    BinderApi.prototype.__csrfToken = function (method) {
        return csrfSafeMethod(method)
            ? undefined
            : this.csrfToken;
    };
    /**
     * Generic request to the binder api
     *
     * @param method
     * @param url
     * @param data
     * @param options
     */
    BinderApi.prototype.__request = function (method, url, data, options) {
        if (!options) {
            options = {};
        }
        // Validate requested url
        this.__testUrl(url);
        var csrfToken = this.__csrfToken(method);
        var headers = Object.assign({
            'Content-Type': 'application/json',
            'X-Csrftoken': csrfToken,
        }, this.defaultHeaders, options.headers);
        var config = {
            baseURL: this.baseUrl,
            url: url,
            method: method,
            data: this.__formatData(method, data),
            params: this.__formatQueryParams(method, data, options)
        };
        Object.assign(config, options);
        config.headers = headers;
        var xhr = this.axios(config);
        // We fork the promise tree as we want to have the error traverse to the listeners
        if (this.onRequestError && options.skipRequestError !== true) {
            xhr.catch(this.onRequestError);
        }
        var onSuccess = options.skipFormatter === true
            ? function (foo) { return foo; }
            : this.__responseFormatter;
        return xhr.then(onSuccess);
    };
    BinderApi.prototype.parseBackendValidationErrors = function (response) {
        var valErrors = lodash_1.get(response, 'data.errors');
        if (response['status'] === 400 && valErrors) {
            return valErrors;
        }
        return null;
    };
    BinderApi.prototype.buildFetchModelParams = function (model) {
        return {
            // TODO: I really dislike that this is comma separated and not an array.
            // We should fix this in the Binder API.
            with: model.__activeRelations
                .map(model.constructor['toBackendAttrKey'])
                .join(',') || null,
        };
    };
    /**
     * Format the request data that is send to the server, based upon the provided data, and the http method
     *
     * Mainly, makes sure that GET data is not send as data, but as parameterss
     *
     * @param method
     * @param data
     */
    BinderApi.prototype.__formatData = function (method, data) {
        // in a get method, we have never data
        if (method.toLowerCase() === 'get') {
            return undefined;
        }
        return data || undefined;
    };
    /**
     * Returns the query params. For GET request, use the provided data. For POST request use the options
     *
     * @param method
     * @param data
     * @param options
     */
    BinderApi.prototype.__formatQueryParams = function (method, data, options) {
        if (method.toLowerCase() === 'get' && data) {
            return data;
        }
        return options.params;
    };
    /**
     * Formats the raw response (including http headers, status, etc)
     *
     * @param res
     */
    BinderApi.prototype.__responseFormatter = function (res) {
        // Formats the axios response to a data object
        return res.data;
    };
    /**
     * Tests if the url is ok, and throws an error if an error is found
     * @param url
     */
    BinderApi.prototype.__testUrl = function (url) {
        if (!url.endsWith('/')) {
            throw new Error("Binder does not accept urls that do not have a trailing slash: " + url);
        }
    };
    BinderApi.prototype.fetchModel = function (_a) {
        var url = _a.url, data = _a.data, requestOptions = _a.requestOptions;
        return this.get(url, data, requestOptions).then(function (rawRes) {
            // This will go wrong if requestOptions contains skipFormatter
            var res = rawRes;
            return {
                data: res.data,
                repos: res.with,
                relMapping: res.with_mapping,
                reverseRelMapping: res.with_related_name_mapping,
            };
        });
    };
    BinderApi.prototype.saveModel = function (_a) {
        var _this = this;
        var url = _a.url, data = _a.data, isNew = _a.isNew, requestOptions = _a.requestOptions;
        var method = isNew ? 'post' : 'patch';
        return this[method](url, data, requestOptions)
            .then(function (newData) {
            // This won't go well if the skipFormatter parameter is used
            return { data: newData };
        })
            .catch(function (err) {
            if (err.response) {
                err.valErrors = _this.parseBackendValidationErrors(err.response);
            }
            throw err;
        });
    };
    BinderApi.prototype.saveAllModels = function (params) {
        var _this = this;
        return this.put(params.url, {
            data: params.data.data,
            with: params.data.relations,
        }, params.requestOptions)
            .then(function (res) {
            if (res['idmap']) {
                params.model.__parseNewIds(res['idmap']);
            }
            return res;
        })
            .catch(function (err) {
            if (err.response) {
                err.valErrors = _this.parseBackendValidationErrors(err.response);
            }
            throw err;
        });
    };
    BinderApi.prototype.get = function (url, data, options) {
        return this.__request('get', url, data, options);
    };
    BinderApi.prototype.post = function (url, data, options) {
        return this.__request('post', url, data, options);
    };
    BinderApi.prototype.put = function (url, data, options) {
        return this.__request('put', url, data, options);
    };
    BinderApi.prototype.patch = function (url, data, options) {
        return this.__request('patch', url, data, options);
    };
    BinderApi.prototype.delete = function (url, data, options) {
        return this.__request('delete', url, data, options);
    };
    BinderApi.prototype.deleteModel = function (options) {
        // TODO: kind of silly now, but we'll probably want better error handling soon.
        return this.delete(options.url, null, options.requestOptions);
    };
    BinderApi.prototype.buildFetchStoreParams = function (store) {
        var offset = store.getPageOffset();
        var limit = store.__state.limit;
        return {
            with: store.__activeRelations
                .map(store.Model['toBackendAttrKey'])
                .join(',') || null,
            limit: limit === null ? 'none' : limit,
            // Hide offset if zero so the request looks cleaner in DevTools.
            offset: offset || null,
        };
    };
    BinderApi.prototype.fetchStore = function (options) {
        return this.get(options.url, options.data, options.requestOptions).then(function (rawRes) {
            // This won't go well if the skipFormatting option is used
            var res = rawRes;
            return {
                response: res,
                data: res.data,
                repos: res.with,
                relMapping: res.with_mapping,
                reverseRelMapping: res.with_related_name_mapping,
                totalRecords: res.meta.total_records,
            };
        });
    };
    return BinderApi;
}());
exports.BinderApi = BinderApi;
