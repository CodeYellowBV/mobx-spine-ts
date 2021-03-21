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