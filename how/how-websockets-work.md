# How websockets works

Signal Desktop maintains a websocket connection and uses it to send messages and perform other tasks like syncing contacts.

The abstraction for this is `WebAPIType` and it is exposed at `window.WebAPI`.

`WebAPIType` is used by `MessageReceiver` and `MessageSender`.

## How connection is established

Part of `startApp` (`ts/background.ts`) is to create instances of `MessageReceiver` and `MessageSender` and assign them to window-scoped variables.

It also initialises `window.WebAPI`.

It then attaches event handlers.

```ts
// ts/background.ts

// ...

export async function startApp(): Promise<void> {
  // ...
  window.storage.onready(async () => {
    // ...
    server = window.WebAPI.connect({
      ...window.textsecure.storage.user.getWebAPICredentials(),
      hasStoriesDisabled: window.storage.get("hasStoriesDisabled", false),
    });
    window.textsecure.server = server;
    window.textsecure.messaging = new window.textsecure.MessageSender(server);

    // ...

    messageReceiver = new MessageReceiver({
      server,
      storage: window.storage,
      serverTrustRoot: window.getServerTrustRoot(),
    });

    // ...

    messageReceiver.addEventListener(
      "envelopeUnsealed",
      queuedEventListener(onEnvelopeUnsealed, false)
    );
    messageReceiver.addEventListener(
      "envelopeQueued",
      queuedEventListener(onEnvelopeQueued, false)
    );
    messageReceiver.addEventListener(
      "message",
      queuedEventListener(onMessageReceived, false)
    );
    messageReceiver.addEventListener(
      "delivery",
      queuedEventListener(onDeliveryReceipt)
    );
    messageReceiver.addEventListener(
      "contactSync",
      queuedEventListener(onContactSync)
    );
    messageReceiver.addEventListener(
      "sent",
      queuedEventListener(onSentMessage, false)
    );
    messageReceiver.addEventListener(
      "readSync",
      queuedEventListener(onReadSync)
    );
    messageReceiver.addEventListener(
      "viewSync",
      queuedEventListener(onViewSync)
    );
    messageReceiver.addEventListener(
      "read",
      queuedEventListener(onReadReceipt)
    );
    messageReceiver.addEventListener(
      "view",
      queuedEventListener(onViewReceipt)
    );
    messageReceiver.addEventListener(
      "error",
      queuedEventListener(onError, false)
    );
    messageReceiver.addEventListener(
      "decryption-error",
      queuedEventListener((event: DecryptionErrorEvent): void => {
        drop(onDecryptionErrorQueue.add(() => onDecryptionError(event)));
      })
    );
    messageReceiver.addEventListener(
      "invalid-plaintext",
      queuedEventListener((event: InvalidPlaintextEvent): void => {
        drop(
          onDecryptionErrorQueue.add(() => onInvalidPlaintextMessage(event))
        );
      })
    );
    messageReceiver.addEventListener(
      "retry-request",
      queuedEventListener((event: RetryRequestEvent): void => {
        drop(onRetryRequestQueue.add(() => onRetryRequest(event)));
      })
    );
    messageReceiver.addEventListener("empty", queuedEventListener(onEmpty));
    messageReceiver.addEventListener(
      "configuration",
      queuedEventListener(onConfiguration)
    );
    messageReceiver.addEventListener("typing", queuedEventListener(onTyping));
    messageReceiver.addEventListener(
      "sticker-pack",
      queuedEventListener(onStickerPack)
    );
    messageReceiver.addEventListener(
      "viewOnceOpenSync",
      queuedEventListener(onViewOnceOpenSync)
    );
    messageReceiver.addEventListener(
      "messageRequestResponse",
      queuedEventListener(onMessageRequestResponse)
    );
    messageReceiver.addEventListener(
      "profileKeyUpdate",
      queuedEventListener(onProfileKey)
    );
    messageReceiver.addEventListener(
      "fetchLatest",
      queuedEventListener(onFetchLatestSync)
    );
    messageReceiver.addEventListener("keys", queuedEventListener(onKeysSync));
    messageReceiver.addEventListener(
      "storyRecipientUpdate",
      queuedEventListener(onStoryRecipientUpdate, false)
    );
    messageReceiver.addEventListener(
      "callEventSync",
      queuedEventListener(onCallEventSync, false)
    );
    messageReceiver.addEventListener(
      "callLinkUpdateSync",
      queuedEventListener(onCallLinkUpdateSync, false)
    );
    messageReceiver.addEventListener(
      "callLogEventSync",
      queuedEventListener(onCallLogEventSync, false)
    );
    messageReceiver.addEventListener(
      "deleteForMeSync",
      queuedEventListener(onDeleteForMeSync, false)
    );
  });
}
// ...
```

