import { SignalDatabaseOptions } from "adapters/signal/sqlite/SignalDatabaseOptions";
import { query } from "adapters/signal/sqlite/query";
import { MessageFilterOptions } from "adapters/signal/sqlite/MessageFilterOptions";

export const conversation = (
  opts: SignalDatabaseOptions,
  filterOptions: MessageFilterOptions
) => {
  const { conversationId } = filterOptions;

  const conversation = query(opts, (db) => {
    const conversation = db
      .prepare(
        `SELECT json FROM conversations 
         WHERE id=?`
      )
      .bind(conversationId)
      .get();

    if (!conversation)
      throw new Error(
        `Failed to find conversation with id <${conversationId}>`
      );

    return JSON.parse(conversation.json);
  });

  return {
    conversation,
    messages: messagesInConversation(opts, {
      conversationId,
      limit: filterOptions.limit,
    }),
  };
};

export const conversations = (
  opts: SignalDatabaseOptions,
  filterOptions: MessageFilterOptions
): any[] => {
  const { limit = 1 } = filterOptions;

  return query(opts, (db) => {
    return db
      .prepare(
        `SELECT json FROM conversations 
         WHERE active_at IS NOT NULL -- AND name IS NOT NULL 
         ORDER BY active_at DESC LIMIT ?`
      )
      .bind(limit)
      .all()
      .map((it) => JSON.parse(it.json))
      .sort(byLatestDateFirst);
  });
};

export const messages = (
  opts: SignalDatabaseOptions,
  filterOptions: MessageFilterOptions
): any[] => {
  const { limit = 1, conversationId } = filterOptions;

  return query(opts, (db) => {
    return db
      .prepare(
        `SELECT json FROM messages  
         LIMIT ?`
      )
      .bind(limit)
      .all()
      .map((it) => JSON.parse(it.json))
      .sort(byLatestDateFirst);
  });
};

export const messagesInConversation = (
  opts: SignalDatabaseOptions,
  filterOptions: MessageFilterOptions
): any[] => {
  const { limit = 1, conversationId } = filterOptions;

  return query(opts, (db) => {
    const q = db
      .prepare(
        `SELECT json, * 
         FROM messages 
         WHERE conversationId=?  
         LIMIT ?
        `
      )
      .bind(conversationId, limit);

    return q
      .all()
      .map((it) => {
        // console.log(it);
        return it;
      })
      .map((it) => JSON.parse(it.json))
      .sort(byEarliestDateFirst);
  });
};

type WithTimeStamp = { timestamp: any };

const byEarliestDateFirst = (a: WithTimeStamp, b: WithTimeStamp) =>
  a.timestamp - b.timestamp;
const byLatestDateFirst = (a: WithTimeStamp, b: WithTimeStamp) =>
  b.timestamp - a.timestamp;
