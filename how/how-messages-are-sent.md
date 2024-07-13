# How messages are sent

1. `sendMultiMediaMessage` (`ts/state/ducks/composer.ts`)
1. `conversation.enqueueMessageForSend`

The thing that actually sends the message is `MessageSender` which is impemented with `WebAPIType` (`window.server`).

The queueing hopefully we can can keep.

## ConversationModel.enqueueMessageForSend

```ts
// ts/state/ducks/composer.ts
const conversation = window.ConversationController.get(conversationId);

// ...
await conversation.enqueueMessageForSend(
  {
    body: message,
    attachments,
    quote,
    preview: getLinkPreviewForSend(message),
    bodyRanges,
  },
  {
    sendHQImages,
    timestamp,
    // We rely on enqueueMessageForSend to call these within redux's batch
    extraReduxActions: () => {
      conversation.setMarkedUnread(false);
      resetLinkPreview(conversationId);
      drop(clearConversationDraftAttachments(conversationId, draftAttachments));
      setQuoteByMessageId(conversationId, undefined)(
        dispatch,
        getState,
        undefined
      );
      dispatch(incrementSendCounter(conversationId));
      dispatch(setComposerDisabledState(conversationId, false));

      if (state.items.audioMessage) {
        drop(new Sound({ soundType: SoundType.Whoosh }).play());
      }
    },
  }
);
```

### window.Signal.Data.saveMessage

We have a port for this already: `ClientInterface`.

## `sendNormalMessage`

### `sendToGroup` (`ts/util/sendToGroup.ts`)

Uses `window.textsecure.messaging.sendGroupProto`.

The default implementation of `window.textsecure.messaging` uses `WebAPIType` to send messages.

`window.textsecure.messaging` is initialised in `ts/background.ts`

```ts
// ts/background.ts
window.storage.onready(async () => {
  // ...
  server = window.WebAPI.connect({
    ...window.textsecure.storage.user.getWebAPICredentials(),
    hasStoriesDisabled: window.storage.get("hasStoriesDisabled", false),
  });

  window.textsecure.server = server;
  window.textsecure.messaging = new window.textsecure.MessageSender(server);

  // ...
});
```

# Troubleshooting

## Failed to deserialize zkgroup::api::auth::auth_credential_with_pni::AuthCredentialWithPni

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

Here is [`AuthCredentialWithPni`](https://github.com/signalapp/libsignal/blob/a4a0663528dadc38215e46c6f94484b435f5fe02/node/ts/zkgroup/auth/AuthCredentialWithPni.ts#L9).

And some [tests](https://github.com/signalapp/libsignal/blob/a4a0663528dadc38215e46c6f94484b435f5fe02/node/ts/test/ZKGroup-test.ts#L32).

Here's [a test showing that exact error](https://github.com/signalapp/libsignal/blob/a4a0663528dadc38215e46c6f94484b435f5fe02/node/ts/test/ZKGroup-test.ts#L112).

So in order to proceed we need to know how to make a valid one.

## "This group is invalid"

Having a lot of trouble because you have to assign conversations to group 2 otherwise you either get that "This group is invalid" error --or-- you are asked to ugrade group from version 1 to 2 -- "Upgrade this group to activate new features like @mentions and admins.".

```ts
const isValid =
  isDirectConversation(conversationAttributes) ||
  isGroupV1(conversationAttributes) ||
  isGroupV2(conversationAttributes);

if (!isValid) {
  // eslint-disable-next-line no-console
  console.log("ts/util/shouldShowInvalidMessageToast.ts", {
    conversationAttributes,
    isDirectConversation: isDirectConversation(conversationAttributes),
    isGroupV1: isGroupV1(conversationAttributes),
    isGroupV2: isGroupV2(conversationAttributes),
  });
  return { toastType: ToastType.InvalidConversation };
}
```

```ts
// ts/util/whatTypeOfConversation.ts
export function isGroupV1(
  conversationAttrs: Pick<ConversationAttributesType, "groupId">
): boolean {
  const { groupId } = conversationAttrs;
  if (!groupId) {
    return false;
  }

  const buffer = Bytes.fromBinary(groupId);
  return buffer.byteLength === window.Signal.Groups.ID_V1_LENGTH;
}
```

All that needs to be done is to create groups like:

```ts
const newVersionTwoGroupId = () =>
  toBase64(deriveGroupFields(getRandomBytes(Groups.ID_LENGTH)).id);

const newVersionTwoGroupMasterKey = () =>
  toBase64(getRandomBytes(Groups.ID_LENGTH));

const createNewGroup = () => ({
  groupId: newVersionTwoGroupId(),
  2,
  masterKey: newVersionTwoGroupMasterKey(),
});
```

It needs `2` as the version and the right length for keys.

Version `1` is of no use because the UI asks you to upgrade.

## "me2.get is not a function"

```shell
usernameIntegrity: check failed with error: TypeError: me2.get is not a function
    at UsernameIntegrityService.checkUsername (/home/ben/sauce/Signal-Desktop/preload.bundle.js:313395:30)
    at UsernameIntegrityService.check (/home/ben/sauce/Signal-Desktop/preload.bundle.js:313390:20)
    at /home/ben/sauce/Signal-Desktop/preload.bundle.js:313374:44
    at run (/home/ben/sauce/Signal-Desktop/preload.bundle.js:90742:22)
    at /home/ben/sauce/Signal-Desktop/preload.bundle.js:90745:27
    at run (/home/ben/sauce/Signal-Desktop/preload.bundle.js:16337:90)
    at PQueue26._tryToStartAnother (/home/ben/sauce/Signal-Desktop/preload.bundle.js:16285:13)
    at /home/ben/sauce/Signal-Desktop/preload.bundle.js:16350:16
    at new Promise (<anonymous>)
    at PQueue26.add (/home/ben/sauce/Signal-Desktop/preload.bundle.js:16332:16) retrying in 8000ms
```

Added another port for `UsernameIntegrityService` to snip that off.

## "Pre-check conversation undefined not found"

```shell
routineProfileRefresh/2: refreshed profile for dcd936c5-eeda-48c7-bea1-0a84cf33e977 (51623f0d-edff-4914-9c5e-f8a55d8af905) Error: ProfileServices.get: Pre-check conversation undefined not found
    at ProfileService.get (/home/ben/sauce/Signal-Desktop/preload.bundle.js:203418:17)
    at getProfile (/home/ben/sauce/Signal-Desktop/preload.bundle.js:203547:25)
    at refreshConversation (/home/ben/sauce/Signal-Desktop/preload.bundle.js:313347:13)
    at /home/ben/sauce/Signal-Desktop/preload.bundle.js:313373:33
    at run (/home/ben/sauce/Signal-Desktop/preload.bundle.js:16337:133)
    at PQueue26._tryToStartAnother (/home/ben/sauce/Signal-Desktop/preload.bundle.js:16285:13)
    at /home/ben/sauce/Signal-Desktop/preload.bundle.js:16350:16
    at new Promise (<anonymous>)
    at PQueue26.add (/home/ben/sauce/Signal-Desktop/preload.bundle.js:16332:16)
    at routineProfileRefresh (/home/ben/sauce/Signal-Desktop/preload.bundle.js:313373:23)
```
