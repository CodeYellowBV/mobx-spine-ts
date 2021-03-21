import axios from 'axios';
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