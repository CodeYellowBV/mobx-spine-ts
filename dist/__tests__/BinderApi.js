"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios"));
var axios_mock_adapter_1 = __importDefault(require("axios-mock-adapter"));
var BinderApi_1 = require("../BinderApi");
var mock;
beforeEach(function () {
    mock = new axios_mock_adapter_1.default(axios_1.default);
});
afterEach(function () {
    if (mock) {
        mock.restore();
        mock = null;
    }
});
test('GET request', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.url).toBe('/api/asdf/');
        expect(config.method).toBe('get');
        expect(config.params).toEqual(undefined);
        expect(config.data).toEqual(undefined);
        return [200, { id: 2 }];
    });
    var api = new BinderApi_1.BinderApi();
    api.get('/api/asdf/').then(function (res) {
        expect(res).toEqual({ id: 2 });
    });
});
test('GET request with params', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.params).toEqual({ foo: 'bar' });
        expect(config.data).toEqual(undefined);
        return [200, {}];
    });
    return new BinderApi_1.BinderApi().get('/api/asdf/', { foo: 'bar' });
});
test('GET request with default headers', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.headers['X-Foo']).toBe('bar');
        return [200, {}];
    });
    var api = new BinderApi_1.BinderApi();
    api.defaultHeaders['X-Foo'] = 'bar';
    return api.get('/api/asdf/');
});
test('GET request with custom Content-Type', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.headers).toEqual({
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'multipart/form-data',
            'X-Foo': 'bar',
        });
        return [200, {}];
    });
    var api = new BinderApi_1.BinderApi();
    // Also add a default header to verify that the header is not overridden
    api.defaultHeaders['X-Foo'] = 'bar';
    return api.get('/api/asdf/', null, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
});
test('GET request without trailing slash', function () {
    var api = new BinderApi_1.BinderApi();
    expect(function () {
        return api.get('/api/asdf');
    }).toThrow('Binder does not accept urls that do not have a trailing slash: /api/asdf');
});
test('GET request skipping formatter', function () {
    mock.onAny().replyOnce(function (config) {
        return [200, {}];
    });
    var api = new BinderApi_1.BinderApi();
    return api.get('/api/asdf/', null, { skipFormatter: true }).then(function (res) {
        expect(res.status).toBe(200);
    });
});
test('POST request', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.url).toBe('/api/asdf/');
        expect(config.method).toBe('post');
        expect(config.params).toEqual(undefined);
        return [200, { id: 2 }];
    });
    return new BinderApi_1.BinderApi().post('/api/asdf/').then(function (res) {
        expect(res).toEqual({ id: 2 });
    });
});
test('POST request to custom endpoint (#78)', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.baseURL).toBe('/api/foo/');
        expect(config.url).toBe('/asdf/');
        expect(config.method).toBe('post');
        expect(config.params).toEqual(undefined);
        return [200, {}];
    });
    var api = new BinderApi_1.BinderApi();
    api.baseUrl = '/api/foo/';
    return api.post('/asdf/').then(function (res) {
        expect(res).toEqual({});
    });
});
test('POST request with data', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.params).toEqual(undefined);
        expect(config.data).toEqual(JSON.stringify({ foo: 'bar' }));
        return [200, {}];
    });
    return new BinderApi_1.BinderApi().post('/api/asdf/', { foo: 'bar' });
});
test('POST request with params', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.params).toEqual({ branch: 1 });
        expect(config.data).toEqual(JSON.stringify({ foo: 'bar' }));
        return [200, {}];
    });
    return new BinderApi_1.BinderApi().post('/api/asdf/', { foo: 'bar' }, { params: { branch: 1 } });
});
test('POST request with CSRF', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.headers['X-Csrftoken']).toBe('ponys');
        return [200, {}];
    });
    var api = new BinderApi_1.BinderApi();
    api.csrfToken = 'ponys';
    return api.post('/api/asdf/', { foo: 'bar' });
});
test('POST request with failing CSRF', function () {
    mock.onAny().replyOnce(function (config) {
        return [403, { code: 'CSRFFailure' }];
    });
    mock.onGet('/api/bootstrap/').replyOnce(function (config) {
        return [200, { csrf_token: 'beasts' }];
    });
    mock.onAny().replyOnce(function (config) {
        return [200, { foo: true }];
    });
    var api = new BinderApi_1.BinderApi();
    api.csrfToken = 'ponys';
    return api.post('/api/asdf/', { foo: 'bar' }).then(function (res) {
        expect(res).toEqual({ foo: true });
        expect(api.csrfToken).toBe('beasts');
    });
});
test('POST request with failing second CSRF', function () {
    mock.onAny().replyOnce(function (config) {
        return [403, { code: 'CSRFFailure' }];
    });
    mock.onGet('/api/bootstrap/').replyOnce(function (config) {
        return [200, { csrf_token: 'beasts' }];
    });
    mock.onAny().replyOnce(function (config) {
        return [403, { code: 'CSRFFailure' }];
    });
    var api = new BinderApi_1.BinderApi();
    api.csrfToken = 'ponys';
    return api.post('/api/asdf/', { foo: 'bar' }).catch(function (err) {
        expect(err.response.status).toBe(403);
    });
});
test('PUT request', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.method).toBe('put');
        return [200, {}];
    });
    return new BinderApi_1.BinderApi().put('/api/asdf/');
});
test('PATCH request', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.method).toBe('patch');
        return [200, {}];
    });
    return new BinderApi_1.BinderApi().patch('/api/asdf/');
});
test('DELETE request', function () {
    mock.onAny().replyOnce(function (config) {
        expect(config.method).toBe('delete');
        return [200, {}];
    });
    return new BinderApi_1.BinderApi().delete('/api/asdf/');
});
test('Failing request without onRequestError', function () {
    var errorHandle = jest.fn();
    mock.onAny().replyOnce(function () {
        return [500, {}];
    });
    var api = new BinderApi_1.BinderApi();
    // @ts-ignore
    api.__responseFormatter = jest.fn();
    return api
        .delete('/api/asdf/')
        .catch(function () { return errorHandle(); })
        .then(function () {
        // @ts-ignore
        expect(api.__responseFormatter).not.toHaveBeenCalled();
        expect(errorHandle).toHaveBeenCalled();
    });
});
test('Failing request with onRequestError', function () {
    var errorHandle = jest.fn();
    mock.onAny().replyOnce(function () {
        return [500, {}];
    });
    var api = new BinderApi_1.BinderApi();
    // @ts-ignore
    api.__responseFormatter = jest.fn();
    api.onRequestError = jest.fn();
    return api
        .delete('/api/asdf/')
        .catch(function () { return errorHandle(); })
        .then(function () {
        expect(api.onRequestError).toHaveBeenCalled();
        // @ts-ignore
        expect(api.__responseFormatter).not.toHaveBeenCalled();
        expect(errorHandle).toHaveBeenCalled();
    });
});
test('Failing request with onRequestError and skipRequestError option', function () {
    var errorHandle = jest.fn();
    mock.onAny().replyOnce(function () {
        return [500, {}];
    });
    var api = new BinderApi_1.BinderApi();
    // @ts-ignore
    api.__responseFormatter = jest.fn();
    api.onRequestError = jest.fn();
    return api
        .delete('/api/asdf/', null, { skipRequestError: true })
        .catch(function () { return errorHandle(); })
        .then(function () {
        expect(api.onRequestError).not.toHaveBeenCalled();
    });
});
