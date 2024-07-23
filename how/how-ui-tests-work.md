# How UI tests work

```shell
npm run test-mock
```

Running the above command causes a `Signal-Desktop` window to open.

The application is configured with `ts/test-mock/bootstrap.ts`.

The application is then running against a mock server.

The tests are in `ts/test-mock`.

## How `electron` is started

Running `npm start` is equivalent to

```shell
electron app/main.js
```

Running `test-mock` starts with a different file:

```shell
electron ci.js
```

`ci.js` is very small.

```ts
const CI_CONFIG = JSON.parse(process.env.SIGNAL_CI_CONFIG || "");

const config = require("./app/config").default;

config.util.extendDeep(config, CI_CONFIG);

require("./app/main");
```

All it is doing is generating configuration and invoking `./app/main`, which is exactly the same as what happens when you run `npm start`.

### In detail

Running `test-mock` does this:

```shell
mocha --require ts/test-mock/setup-ci.js ts/test-mock/**/*_test.js",
```

Where `ts/test-mock/setup-ci.js` is run before the test run and does this:

```ts
import { Bootstrap } from "./bootstrap";
```

#### Bootstrap.ts (`ts/test-mock/bootstrap.ts`)

##### CI_SCRIPT (ci.js)

`Bootstrap` uses this script to start the electron process

#### App (`ts/test-mock/playwright.ts`)

It is `App` that creates the `electron` window using `electron.launch`.

## How to run a single test

```shell
mocha --require ts/test-mock/setup-ci.js {path}
```

For example:

```shell
mocha --require ts/test-mock/setup-ci.js ts/test-mock/messaging/edit_test.js
```

## How to see console logs

For some reason these are not appearing in the developer tools, but they are being written the the debug log.

Select `View` > `Debug Log`, then you'll need to save it to disk to read it all.

@todo: Find out how the above log gets populated. That text label comes from `icu:debugLog`.
