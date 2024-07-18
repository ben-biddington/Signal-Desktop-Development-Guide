# How conversations are loaded

`ConversationController` loads them from the database.

- `ConversationController.load`
- `ConversationController.doLoad`
- `ts/sql/Client.ts` -> `getAllConversations` -> database (`ts/sql/Client.ts`)

`ConversationController` works in terms of `ConversationModel`, but that type is converted to `ConversationType` during state initialisation.

`window.ConversationController` is assigned like this:

```ts
// ts/ConversationController.ts
export function start(): void {
  log.info("ts/ConversationController.ts start", new Error().stack);
  const conversations = new window.Whisper.ConversationCollection();

  window.ConversationController = new ConversationController(conversations);
  window.getConversations = () => conversations;
}
```

`start` is called from

## Conversation state

The state for conversations in redux looks like this.

Note it references `ConversationType` and not `ConversationModel`.

```ts
// ts/state/ducks/conversations.ts
export type ConversationsStateType = Readonly<{
  preJoinConversation?: PreJoinConversationType;
  invitedServiceIdsForNewlyCreatedGroup?: ReadonlyArray<ServiceIdString>;
  conversationLookup: ConversationLookupType;
  conversationsByE164: ConversationLookupType;
  conversationsByServiceId: ConversationLookupType;
  conversationsByGroupId: ConversationLookupType;
  conversationsByUsername: ConversationLookupType;
  selectedConversationId?: string;
  targetedMessage: string | undefined;
  targetedMessageCounter: number;
  targetedMessageSource: TargetedMessageSource | undefined;
  targetedConversationPanels: {
    isAnimating: boolean;
    wasAnimated: boolean;
    direction: "push" | "pop" | undefined;
    stack: ReadonlyArray<PanelRenderType>;
    watermark: number;
  };
  targetedMessageForDetails?: MessageAttributesType;

  lastSelectedMessage: MessageTimestamps | undefined;
  selectedMessageIds: ReadonlyArray<string> | undefined;

  showArchived: boolean;
  composer?: ComposerStateType;
  hasContactSpoofingReview: boolean;

  /**
   * Each key is a conversation ID. Each value is a value representing the state of
   * verification: either a set of pending conversationIds to be approved, or a tombstone
   * telling jobs to cancel themselves up to that timestamp.
   */
  verificationDataByConversation: VerificationDataByConversation;

  // Note: it's very important that both of these locations are always kept up to date
  messagesLookup: MessageLookupType;
  messagesByConversation: MessagesByConversationType;
}>;
```

## Initial state

`window.getConversations` is used to get the raw list of conversations, but they are converted from `ConversationModel` to `ConversationType` using `format`.

For `format`, see `getConversation` in `ts/util/getConversation.ts`.

```ts
// ts/state/getInitialState.ts
const convoCollection = window.getConversations();
const formattedConversations = convoCollection.map(
  (conversation) => conversation.format() // convert from `ConversationModel` to `ConversationType`
);
```

Only `ConversationType` is used from here on.

### `window.getConversations`

The `window.getConversations` function is assigned as part of preload. The `start` function is called by `ts/windows/main/start.ts`.

```ts
// ts/ConversationController.ts

export function start(): void {
  const conversations = new window.Whisper.ConversationCollection();

  window.ConversationController = new ConversationController(conversations);
  window.getConversations = () => conversations;
}
```

**[!, WIP]** Note that when we are using `DevNullConversationController` we overwrite this with our mocked version.

## Adding to state

Not sure how this happens yet. For example creating a new conversation via the UI.

## What conversations look like

Here's one printed from the database, this one reresents a group conversation:

