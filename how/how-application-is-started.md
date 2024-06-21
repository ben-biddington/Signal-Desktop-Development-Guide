# How application is started

`Signal-Desktop` is an Electron application which is started in deveopment mode by:

```shell
yarn start
```

Which just invokes electron:

```shell
electron .
```

- `electron .` executes `app/main.ts`
- `app/main.ts` -> `import { app } from 'electron';`
- `app/main.ts` -> `app.on('ready')`
- `app/main.ts` `app.on('ready')` -> `createWindow`
- `app/main.ts` `createWindow`
- `app/main.ts` -> `createWindow` -> `mainWindow = new BrowserWindow(windowOptions);`
- `app/main.ts` -> `createWindow` -> `mainWindow .loadURL('background.html')`
- `background.html` -> `window.startApp();`
- `ts/background.ts` -> `startApp`

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
- Cals `window.getConversations`

## Where is the React part started?

I think this happens in `ts/background.ts`:

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

## Getting past the QR code view

The QR code is shown as part of `SmartInstallScreen`.

```ts
// ts/components/App.tsx
if (appView === AppViewType.Installer) {
  contents = <SmartInstallScreen />;
} else if (appView === AppViewType.Standalone) {
  const onComplete = () => {
    window.IPC.removeSetupMenuItems();
    openInbox();
  };
  contents = (
    <StandaloneRegistration
      onComplete={onComplete}
      requestVerification={requestVerification}
      registerSingleDevice={registerSingleDevice}
    />
  );
} else if (appView === AppViewType.Inbox) {
  contents = renderInbox();
}
```

Where `appView`:

```ts
export enum AppViewType {
  Blank = "Blank",
  Inbox = "Inbox",
  Installer = "Installer",
  Standalone = "Standalone",
}
```

`SmartInstallScreen` is shown when `appView === AppViewType.Installer`.

This is assigned by `window.reduxActions.app.openInstaller` in 2 places:

```ts
// ts/background.ts
window.Whisper.events.on("setupAsNewDevice", () => {
  window.IPC.readyForUpdates();
  window.reduxActions.app.openInstaller();
});

// ...

if (isCoreDataValid && Registration.everDone()) {
  drop(connect());
  window.reduxActions.app.openInbox();
} else {
  window.IPC.readyForUpdates();
  window.reduxActions.app.openInstaller();
}

const isCoreDataValid = Boolean(
  window.textsecure.storage.user.getAci() &&
    window.ConversationController.getOurConversation()
);
```

```ts
// ts/util/registration.ts
export function everDone(): boolean {
  return window.storage.get("chromiumRegistrationDoneEver") === "" || isDone();
}
```
