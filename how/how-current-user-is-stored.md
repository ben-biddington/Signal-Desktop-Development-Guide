# How current user is stored

Contacts are stored as conversations and so "our" conversation means the current user.

```ts
// ts/background.ts
const ourConversation = window.ConversationController.getOurConversation();
```