```json
{
    unreadCount: 0,
    verified: 0,
    messageCount: 236,
    sentMessageCount: 43,
    id: 'ec3dff29-5c9e-439c-8586-a5d88f9b24cb',
    groupId: 'P+4GA58PmF0GJHpMsZTCZZ6VDFBlLaYT43TfMmk2DM4=',
    type: 'group',
    version: 2,
    groupVersion: 2,
    masterKey: 'sTqYbmOkoTzoxcxCIHgqXE0kZELd5hXTK8NXBef621k=',
    secretParams: 'ALE6mG5jpKE86MXMQiB4KlxNJGRC3eYV0yvDVwXn+ttZP+4GA58PmF0GJHpMsZTCZZ6VDFBlLaYT43TfMmk2DM5gDbNi/G+sRcTRAcW2OhujCHBlmnAUFPjXFt7ixt3lHxy8erG+EFTMWfoFkeeL+mEJABWzL3BNFDbFOQAINGUBPjkQXwNZvgwx2KEssqGGXiufPhIRMUNagXyOXbTK2AX0MmBB3yueJ/NfTg6vxIevBLctBPrNwW0HIcqgOt3WRK7te5t9JP1oQMESbzxrvVwUII1SspCDugOXEdhegkMJDFb59M8O5IUKoiqO6phQFtFgwIvClzspFVA5i/X7Rw7uKDcVR+8ivWotX+jq1kDpgrH0M7t6CQZ+ORajXRRiRg==',
    publicParams: 'AD/uBgOfD5hdBiR6TLGUwmWelQxQZS2mE+N03zJpNgzO9DJgQd8rnifzX04Or8SHrwS3LQT6zcFtByHKoDrd1kTuKDcVR+8ivWotX+jq1kDpgrH0M7t6CQZ+ORajXRRiRg==',
    sealedSender: 0,
    color: 'A200',
    hideStory: false,
    isArchived: false,
    markedUnread: false,
    dontNotifyForMentionsIfMuted: false,
    storageID: 'YVZlNS1iARYq1/kpJkssHA==',
    storageVersion: 742,
    storySendMode: 'IfActive',
    muteExpiresAt: 0,
    messageRequestResponseType: 1,
    profileSharing: true,
    revision: 10,
    name: 'Fergusson SLT',
    avatar: {
      url: 'groups/P-4GA58PmF0GJHpMsZTCZZ6VDFBlLaYT43TfMmk2DM4/gZpV74_UpcYB6kKfw27vPg',
      path: '1d/1d1525d83dcbb35e9a166cc5ef3b6d01e6d19a59ef133d9b570121d7bf850372',
      hash: 'OHjTeyIxxNgYTeayqzvyAvbri8hWsc9RDV3gwffKXGgYAD6jocu7rhix43kKDmrnE4vd7FVAdtlVKDireFErJg=='
    },
    expireTimer: 0,
    accessControl: { attributes: 2, members: 2, addFromInviteLink: 4 },
    left: false,
    membersV2: [ [Object], [Object], [Object], [Object], [Object], [Object] ],
    pendingMembersV2: [],
    pendingAdminApprovalV2: [],
    description: 'Incorrect spelling',
    announcementsOnly: false,
    bannedMembersV2: [],
    active_at: 1721099066662,
    lastMessage: "What does Guy's shirt say? Save Eminem?",
    lastMessageStatus: 'read',
    timestamp: 1721009911076,
    unreadMentionsCount: 0,
    lastMessageBodyRanges: [],
    lastMessageAuthor: 'You',
    lastMessageReceivedAt: 1717631839369,
    lastMessageReceivedAtMs: 1721011764047,
    draft: '',
    draftBodyRanges: [],
    draftChanged: true
  }
```

Here's one that represents a contact:

```json
{
    unreadCount: 2,
    verified: 0,
    messageCount: 113,
    sentMessageCount: 41,
    id: '4dd6c9b3-c763-4d9f-a643-c8bd7f42a210',
    serviceId: '1d8adee7-3e2d-4fc7-80c8-30ed8f4488cd',
    e164: '+64275033794',
    type: 'private',
    version: 2,
    pni: 'PNI:861788bd-4250-4501-a65a-bb0f1be4ec03',
    sealedSender: 1,
    color: 'A150',
    profileKeyCredential: 'AFAupuGuLKDG+0iBGQZIr6QUMQe7aGhfDJavkQsKxz8CcCVUEbwIB4+pt4ZLlPsZTHSzzPXJLVqROqoHTOHVqQnk1DfnmwfzgPqW3Fnw21pb7rF0ImAvlL+CWKBjcW8cOB2K3uc+LU/HgMgw7Y9EiM2kPzqmWEtajGQV2rQwIKoYtxBggWsItH2UrUMws0OsnQD+mmYAAAAA',
    profileKeyCredentialExpiration: 1721433600000,
    accessKey: 'EXyndWET9gGPTUTWYnn/aw==',
    profileKey: 'pD86plhLWoxkFdq0MCCqGLcQYIFrCLR9lK1DMLNDrJ0=',
    profileName: 'Cat',
    systemGivenName: 'Catherine',
    systemFamilyName: 'Wilson',
    nicknameGivenName: '',
    nicknameFamilyName: '',
    messageRequestResponseType: 1,
    profileSharing: true,
    hideStory: false,
    isArchived: false,
    markedUnread: false,
    storageID: 'sHUFje8Vv1ni+awzZAtodw==',
    storageVersion: 760,
    muteExpiresAt: 0,
    about: '',
    aboutEmoji: '',
    sharingPhoneNumber: false,
    capabilities: { paymentActivation: true, deleteSync: false },
    profileAvatar: {
      hash: 'NI/XkxNuqd1Gsy1pkALNNVxiPvVzWQTJscnKc3qaZwBrGJ80btLu+Zcsgu3vYYJxg5GEytjnWaR8j5WMP6Gg/A==',
      path: 'b5/b55e449e5871fc1e2cb18a00447b38e99f43fd149215984e2a41da624c201f0a'
    },
    lastProfile: {
      profileKey: 'pD86plhLWoxkFdq0MCCqGLcQYIFrCLR9lK1DMLNDrJ0=',
      profileKeyVersion: '7da259a091792d2de06ab6efb16eda005748b96015254ee20140a9c7f3f526c1'
    },
    name: 'Catherine Wilson',
    inbox_position: 1,
    avatar: {
      contentType: 'image/png',
      length: 2994,
      hash: 'Fits0Qe7K+0dtaBDAlgjHmOIfye/LrjR7kFf3PFaK8vSJ4qHm1LQLc1YlEKtDwE2g8NnNC2WaH9Y9k/iUPQ65w==',
      path: 'f9/f9ab45275b24d6be3ada2a2a5c88ed980d6673f737d317d49f95654cc3ede0fc'
    },
    active_at: 1720903785455,
    unreadMentionsCount: 0,
    lastMessage: '...',
    lastMessageBodyRanges: [],
    lastMessageAuthor: 'Catherine',
    lastMessageStatus: null,
    lastMessageReceivedAt: 1717631839168,
    lastMessageReceivedAtMs: 1720903780369,
    timestamp: 1720577554294
  },

```
