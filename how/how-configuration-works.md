# How configuration works

Signal Desktop uses [node-config](https://github.com/node-config) to read values from json files at `./config`

```shell
tree config
.config/
├── default.json
├── development.json
├── local-production.json
├── production.json
├── staging.json
├── test.json
└── test-lib.json
```

The configuration values you get depend directly on the value of the `NODE_ENV` environment variable, which is why `process.env.NODE_ENV` is assigned first.

The current environment is stored statically by `ts/environment.ts`. It provides access to the current value with `getEnvironment`.

Configuration is calculated once and exported as a constant, meaning it's read-nonly from then on.

So configuration loading has these steps:

1. Call `setEnvironment` with a value like `"production"` or `"development"`
1. Assign `process.env.NODE_ENV` to the same value so that `node-config` can use it read config files
1. Use `node-config` to assign `config`
1. Export `config`

```ts
// app/config.ts

// ...

if (app.isPackaged) {
  setEnvironment(Environment.Production, false);
} else {
  setEnvironment(
    parseEnvironment(process.env.NODE_ENV || "development"),
    Boolean(process.env.MOCK_TEST)
  );
}

//...

// Set environment vars to configure node-config before requiring it
process.env.NODE_ENV = getEnvironment();

//...

// We load config after we've made our modifications to NODE_ENV
// Note: we use `require()` because esbuild moves the imports to the top of
// the module regardless of their actual placement in the file.
// See: https://github.com/evanw/esbuild/issues/2011
// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: IConfig = require("config");

// ...

export default config;

// ...
```

Because the `config` constant is exported, anywhere that uses `import config from './config'` is using the calculated value.

## Determining environment

The configuration you get depends on the current runtime environment

```ts
// app/config.ts
process.env.NODE_ENV = getEnvironment();
```

`getEnvironment` requires `setEnvironment` to be called.

`setEnvironment` is called by `app/config.ts` and reads from the `process.env.NODE_ENV` environment variable.

That means you can, in pre-production, set the environment by starting with:

```shell
NODE_ENV=staging npm run start
```

### Quirk: `NODE_ENV=test npm run start` runs tests

```shell
NODE_ENV=test npm run start
```

is equivalent to:

```shell
npm run test-electron
```

And that is due to this:

```ts
// app/main.ts
await safeLoadURL(
  mainWindow,
  getEnvironment() === Environment.Test
    ? await prepareFileUrl([__dirname, "../test/index.html"])
    : await prepareFileUrl([__dirname, "../background.html"])
);
```

The file loaded into the electron window depends directly on `getEnvironment`, and so it runs the tests instead.

## Overriding configuration with `NODE_CONFIG` environment variable

Signal Desktop uses [node-config](https://github.com/node-config) which [allows overriding settings at runtime](https://github.com/node-config/node-config/wiki/Command-Line-Overrides).

Override configuration with the `NODE_CONFIG` environment variable.

For example, to show the developer console, overrride the `openDevTools` setting:

```shell
$ NODE_CONFIG='{"openDevTools": true, "ciMode": false}' /usr/bin/signal-desktop
```

See the full config options at `config/default.json`.

### Does not work in production

Overriding does not work in production, though, due to:

```ts
// app/config.ts
if (getEnvironment() === Environment.Production) {
  // harden production config against the local env
  process.env.NODE_CONFIG = "";
  process.env.NODE_CONFIG_STRICT_MODE = "";
  process.env.HOSTNAME = "";
  process.env.NODE_APP_INSTANCE = "";
  process.env.ALLOW_CONFIG_MUTATIONS = "";
  process.env.SUPPRESS_NO_CONFIG_WARNING = "";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "";
  process.env.SIGNAL_ENABLE_HTTP = "";
  process.env.SIGNAL_CI_CONFIG = "";
}
```
