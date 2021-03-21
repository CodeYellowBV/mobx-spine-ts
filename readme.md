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

## RequestOptions
The following request options can be set

| ** Option ** | ** Response |
| skipFormatter | Boolean, when set to true, the get(), post() etc. return the raw AxiosResponse. Otherwise, parses the response, and only return the data returned from the server |
| requestParams | Dictionary containing the query params attached to the request. Note that if you do a get request, with data, the data is taken rather than the requestParams |



## To test:
- 'skipFormatter' request option