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
