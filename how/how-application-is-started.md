# How application is started

`Signal-Desktop` is an Electron application which is started in development mode by:

```shell
yarn start
```

Which just invokes electron:

```shell
electron .
```

1. [node] `electron .` executes `app/main.ts`
1. [node] `app/main.ts` -> `import { app } from 'electron';`
1. [node] `app/main.ts` -> `app.on('ready')`
1. [node] `app/main.ts` `app.on('ready')` -> `createWindow`
1. [node] `app/main.ts` `createWindow` configures preload script `ts/windows/main/preload.ts`
1. [browser] `app/main.ts` -> `createWindow` -> `mainWindow = new BrowserWindow(windowOptions);`
1. [browser] `app/main.ts` -> `createWindow` -> `mainWindow.loadURL('background.html')`
1. [node] [preload] `ts/windows/main/preload.ts` calls `ts/windows/main/start.ts`
1. [node] [preload] `ts/windows/main/start.ts` assigns and exposes window-scoped variables like `window.Signal`
1. [browser] `background.html` -> `window.startApp();`
1. [browser] `ts/background.ts` -> `startApp`

The application can be thought of in two parts: the `electron` part and the browser part.

Dependencies are configured mostly as part of preload (`ts/windows/main/start.ts`), but `ts/background.ts` also assigns some window variables:

```shell
grep -Eir "window\..+ = " ../Signal-Desktop/ts/background.ts

window.textsecure.storage.protocol = new window.SignalProtocolStore();
window.Signal.Services.lightSessionResetQueue = lightSessionResetQueue;
window.Whisper.deliveryReceiptQueue = new PQueue({
window.Whisper.deliveryReceiptBatcher = createBatcher<Receipt>({
window.setImmediate = window.nodeSetImmediate;
window.document.title = window.getTitle();
window.getSocketStatus = () => {
window.getAccountManager = () => {
window.textsecure.server = server;
window.textsecure.messaging = new window.textsecure.MessageSender(server);
window.Signal.challengeHandler = challengeHandler;
window.Events = createIPCEvents({
window.Signal.Services.retryPlaceholders = retryPlaceholders;
window.Whisper.events.on('userChanged', (reconnect = false) => {
window.getSyncRequest = (timeoutMillis?: number) => {
window.waitForEmptyEventQueue = waitForEmptyEventQueue;
window.startApp = startApp;
```

## Preload: `ts/windows/main/start.ts`

Preload is registered with `electron` in `createWindow` (`app/main.ts`) and [runs in a context that has access to both the HTML DOM and a limited subset of Node.js and Electron APIs](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload).

```ts
// app/main.ts
preload: join(
        __dirname,
        usePreloadBundle
          ? '../preload.bundle.js'
          : '../ts/windows/main/preload.js'
      ),
```

`ts/windows/main/preload.ts` just loads `ts/windows/main/start.ts`.

1. `ts/windows/main/preload.ts`
1. `ts/windows/main/start.ts`
1. `ts/windows/main/phase2-dependencies.ts` which assigns `window.Signal` (among many other window-scoped variables).

```ts
// ts/windows/main/phase2-dependencies.ts
window.Signal = setup({
  Attachments,
  getRegionCode: () => window.storage.get("regionCode"),
  logger: log,
  userDataPath,
});
```

### `app/main.ts`

<img src="../assets/architecture/electron-app-architecture.png" />

## Browser startup: `window.startApp` (`ts/background.ts`)

See `ts/background.ts`. This is where the initialization for the browse part happens.

### Assign window variables

(Some variables like `window.Signal` and `window.textsecure` have already been assigned by preload.)

