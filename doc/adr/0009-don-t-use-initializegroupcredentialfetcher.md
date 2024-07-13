# 9. Don't use initializeGroupCredentialFetcher

Date: 2024-07-13

## Status

Accepted

## Context

We are seeing these errors for something we don't actually need when running in isolation mode:

```shell
runWithRetry: maybeFetchNewCredentials failed. Waiting 300000ms for retry. Error: LibSignalError: Failed to deserialize zkgroup::api::auth::auth_credential_with_pni::AuthCredentialWithPni
    at new LibSignalErrorBase (/home/ben/sauce/Signal-Desktop/node_modules/@signalapp/libsignal-client/dist/Errors.js:67:19)
    at new ByteArray (/home/ben/sauce/Signal-Desktop/node_modules/@signalapp/libsignal-client/dist/zkgroup/internal/ByteArray.js:17:24)
    at new AuthCredentialWithPni (/home/ben/sauce/Signal-Desktop/node_modules/@signalapp/libsignal-client/dist/zkgroup/auth/AuthCredentialWithPni.js:11:9)
    at DevNullWebAPIType.getGroupCredentials (/home/ben/sauce/Signal-Desktop/preload.bundle.js:303178:32)
    at maybeFetchNewCredentials (/home/ben/sauce/Signal-Desktop/preload.bundle.js:162054:20)
    at runWithRetry (/home/ben/sauce/Signal-Desktop/preload.bundle.js:161970:13)
    at async Object.initializeGroupCredentialFetcher (/home/ben/sauce/Signal-Desktop/preload.bundle.js:161962:3)
```

We think its job is to poll a server and download credentials -- we don't want this behaviour because we are trying to isolate the UI from the server completely.

## Decision

### Replace `initializeGroupCredentialFetcher` with dev null version

In `ts/adapters/signal.ts` we can just leave it out.

### Introduce new port for it just for illustration

```ts
// ts/ports/IInitializeGroupCredentialFetcher.ts
export type IInitializeGroupCredentialFetcher = () => Promise<void>;

export const DevNullInitializeGroupCredentialFetcher = (): Promise<void> =>
  Promise.resolve();
```

## Consequences

What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.
