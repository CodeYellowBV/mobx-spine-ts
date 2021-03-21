"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinderApi = void 0;
const axios_1 = require("axios");
class BinderApi {
    constructor() {
        this.axios = axios_1.default.create();
    }
    __request(method, url, data, options) {
        const config = {
            url: url,
            method: method
        };
        const xhr = this.axios(config);
        return xhr;
    }
    get(url, data, options) {
        return this.__request('get', url, data, options);
    }
}
exports.BinderApi = BinderApi;
