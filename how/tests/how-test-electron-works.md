# How `test-electron` works

`test-electron` runs tests inside an `electron` instance.

These tests are not for the UI per se, they are for things that require `electron` context.

Instead of starting the application with `background.html` it uses `test/index.html`, which loads the tests.

The `electron` instance is headless.

```shell
npm run test-electron
```

- `ts/scripts/test-electron.ts`
- `test/index.html`
- `test/test.js`

```ts
// app/main.ts
await safeLoadURL(
  mainWindow,
  getEnvironment() === Environment.Test
    ? await prepareFileUrl([__dirname, "../test/index.html"])
    : await prepareFileUrl([__dirname, "../background.html"])
);
```

Selection of the tests to be run:

```ts
// ts/windows/main/preload_test.ts
prepareTests() {
  console.log('Preparing tests...');
  sync('../../test-{both,electron}/**/*_test.js', {
    absolute: true,
    cwd: __dirname,
  }).forEach(require);
},
```

## Running a single test

```shell
npm run test-electron -- --grep=Crypto
```
