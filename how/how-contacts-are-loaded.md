# How contacts are loaded

Contacts are never stored in the database, they are downloaded over a websocket and stored in-memory in the Electron window.

## Startup

The stack trace:

- `connect` (ts/background.ts 1664)
- `start` (ts/background.ts 1353)
- `startApp` (ts/background.ts)

Part of `connect` is to call the following:

```ts
// (ts/background.ts 1859)
// Request configuration, block, GV1 sync messages, contacts
// (only avatars and inboxPosition),and Storage Service sync.
try {
  await Promise.all([
    singleProtoJobQueue.add(MessageSender.getRequestConfigurationSyncMessage()),
    singleProtoJobQueue.add(MessageSender.getRequestBlockSyncMessage()),
    runStorageService(),
    singleProtoJobQueue.add(MessageSender.getRequestContactSyncMessage()),
  ]);
} catch (error) {
  log.error(
    "connect: Failed to request initial syncs",
    Errors.toLogFormat(error)
  );
}
```

The `getRequestContactSyncMessage` function is where contacts are downloaded.

## getRequestContactSyncMessage

```ts
// ts/textsecure/MessageReceiver.ts
static getRequestContactSyncMessage(): SingleProtoJobData {
    const myAci = window.textsecure.storage.user.getCheckedAci();

    const request = new Proto.SyncMessage.Request();
    request.type = Proto.SyncMessage.Request.Type.CONTACTS;
    const syncMessage = this.createSyncMessage();
    syncMessage.request = request;
    const contentMessage = new Proto.Content();
    contentMessage.syncMessage = syncMessage;

    const { ContentHint } = Proto.UnidentifiedSenderMessage.Message;

    return {
      contentHint: ContentHint.RESENDABLE,
      serviceId: myAci,
      isSyncMessage: true,
      protoBase64: Bytes.toBase64(
        Proto.Content.encode(contentMessage).finish()
      ),
      type: 'contactSyncRequest',
      urgent: true,
    };
  }
```

There is a listener registered for when this process returns

```ts
// ts/background.ts
messageReceiver.addEventListener(
  "contactSync",
  queuedEventListener(onContactSync)
);
```

This results in `doContactSync` being called.

```ts
async function doContactSync({
  contacts,
  complete: isFullSync,
  receivedAtCounter,
  sentAt,
}: ContactSyncEvent): Promise<void> {
  // ...
}
```

`ContactSyncEvent` I am guessing contains full contact info like name.

```ts
export class ContactSyncEvent extends Event {
  constructor(
    public readonly contacts: ReadonlyArray<ContactDetailsWithAvatar>,
    public readonly complete: boolean,
    public readonly receivedAtCounter: number,
    public readonly sentAt: number
  ) {
    super("contactSync");
  }
}
```
