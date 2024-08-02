# Contacts

Contacts are represented as private conversations between you and another person, there is no concept of an address book or standalone contacts list.

Whenever contacts are sought, the conversations list is used.

## Initial sync

The first time you connect `Signal-Desktop`, it syncs contacts from your phone and adds each one as a private conversation.

You will see the message "Syncing contacts and groups" when this is happening.

### The "contactSync" event

I am guessing this is related:

```ts
// ts/background.ts
messageReceiver.addEventListener(
  "contactSync",
  queuedEventListener(onContactSync)
);
```

Listeners are notified with a `ContactSyncEvent`:

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

which includes a list of contacts.

I think that is triggered from `connect` (`ts/background.ts`) calling `window.getSyncRequest` (`1`)

```ts
// // ts/background.ts
async function connect(firstRun?: boolean) {
  //...

  // On startup after upgrading to a new version, request a contact sync
  //   (but only if we're not the primary device)
  if (
    !firstRun &&
    connectCount === 1 &&
    newVersion &&
    window.textsecure.storage.user.getDeviceId() !== 1
  ) {
    log.info("Boot after upgrading. Requesting contact sync");
    window.getSyncRequest(); // <---------------------------------------------------- (1)

    // ...
  }

  //...
}
```

```ts
// ts/background.ts
window.getSyncRequest = (timeoutMillis?: number) => {
  strictAssert(messageReceiver, "MessageReceiver not initialized");

  const syncRequest = new window.textsecure.SyncRequest(
    messageReceiver,
    timeoutMillis
  );
  syncRequest.start();
  return syncRequest;
};
```

#### Where the notification comes from

`window.textsecure.SyncRequest` only uses `messageReceiver` to do this:

```ts
// ts/textsecure/SyncRequest.ts
class SyncRequestInner extends EventTarget {
  // ...
  constructor(private receiver: MessageReceiver, timeoutMillis?: number) {
    // ...
    receiver.addEventListener("contactSync", this.oncontact);
    // ...
  }
}
```

The actual sync operation is run by this:

```ts
await Promise.all([
  singleProtoJobQueue.add(MessageSender.getRequestConfigurationSyncMessage()),
  singleProtoJobQueue.add(MessageSender.getRequestBlockSyncMessage()),
  singleProtoJobQueue.add(MessageSender.getRequestContactSyncMessage()),
]);
```

So, how are `singleProtoJobQueue` and `messageReceiver` connected?

I think they're not connected at all: `MessageReceiver` is listening to the server via websocket.

`MessageReceiver` notifies with `ContactSyncEvent` in `handleContacts`.
