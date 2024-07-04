# 8. Bypass the unlinked message

Date: 2024-07-04

## Status

Accepted

## Context

![alt text](assets/0008-bypass-the-unlinked-message.md-image.png)

> Click to relink Signal Desktop to your mobile device to continue messaging.

```json
"icu:unlinkedWarning": {
    "messageformat": "Click to relink Signal Desktop to your mobile device to continue messaging."
  },
```

This is shown by `DialogRelink` when this is true:

```ts
// ts/state/smart/LeftPane.tsx
const hasRelinkDialog = !isRegistrationDone();
```

which amounts to:

```ts
// ts/util/registration.ts
export function isDone(): boolean {
  return window.storage.get("chromiumRegistrationDone") === "";
}
```

## Decision

### Set registration as done

To do this we can use `markDone` from `ts/util/registration.ts`.

We are doing this in `DevNullStorage.init` because it is an async process.

`DevNullStorage.init` is called from early in the process:

```ts
// ts/background.ts
export async function startApp(): Promise<void> {
  window.textsecure.storage.protocol = new window.SignalProtocolStore();
  await window.Signal.init();
  await window.textsecure.storage.init(); // <--------------------------------------- here
  // ...
}
```

## Problems

### We are being unlinked for some reason

1. `unlinkAndDisconnect` (`ts/background.ts`)
1. `void Registration.remove();`

There are a few reasons `unlinkAndDisconnect` is called.

```shell
at unlinkAndDisconnect (/home/ben/sauce/Signal-Desktop/preload.bundle.js:319321:33)
    at Object.<anonymous> (/home/ben/sauce/Signal-Desktop/preload.bundle.js:318049:10)
    at triggerEvents (/home/ben/sauce/Signal-Desktop/preload.bundle.js:320071:42)
    at Object.trigger (/home/ben/sauce/Signal-Desktop/preload.bundle.js:320029:5)
    at SocketManager.<anonymous> (/home/ben/sauce/Signal-Desktop/preload.bundle.js:138339:29)
    at SocketManager.emit (node:events:518:28)
    at SocketManager.emit (/home/ben/sauce/Signal-Desktop/preload.bundle.js:67908:22)
    at SocketManager.authenticate (/home/ben/sauce/Signal-Desktop/preload.bundle.js:67422:20)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
```

`SocketManager.authenticate` comes from `ts/textsecure/SocketManager.ts`.

We don't really want any socket connections at all if we can help it.

This is happening because we're initializing `ts/textsecure/WebAPI.ts`, which always tries to authenticate.

This is always going to be a problem unless we use a fake `WebAPI`.

```ts
// ts/background.ts
server = window.WebAPI.connect({
  ...window.textsecure.storage.user.getWebAPICredentials(),
  hasStoriesDisabled: window.storage.get("hasStoriesDisabled", false),
});
```

Do this instead:

```ts
// ts/background.ts
server = new DevNullWebAPIType();
```

The trouble with that is now we're stuck on the loading screen. There is clearly some behaviour we are missing.

Looks like `app/INITIAL_LOAD_COMPLETE` is not dispatched.

The only place that is dispatched is at:

```ts
// ts/background.ts
window.reduxActions.app.initialLoadComplete();
```

And the only practical path is:

- `messageReceiver.addEventListener('empty', queuedEventListener(onEmpty))`
- `onEmpty`
- `window.reduxActions.app.initialLoadComplete`

So we have to `EmptyEvent` notification in `EventTargetMessageReceiver` ctor.

## Consequences

What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.
