# 10. Introduce calling seam

Date: 2024-07-13

## Status

Accepted

## Context

Another issue we see is this error when opening a conversation:

```shell
Group call peeking failed LibSignalError: Failed to deserialize zkgroup::api::auth::auth_credential_with_pni::AuthCredentialWithPni
    at new LibSignalErrorBase (/home/ben/sauce/Signal-Desktop/node_modules/@signalapp/libsignal-client/dist/Errors.js:67:19)
    at new ByteArray (/home/ben/sauce/Signal-Desktop/node_modules/@signalapp/libsignal-client/dist/zkgroup/internal/ByteArray.js:17:24)
    at new AuthCredentialWithPni (/home/ben/sauce/Signal-Desktop/node_modules/@signalapp/libsignal-client/dist/zkgroup/auth/AuthCredentialWithPni.js:11:9)
    at DevNullWebAPIType.getGroupCredentials (/home/ben/sauce/Signal-Desktop/preload.bundle.js:303178:32)
    at maybeFetchNewCredentials (/home/ben/sauce/Signal-Desktop/preload.bundle.js:162054:20)
    at fetchMembershipProof (/home/ben/sauce/Signal-Desktop/preload.bundle.js:168195:9)
    at CallingClass.peekGroupCall (/home/ben/sauce/Signal-Desktop/preload.bundle.js:186790:29)
    at /home/ben/sauce/Signal-Desktop/preload.bundle.js:229310:38
```

It makes sense that making calls is an impleementation we woud like to be able to snip off.

## Decision

### Introduce `ICalling`

It needs to be wired in to ``

## Consequences

What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.
