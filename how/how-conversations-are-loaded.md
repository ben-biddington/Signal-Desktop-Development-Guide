# How conversations are loaded

`ConversationController` loads them from the database.

- `ConversationController.load`
- `ConversationController.doLoad`
- `ts/sql/Client.ts` -> `getAllConversations` -> database (`ts/sql/Client.ts`)

## Search results are sourced from database direcly

Search results do not go through `window.ConversationController`, threr is a direct database dependency.

- `updateSearchTerm` dispatched in `ts/state/smart/LeftPane.tsx`
- `updateSearchTerm` (`ts/state/ducks/search.ts`)
- `doSearch` (`ts/state/ducks/search.ts`)
- `queryMessages` (`ts/state/ducks/search.ts`)
- `dataSearchMessages` (`ts/sql/Client.ts`)

`dataSearchMessages` is where the database is called indrectly via `Electron` channel.

So: the UI has a direct database dependency, we can't intercept it like we can with `window.Signal`.

We'll need to introduce abstractions for `queryMessages`, perhaps on `window.ConversationController`.