## Startup events

### "storageService.sync: Cannot start; no storage or master key!"

This means that `onKeysSync` in `ts/background.ts` has not been called.

```ts
messageReceiver.addEventListener("keys", queuedEventListener(onKeysSync));
```

`MessageReceiver` (`ts/textsecure/MessageReceiver.ts`) uses `WebAPIType`.

`MessageReceiver` registers with `WebAPIType`, waiting for socket requests.

### How is the "keys" event produced?

We have this event here, and its type matches the registration above -- "keys".

```ts
export class KeysEvent extends ConfirmableEvent {
  public readonly storageServiceKey: Uint8Array | undefined;
  public readonly masterKey: Uint8Array | undefined;

  constructor(
    { storageServiceKey, masterKey }: KeysEventData,
    confirm: ConfirmCallback
  ) {
    super("keys", confirm);

    this.storageServiceKey = storageServiceKey;
    this.masterKey = masterKey;
  }
}
```

This event is raised by `handleKeys` in `MessageReceiver`.

1. `reset`
1. `addCachedMessagesToQueue`
1. `queueAllCached`
1. `queueCached`
1. `queueDecryptedEnvelope`
1. `handleDecryptedEnvelope`
1. `innerHandleContentMessage`
1. `handleSyncMessage`
1. `handleKeys`

or

1. `decryptAndCacheBatch`
1. `queueAllDecryptedEnvelopes`
1. `queueDecryptedEnvelope`
1. `handleDecryptedEnvelope`
1. `innerHandleContentMessage`
1. `handleSyncMessage`
1. `handleKeys`

Can't really understand this, either. Perhaps it's better to replace `MessageReceiver`.

That way we can work in terms of events and ignore the complexities of encrypted protocol buffers.

## Introducing `MessageReceiver` abstraction

We want to be able to replace `MessageReceiver` so that we can model incoming events.

`MessageReceiver` uses `override` which is interesting because it allows multiple methods with the same signature.

`MessageReceiver` extends `EventTarget` (`ts/textsecure/EventTarget.ts`)

```ts
// ts/textsecure/MessageReceiver.ts

// ...

public override addEventListener(
  name: 'empty',
  handler: (ev: EmptyEvent) => void
): void;

public override addEventListener(
  name: 'progress',
  handler: (ev: ProgressEvent) => void
): void;

// ...
```

Each of those is actually calling

```ts
// ts/textsecure/EventTarget.ts
addEventListener(eventName: string, callback: EventHandler): void {
  if (typeof eventName !== 'string') {
    throw new Error('First argument expects a string');
  }
  if (typeof callback !== 'function') {
    throw new Error('Second argument expects a function');
  }
  if (this.listeners == null || typeof this.listeners !== 'object') {
    this.listeners = {};
  }
  let listeners = this.listeners[eventName];
  if (typeof listeners !== 'object') {
    listeners = [];
  }
  listeners.push(callback);
  this.listeners[eventName] = listeners;
}
```

But it's a way of adding typed overloads.
