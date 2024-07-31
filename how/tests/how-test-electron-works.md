# How `test-electron` works

`test-electron` runs tests inside an `electron` instance.

These tests have access to both node js _and_ browser APIs because the tests have been required in a preload script and exposed with `contextBridge.exposeInMainWorld`.

This means you can write tests that use node modules like `pngjs` to load an inspect png files:

```ts
import { readFileSync, statSync } from "fs";
import { basename } from "path";
import { assert } from "chai";
import type { PNGWithMetadata } from "pngjs";
import { PNG } from "pngjs";
import JPEG from "jpeg-js";
import { handleImageAttachment } from "../../util/handleImageAttachment";

const process = async (
  sampleFile: string
): Promise<[PNGWithMetadata, PNGWithMetadata]> => {
  const result = await handleImageAttachment(
    new File([readFileSync(sampleFile)], basename(sampleFile), {
      type: "image/png",
    })
  );

  // @ts-expect-error "data is undefined"
  const buffer = Buffer.from(result.data);

  const before = png(readFileSync(sampleFile));
  const after = png(buffer);

  return [before, after];
};

const png = (file: string | Buffer) =>
  PNG.sync.read(Buffer.isBuffer(file) ? file : readFileSync(file));

const jpeg = (file: Buffer) => JPEG.decode(file);

const fileSize = (file: string) => statSync(file).size;

// npm run test-electron -- --grep="image processing"
describe("image processing with `handleImageAttachment`", () => {
  it("returns a png file when input file is small (489B)", async () => {
    const smallPngFile = "./fixtures/20x200-yellow.png";

    assert.equal(fileSize(smallPngFile), 489);

    const [before, after] = await process(smallPngFile);

    assert.equal(after.width, before.width);
    assert.equal(after.height, before.height);
    assert.equal(after.alpha, before.alpha);

    assert.equal(after.data.length, before.data.length);
  });
});
```

Note the use of node APIs and node modules like `pngjs`.

These tests are not for the UI per se, they are for things that require an `electron` renderer context.

The test above is exercising `handleImageAttachment` which requires a real DOM.

## Starting

`test-electron` spawns an electron process that differs in two ways:

1. An extra preload step (`ts/windows/main/preload_test.ts`) that loads test files and exposes them as `window.testUtilities`
1. The main window is initialised with `test/index.html` instead of `background.html`

`test/index.html` loads and runs the tests with `test/test.js`.

`test/test.js` uses `window.testUtilities` to load the tests.

`window.testUtilities` is initialised by that extra preload step.

### In detail

```shell
npm run test-electron
```

- `node ts/scripts/test-electron.js`,
- `electron .`
- `app/main.ts`
- `ts/windows/main/preload.ts`
- `ts/scripts/test-electron.ts`
- `test/index.html`
- `test/test.js`

`test-electron.js` starts an `electron` process with `spawn` (See `ts/scripts/test-electron.ts`).

