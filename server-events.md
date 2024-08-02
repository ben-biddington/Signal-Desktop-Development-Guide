# Server events

`Signal-Desktop` maintains a websocket connection to `Signal` server and monitors for incoming responses, translating to one of these events.

I think `MessageReceiver` is connected here:

```ts
// ts/background.ts
server.registerRequestHandler(messageReceiver);
```

Based on `ts/textsecure/messageReceiverEvents.ts`:

```shell
grep -Eir  "extends .*Event" ../Signal-Desktop/ts/textsecure/messageReceiverEvents.ts | \
cut  -d " " -f 3 | sort | \
while read line ; do echo "1. \`$line\`" ; done
```

1. `CallEventSyncEvent`
1. `CallLinkUpdateSyncEvent`
1. `CallLogEventSyncEvent`
1. `ConfigurationEvent`
1. `ConfirmableEvent`
1. `ContactSyncEvent`
1. `DecryptionErrorEvent`
1. `DeleteForMeSyncEvent`
1. `DeliveryEvent`
1. `EmptyEvent`
1. `EnvelopeQueuedEvent`
1. `EnvelopeUnsealedEvent`
1. `ErrorEvent`
1. `FetchLatestEvent`
1. `InvalidPlaintextEvent`
1. `KeysEvent`
1. `MessageEvent`
1. `MessageRequestResponseEvent`
1. `ProfileKeyUpdateEvent`
1. `ProgressEvent`
1. `ReadEvent`
1. `ReadSyncEvent`
1. `RetryRequestEvent`
1. `SentEvent`
1. `StickerPackEvent`
1. `StoryRecipientUpdateEvent`
1. `TypingEvent`
1. `ViewEvent`
1. `ViewOnceOpenSyncEvent`
1. `ViewSyncEvent`

These are all events that are raised in response to incoming websocket messages.
