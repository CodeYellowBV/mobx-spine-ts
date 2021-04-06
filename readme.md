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


### Add custom handling of request errors
Custom error handling can be added by overwriting the `onRequestError` method:

```javascript
const api = new BinderApi();
api.onRequestError = reason => handleReason(reason);
```

Bypassing the custom error handler can in turn be done by setting `skipRequestError` in the request option




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

### POST request
You can do post request using: 

```post(url: string, data?: RequestData, options ?: RequestOptions):  Promise<object>```


### PUT request
You can do put request using: 

```put(url: string, data?: RequestData, options ?: RequestOptions):  Promise<object>```

### PATCH request
You can do put request using: 

```patch(url: string, data?: RequestData, options ?: RequestOptions):  Promise<object>```

### DELETE request
You can do delete request using: 

```delete(url: string, data?: RequestData, options ?: RequestOptions):  Promise<object>```


## RequestOptions
The following request options can be set

| ** Option ** | ** Response |
| skipFormatter | Boolean, when set to true, the get(), post() etc. return the raw AxiosResponse. Otherwise, parses the response, and only return the data returned from the server |
| requestParams | Dictionary containing the query params attached to the request. Note that if you do a get request, with data, the data is taken rather than the requestParams |
| skipRequestError | When set to true, does not the set error request error handler. INstead propagate the error |

# @tsPatch hack for models
Classes extending the mobx-spine model need to be patched with @tsPatch as well. This is needed for compatability reasons between the old mobx-spine babel compiler, and the new compiler.

The problem is with this pseudoCode

```javascript
class Model {
    constructor(data) {
        // Sets the data of the model
        this.parse(data);
    }
}

class Animal {
    @observable id = 1;
}

const animal = new Animal({id: 2})
    
console.log(animal.id)
```

In the babel setup, the Animal class gets compiled to
```javascript
class Animal {
    constructor(data) {
        this.id = 1;
        super(data);
    }
}
```
This will results in the `animal.id` being 2, as is expected. In typescript however, this same code gets compiled to:

```javascript
class Animal {
    constructor(data) {
        super(data);
        this.id = 1;
    }
}
```
This will result in the `animal.id` being 1. This is not consistent. As this workflow is an integral part of how `mobx-spine` works, the only option was to patch this behaviour. Therefore a @tsPatch annotation was added, which calls an `afterConstructor` after calling the constructor. This means that previous piece of code now needs to be written as:


```javascript
class Model {
    constructor(data) {

    }
    
    afterConstructor(data) {
        // Sets the data of the model
        this.parse(data);
    }
}

@tsPatch
class Animal {
    @observable id = 1;
}

const animal = new Animal({id: 2})
    
console.log(animal.id)
```

The animal class now is compiled as:

```javascript

class Animal {
    constructor(data) {
        super(data);
        this.id = 1;
        
        // This sets this.id = s
        this.afterConstrcutor(data);
    }
}

```

# Differences between mobx-spine and mobx-spine-ts
- Models need to be annotated @tsPatch
- Model will generated a warning when you are trying to give it a key that doesn't exist, e.g.`new Animal({thisDoesNotExist: 1})`
- Base model has a relations method, returning no relations which can be overridden.
- On the model, in the private method `__scopeBackendResponse` mapping has been renamed to `relMapping` to be consistent with the `fromBackend` method.