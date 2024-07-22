# 13. Cannot query database for tests

Date: 2024-07-21

## Status

Accepted

## Context

I was trying to write a test where I need to query the list of messages for a conversation, and I wondered about reading the database directly.

This cannot be done because the encryption key for the database now being itself encrypted. It can only be decrypted by a running instance of `Electron`.

```shell
cat /tmp/mock-signal-XXXXXXk02SeV/config.json
{
  "encryptedKey": "7631314afc42c5075443d2e4ae3672890e7948196269feddb1e4657d0a56ed2848ccacd9a761aadbe5ec4952b46f2f3bec7fc78ffb5836b591edd84beb1d48fa5e12f7251307903605ace6d04b2a2cd82dad34"
}
```

See: `getSQLKey` (`app/main.ts`)

### `window.ConversationController` is also not available

Prior to the database idea, I wondered about using something like `window.ConversationController.getAll`, but it is not available due to [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation).

```ts
contextBridge.exposeInMainWorld("Signal", Signal);
```

## Decision

The change that we're proposing or have agreed to implement.

## Consequences

What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.
