# Tests

- `test-mock`
- `test-electron`
- `test-node`

## `test-mock`

## `test-electron`

Runs tests in `ts/test-electron`. Tests are run inside an `electron` instance hosting the file `test/index.html`.

Tests have access to node js modules and browser APIs.

````shell
npm run test-electron
```

## Running a single test

```shell
npm run test-electron -- --grep=Crypto
````
