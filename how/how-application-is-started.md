# How application is started

`Signal-Desktop` is an Electron application which is started in development mode by:

```shell
yarn start
```

Which just invokes electron:

```shell
electron .
```

- [node] `electron .` executes `app/main.ts`
- [node] `app/main.ts` -> `import { app } from 'electron';`
- [node] `app/main.ts` -> `app.on('ready')`
- [node] `app/main.ts` `app.on('ready')` -> `createWindow`
- [node] `app/main.ts` `createWindow` configures preload script `ts/windows/main/preload.ts`
- [node] [preload] `ts/windows/main/preload.ts` calls `ts/windows/main/start.ts`
- [node] [preload] `ts/windows/main/start.ts` assigns and exposes window-scoped variables like `window.Signal`
- [browser] `app/main.ts` -> `createWindow` -> `mainWindow = new BrowserWindow(windowOptions);`
- [browser] `app/main.ts` -> `createWindow` -> `mainWindow .loadURL('background.html')`
- [browser] `background.html` -> `window.startApp();`
- [browser] `ts/background.ts` -> `startApp`

The application can be thought of in two parts: the `electron` part and the browser part.

## Preload

`ts/windows/main/preload.ts` imports `ts/windows/main/start.ts`
`ts/windows/main/start.ts` imports `ts/windows/main/phase2-dependencies.ts` which assigns `window.Signal` (among many other window-scoped variables).

```ts
window.Signal = setup({
  Attachments,
  getRegionCode: () => window.storage.get("regionCode"),
  logger: log,
  userDataPath,
});
```

## `app/main.ts`

<img src="../assets/architecture/electron-app-architecture.png" />

## `window.startApp`

See `ts/background.ts`. This is the part that runs in the browser.

`window.startApp` depends on:

- `window`
- `document`
- `app` (`Electron`)
- `ipc` (`Electron`)

It also:

- Assigns `window.getAccountManager` (may be useful later)
- Calls `initializeRedux`
- Calls `window.getConversations`

## Where is the React part started?

The `React` part is started in `ts/background.ts`:

```ts
// Around line 1455
render(
  window.Signal.State.Roots.createApp(window.reduxStore),
  document.getElementById("app-container")
);
```

Where `createApp` from from `ts/state/roots/createApp.tsx`.

## Where is `window.reduxStore` assigned?

1. `setupAppState` (`ts/background.ts`) -> `startApp` -> `window.storage.onready` -> `setupAppState` -> `initializeRedux`
1. `initializeRedux` (`ts/state/initializeRedux.ts`)

## ConversationController

Initialised in `ts/windows/main/start.ts` by calling `start` in `ts/ConversationController.ts`.

### SignalCoreType.conversationControllerStart not used (except for tests?)

Note that `SignalCoreType.conversationControllerStart` is not called anywhere. There is this comment:

```ts
// ts/signal.ts
// Note: used in test/index.html, and not type-checked!
conversationControllerStart: _conversationControllerStart,
```

The real initialization is in `ts/windows/main/start.ts`.
