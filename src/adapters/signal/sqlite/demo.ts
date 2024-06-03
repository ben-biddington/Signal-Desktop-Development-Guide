import { query } from "adapters/signal/sqlite/query";
import { SignalDatabaseOptions } from "adapters/signal/sqlite/SignalDatabaseOptions";

// https://vmois.dev/query-signal-desktop-messages-sqlite/
export const demo = async (opts: SignalDatabaseOptions) => {
  console.log(`Opening database at <${opts.databaseFilePath}>`);

  await query(opts, (db) => {
    const allTables = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name ASC;`
      )
      .all();

    console.log(`\nDatabase tables (${allTables.length})\n`);
    console.log(allTables.map((it) => it.name));
    console.log("\n");

    const conversationsTableInfo = db
      .prepare(`SELECT sql FROM sqlite_schema WHERE name = 'conversations';`)
      .all()
      .map((it) => it.sql);

    console.log(`The conversation table schema\n`);
    console.log(conversationsTableInfo);

    const messagesTableInfo = db
      .prepare(`SELECT sql FROM sqlite_schema WHERE name = 'messages';`)
      .all()
      .map((it) => it.sql);

    console.log(`The messages table schema\n`);
    console.log(messagesTableInfo);

    const sendLogRecipientsTableInfo = db
      .prepare(
        `SELECT sql FROM sqlite_schema WHERE name = 'sendLogRecipients';`
      )
      .all()
      .map((it) => it.sql);

    console.log(`The sendLogRecipients table schema\n`);
    console.log(sendLogRecipientsTableInfo);

    const attachmentsTableInfo = db
      .prepare(
        `SELECT sql FROM sqlite_schema WHERE name = 'attachment_downloads';`
      )
      .all()
      .map((it) => it.sql);

    console.log(`The attachment_downloads table schema\n`);
    console.log(attachmentsTableInfo);

    const messageLimit = 1;

    const messages = db
      .prepare(
        `SELECT json FROM conversations WHERE active_at IS NOT NULL AND name IS NOT NULL ORDER BY active_at DESC LIMIT ?`
      )
      .bind(messageLimit)
      .all()
      .map((it) => JSON.parse(it.json));

    console.log(`\nLatest <${messageLimit}> conversations\n`);

    console.log(messages);
  });
};
