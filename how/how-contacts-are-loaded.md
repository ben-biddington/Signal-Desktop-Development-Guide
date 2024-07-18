# How contacts are loaded

Contacts are stored as conversations which means they **are** stored in the database.

## Contact sync

Contacts are loaded when handled `ContactSyncEvent` invokes `doContactSync` (`ts/services/contactSync.ts`).

### Startup

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

`ContactSyncEvent` contains the list of contacts.

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

## `SingleProtoJobQueue`

```ts
// ts/jobs/singleProtoJobQueue.ts
const { messaging } = window.textsecure;
```

## Allowing `doContactSync` to work

This requires this to return something sensible:

```ts
const { conversation } = window.ConversationController.maybeMergeContacts({
  e164: details.number,
  aci: normalizeAci(details.aci, "contactSync.aci"),
  reason: logId,
});
```

At the moment this fails with `conversation.queueJob is not a function`.
