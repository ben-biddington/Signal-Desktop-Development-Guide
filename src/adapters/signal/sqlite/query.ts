import fs from "fs";
import SQL from "@signalapp/better-sqlite3";
import { SignalDatabaseOptions } from "adapters/signal/sqlite/SignalDatabaseOptions";

export const query = <T>(
  opts: SignalDatabaseOptions,
  fn: (db: SQL.Database) => T
) => {
  const db = SQL(opts.databaseFilePath, { readonly: true });

  try {
    //
    // [!] decrypt the database using a key
    //
    // See: Signal-Desktop/ts/sql/Server.ts, keyDatabase function
    // See: https://www.zetetic.net/sqlcipher/sqlcipher-api/#key
    db.pragma(`key = "x'${getDecryptionKey(opts.decryptionKeyFilePath)}'"`);

    return fn(db);
  } finally {
    db.close();
  }
};

const getDecryptionKey = (configurationFilePath: string) =>
  JSON.parse(fs.readFileSync(configurationFilePath).toString())["key"];
