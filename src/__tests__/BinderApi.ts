import axios, {AxiosResponse} from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {BinderApi} from "../BinderApi";

let mock

beforeEach(() => {
    mock = new MockAdapter(axios);
});

afterEach(() => {
    if (mock) {
        mock.restore();
        mock = null;
    }
});

test('GET request', () => {
    mock.onAny().replyOnce(config => {
        expect(config.url).toBe('/api/asdf/');
        expect(config.method).toBe('get');
        expect(config.params).toEqual(undefined);
        expect(config.data).toEqual(undefined);
        return [200, {id: 2}];
    });

    const api = new BinderApi();



    api.get('/api/asdf/').then(res => {
        expect(res).toEqual({id: 2});
    });
});

test('GET request with params', () => {
    mock.onAny().replyOnce(config => {
        expect(config.params).toEqual({ foo: 'bar' });
        expect(config.data).toEqual(undefined);
        return [200, {}];
    });

    return new BinderApi().get('/api/asdf/', { foo: 'bar' });
});

test('GET request with default headers', () => {
    mock.onAny().replyOnce(config => {
        expect(config.headers['X-Foo']).toBe('bar');
        return [200, {}];
    });

    const api = new BinderApi();
    api.defaultHeaders['X-Foo'] = 'bar';
    return api.get('/api/asdf/');
});

test('GET request with custom Content-Type', () => {
    mock.onAny().replyOnce(config => {
        expect(config.headers).toEqual({
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'multipart/form-data',
            'X-Foo': 'bar',
        });
        return [200, {}];
    });

    const api = new BinderApi();
    // Also add a default header to verify that the header is not overridden
    api.defaultHeaders['X-Foo'] = 'bar';
    return api.get('/api/asdf/', null, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
});

test('GET request without trailing slash', () => {
    const api = new BinderApi();
    expect(() => {
        return api.get('/api/asdf');
    }).toThrow(
        'Binder does not accept urls that do not have a trailing slash: /api/asdf'
    );
});


test('GET request skipping formatter', () => {
    mock.onAny().replyOnce(config => {
        return [200, {}];
    });

    const api = new BinderApi();
    return api.get('/api/asdf/', null, { skipFormatter: true }).then(res  => {
        expect((res as AxiosResponse).status).toBe(200);
    });
});

test('POST request', () => {
    mock.onAny().replyOnce(config => {
        expect(config.url).toBe('/api/asdf/');
        expect(config.method).toBe('post');
        expect(config.params).toEqual(undefined);
        return [200, { id: 2 }];
    });

    return new BinderApi().post('/api/asdf/').then(res => {
        expect(res).toEqual({ id: 2 });
    });
});


test('POST request to custom endpoint (#78)', () => {
    mock.onAny().replyOnce(config => {
        expect(config.baseURL).toBe('/api/foo/')
        expect(config.url).toBe('/asdf/');
        expect(config.method).toBe('post');
        expect(config.params).toEqual(undefined);
        return [200, { }];
    });

    const api = new BinderApi();
    api.baseUrl = '/api/foo/';

    return api.post('/asdf/').then(res => {
        expect(res).toEqual({ });
    });
});

test('POST request with data', () => {
    mock.onAny().replyOnce(config => {
        expect(config.params).toEqual(undefined);
        expect(config.data).toEqual(JSON.stringify({ foo: 'bar' }));
        return [200, {}];
    });

    return new BinderApi().post('/api/asdf/', { foo: 'bar' });
});

test('POST request with params', () => {
    mock.onAny().replyOnce(config => {
        expect(config.params).toEqual({ branch: 1 });
        expect(config.data).toEqual(JSON.stringify({ foo: 'bar' }));
        return [200, {}];
    });

    return new BinderApi().post(
        '/api/asdf/',
        { foo: 'bar' },
        { params: { branch: 1 } }
    );
});

test('POST request with CSRF', () => {
    mock.onAny().replyOnce(config => {
        expect(config.headers['X-Csrftoken']).toBe('ponys');
        return [200, {}];
    });
    const api = new BinderApi();
    api.csrfToken = 'ponys';
    return api.post('/api/asdf/', { foo: 'bar' });
});