# How conversations are loaded

`ConversationController` loads them from the database.

- `ConversationController.load`
- `ConversationController.doLoad`
- `ts/sql/Client.ts` -> `getAllConversations` -> database (`ts/sql/Client.ts`)

`ConversationController` works in terms of `ConversationModel`, but that type is converted to `ConversationType` during state initialisation.

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