```shell
grep -Eir "window\..+ = " ../Signal-Desktop/ts/background.ts

window.textsecure.storage.protocol = new window.SignalProtocolStore();
window.Signal.Services.lightSessionResetQueue = lightSessionResetQueue;
window.Whisper.deliveryReceiptQueue = new PQueue({
window.Whisper.deliveryReceiptBatcher = createBatcher<Receipt>({
window.setImmediate = window.nodeSetImmediate;
window.document.title = window.getTitle();
window.getSocketStatus = () => {
window.getAccountManager = () => {
window.textsecure.server = server;
window.textsecure.messaging = new window.textsecure.MessageSender(server);
window.Signal.challengeHandler = challengeHandler;
window.Events = createIPCEvents({
window.Signal.Services.retryPlaceholders = retryPlaceholders;
window.Whisper.events.on('userChanged', (reconnect = false) => {
window.getSyncRequest = (timeoutMillis?: number) => {
window.waitForEmptyEventQueue = waitForEmptyEventQueue;
window.startApp = startApp;

```

### Mount React view

The `React` part is started in `ts/background.ts`:

```ts
// Around line 1455
render(
  window.Signal.State.Roots.createApp(window.reduxStore), // `createApp` => `ts/state/roots/createApp.tsx`
  document.getElementById("app-container")
);
```

### window.storage

Looks like:

```ts
export type IStorage = StorageInterface & {
  user: User;
  protocol: SignalProtocolStore;
  init: () => Promise<void>;
  fetch: () => Promise<void>;
  reset: () => void;
  getItemsState: () => Partial<StorageAccessType>;
};
```

`window.textsecure.storage` is by default set to an instance of `Storage` (`ts/textsecure/Storage.ts`) and is implemented in terms of

- `Data` (sql)
- `window.Signal.Data`
- `window.reduxActions`

### window.storage.onready

This is where a server connection is opened and monitored for changes like new messages or contacts.

It also assigns `window.Events` which is how messages are sent to the back end of the `electron` application.

#### MessageReceiver: Event handlers

`ts/background.ts` maintains a local instance of `MessageReceiver` which represents a socket connection to `Signal` servers.

`ts/background.ts` listens for events and performs actions in response, for example `contactSync`.

```ts
// ts/background.ts
messageReceiver.addEventListener(
  "contactSync",
  queuedEventListener(onContactSync)
);
```

There are about 30 of these events.

## Where is `window.reduxStore` assigned?

1. `setupAppState` (`ts/background.ts`) -> `startApp` -> `window.storage.onready` -> `setupAppState` -> `initializeRedux`
1. `initializeRedux` (`ts/state/initializeRedux.ts`)

## ConversationController

`ConversationController` is quite an important class. It is initialised with `start` (`ts/ConversationController.ts`):

```ts
// ts/ConversationController.ts

// We have to run this in background.js, after all backbone models and collections on
//   Whisper.* have been created. Once those are in typescript we can use more reasonable
//   require statements for referencing these things, giving us more flexibility here.
export function start(): void {
  const conversations = new window.Whisper.ConversationCollection();

  window.ConversationController = new ConversationController(conversations);
  window.getConversations = () => conversations;
}
```

As the comment reads, `start` at a point after `window.Whisper.ConversationCollection` has been assigned.

`start` is called from `ts/windows/main/start.ts` which is part of the preload sequence.

```ts
import { start as startConversationController } from "../../ConversationController";

// ...

startConversationController();

//..
```

Initialised in `ts/windows/main/start.ts` by calling `start` in `ts/ConversationController.ts`.

### SignalCoreType.conversationControllerStart not used (except for tests?)

Note that `SignalCoreType.conversationControllerStart` is not called anywhere. There is this comment:

```ts
// ts/signal.ts
// Note: used in test/index.html, and not type-checked!
conversationControllerStart: _conversationControllerStart,
```

## `window.reduxStore.getState().app.hasInitialLoadCompleted`

`hasInitialLoadCompleted` is set by `ts/background.ts` using `window.reduxActions.app.initialLoadComplete();`.

This is called from `onEmpty` which is **only** referenced in these places:

- in response to the `empty` `messageReceiver` event
- in `onOffline`
- in `unlinkAndDisconnect`

So what happens in practice must be that the server raises the `empty` event at some point.