> During execution, Electron will look for this script in the main field of the app's package.json config,
> which you should have configured during the app scaffolding step. -- [doc](https://www.electronjs.org/docs/latest/tutorial/quick-start#run-the-main-process)

### Creating the window

`test/index.html` is loaded rather than `background.html` due to the environment being `Environment.Test`.

```ts
// app/main.ts
app.on("ready", async () => {
  // ...

  // Run window preloading in parallel with database initialization.
  await createWindow();

  // ...
});

async function createWindow() {
  const usePreloadBundle =
    !isTestEnvironment(getEnvironment()) || forcePreloadBundle;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: maxWidth, height: maxHeight } = primaryDisplay.workAreaSize;
  const width = windowConfig
    ? Math.min(windowConfig.width, maxWidth)
    : DEFAULT_WIDTH;
  const height = windowConfig
    ? Math.min(windowConfig.height, maxHeight)
    : DEFAULT_HEIGHT;

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    show: false,
    width,
    height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    autoHideMenuBar: false,
    titleBarStyle: mainTitleBarStyle,
    backgroundColor: isTestEnvironment(getEnvironment())
      ? "#ffffff" // Tests should always be rendered on a white background
      : await getBackgroundColor(),
    webPreferences: {
      ...defaultWebPrefs,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      sandbox: false,
      contextIsolation: !isTestEnvironment(getEnvironment()),
      preload: join(
        __dirname,
        usePreloadBundle
          ? "../preload.bundle.js"
          : "../ts/windows/main/preload.js"
      ),
      spellcheck: await getSpellCheckSetting(),
      backgroundThrottling: true,
      disableBlinkFeatures: "Accelerated2dCanvas,AcceleratedSmallCanvases",
    },
    icon: windowIcon,
    ...pick(windowConfig, ["autoHideMenuBar", "x", "y"]),
  };

  // ...

  // Create the browser window.
  mainWindow = new BrowserWindow(windowOptions);
  if (settingsChannel) {
    settingsChannel.setMainWindow(mainWindow);
  }

  //...

  await safeLoadURL(
    mainWindow,
    getEnvironment() === Environment.Test
      ? await prepareFileUrl([__dirname, "../test/index.html"])
      : await prepareFileUrl([__dirname, "../background.html"])
  );
}
```

Note that `sandbox: false` and `contextIsolation` is off because `isTestEnvironment` is true.

> Therefore, when the sandbox is enabled, renderer processes can only perform privileged tasks (such as interacting with the filesystem, making changes to the system, or spawning subprocesses) by delegating these tasks to the main process via inter-process communication (IPC). [doc](https://www.electronjs.org/docs/latest/tutorial/sandbox#sandbox-behavior-in-electron)

> [Context isolation] This means that the window object that your preload script has access to is actually a different object than the website would have access to. For example, if you set window.hello = 'wave' in your preload script and context isolation is enabled, window.hello will be undefined if the website tries to access it. [doc](https://www.electronjs.org/docs/latest/tutorial/context-isolation)

#### Preload script: `ts/windows/main/preload_test.ts`

> Preload scripts contain code that executes in a renderer process before its web content begins loading. These scripts run within the renderer context, but are granted more privileges by having access to Node.js APIs. [doc](https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts)

`ts/windows/main/preload.ts` just loads `ts/windows/main/start.ts`.

There is different behaviour here depending on environment.

```ts
// ts/windows/main/start.ts
import "./phase1-ipc";
import "../preload";
import "./phase2-dependencies";
import "./phase3-post-signal";
import "./phase4-test";
```

This is where `ts/windows/main/preload_test.ts` is conditionally required:

```ts
// ts/windows/main/phase4-test.ts
if (config.environment === "test") {
  console.log("Importing test infrastructure...");
  require("./preload_test");
}
```

`ts/windows/main/preload_test.ts` is not where the tests are loaded, just where `prepareTests` is defined.

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

#### Loading HTML

```ts
// app/main.ts
await safeLoadURL(
  mainWindow,
  getEnvironment() === Environment.Test
    ? await prepareFileUrl([__dirname, "../test/index.html"])
    : await prepareFileUrl([__dirname, "../background.html"])
);
```

## How the tests are run

An `electron` window is started which loads `test/test.js` using `safeLoadURL`:

```js
// test/test.js
// Copyright 2014 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

/*
 * global helpers for tests
 */

mocha.setup("bdd");
mocha.setup({ timeout: 10000 });

function deleteIndexedDB() {
  return new Promise((resolve, reject) => {
    const idbReq = indexedDB.deleteDatabase("test");
    idbReq.onsuccess = resolve;
    idbReq.error = reject;
  });
}

window.Events = {
  getThemeSetting: () => "light",
};

/* Delete the database before running any tests */
before(async () => {
  await window.testUtilities.initialize();
  await deleteIndexedDB();
  await window.Signal.Data.removeAll();
  await window.storage.fetch();
});

window.testUtilities.prepareTests();
delete window.testUtilities.prepareTests;
window.textsecure.storage.protocol = window.getSignalProtocolStore();

!(function () {
  class Reporter extends Mocha.reporters.HTML {
    constructor(runner, options) {
      super(runner, options);

      runner.on("pass", (test) =>
        window.testUtilities.onTestEvent({
          type: "pass",
          title: test.titlePath(),
        })
      );
      runner.on("fail", (test, error) =>
        window.testUtilities.onTestEvent({
          type: "fail",
          title: test.titlePath(),
          error: error?.stack || String(error),
        })
      );

      runner.on("end", () => window.testUtilities.onTestEvent({ type: "end" }));
    }
  }

  mocha.reporter(Reporter);

  mocha.setup(window.testUtilities.setup);

  mocha.run();
})();

window.getPreferredSystemLocales = () => ["en"];
window.getLocaleOverride = () => null;
```

Notice it calls `window.testUtilities.prepareTests();`.

It's only here that the test files are required.

### Why the tests can access node js APIs

This is all due to special handling in `contextBridge.exposeInMainWorld`.

> Function values that you bind through the contextBridge are proxied through Electron to ensure that contexts remain isolated. [doc](https://www.electronjs.org/docs/latest/api/context-bridge#api-functions)

> Function values are proxied to the other context and all other values are copied and frozen. Any data / primitives sent in the API become immutable and updates on either side of the bridge do not result in an update on the other side. [doc](https://www.electronjs.org/docs/latest/api/context-bridge#api)

So it is important that `prepareTests` is defined in a preload script -- it is only preload scripts that are run with node js available.

`test/test.js` can only call `window.testUtilities.prepareTests` because it was defined in a preload script and exposed with `contextBridge.exposeInMainWorld`.

```ts
// ts/windows/main/start.ts
if (getEnvironment() === Environment.Test) {
  // ...
  contextBridge.exposeInMainWorld("testUtilities", window.testUtilities);
}
```

`contextBridge.exposeInMainWorld` makes the function able to be called from `test/test.js`.

### What `mocha.setup` does

`window.testUtilities` is defined in `ts/windows/main/preload_test.ts`.

It's here that command line options are translated to `setup`:

```ts
// ts/windows/main/preload_test.ts
{
  const { values } = parseArgs({
    args: ipc.sendSync("ci:test-electron:getArgv"),
    options: {
      grep: {
        type: "string",
      },
    },
    strict: false,
  });

  if (typeof values.grep === "string") {
    setup.grep = values.grep;
  }
}
```

Assigning `setup.grep` is equivalent to setting [mocha's `grep` option](https://mochajs.org/#-grep-regexp-g-regexp).

This means the only supported test filter option is `grep`, so no `invert` or `fgrep`.

```
(https://mochajs.org/)

Test Filters
  -f, --fgrep   Only run tests containing this string                   [string]
  -g, --grep    Only run tests matching this string or regexp           [string]
  -i, --invert  Inverts --grep and --fgrep matches                     [boolean]
```

### Running a single directory or file

This is currently not possible because the tests are selected like this:

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

A change would need to be made to feed in additional options.

### Why runing does not show window

This is because the application is minimized to tray.

You can mimic this by supplying the `--start-in-tray` flag.

`(1)` When running `test-electron`, `NODE_ENV` is `test` (see `ts/scripts/test-electron.ts`) and so:

```ts
// app/main.ts
const startInTray =
  isTestEnvironment(getEnvironment()) || // <--------------------------------------- (1)
  (await systemTraySettingCache.get()) ===
    SystemTraySetting.MinimizeToAndStartInSystemTray;
```
