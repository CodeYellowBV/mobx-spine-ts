# Setup
For the setup of Mobx-spine-ts a very basic typescript & jest is used. They are linked together using 'ts-jest' For documentation see:

- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/docs/getting-started)
- [TS-jest](https://kulshekhar.github.io/ts-jest/)

## Building
Mobx-spine-ts can be build using `yarn build`. This creates a 'dist' directory, with the compiled javascript files, and the typedefinition file.

Under the hood `yarn build` simply calls `tsx -b`.

## Testing
Test can be run by using `yarn test`. 

Under the hood `yarn test` calls `jest`. For additional help, you can run `yarn test --help`.

# BinderApi

## Settings

### Overwriting base url
The BinderApi has a baseUrl variable, which can be overwritten, and is prepended to all request:

```javascript
    const api = new BinderApi();
    api.baseUrl = '/api/foo/';
```

If you now do

```javascript
api.get('bar/')
```
it actually queries `/api/foo/bar/`


## Requests

### Request headers
Headers can be set in the request options under `headers`. E.g. the following sets a custome content-type header:

```javascript
api.get('/api/asdf/', null, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
```

#### Default headers
Default headers can be set on the BinderApi object by adding them to the `BinderApi.defaultHeaders` dictionary. E.g.

```javascript
api = new BinderApi();
api.defaultHeaders['X-Foo'] = 'bar';
```

### GET request
You can do get request using: 

```get(url: string, data?: RequestData, options ?: RequestOptions):  Promise<object>```

## RequestOptions
The following request options can be set

| ** Option ** | ** Response |
| skipFormatter | Boolean, when set to true, the get(), post() etc. return the raw AxiosResponse. Otherwise, parses the response, and only return the data returned from the server |
| requestParams | Dictionary containing the query params attached to the request. Note that if you do a get request, with data, the data is taken rather than the requestParams |



## To test:
- 'skipFormatter' request option