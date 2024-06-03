# How to connect to database

Signal uses an encrypted Sqlite database to store data locally.

It is stored on disk somewhere like:

```shell
~/.config/Signal/sql/db.sqlite
```

And the key to decrypt it is nearby at:

```shell
~/.config/Signal/config.json`
```

```shell
cat ~/.config/Signal/config.json
{
  "key": "cc5688a163f..."
}
```

Note that when developing locally you'll have two other configurations:

- ~/.config/Signal-development
- ~/.config/Signal-test

## Examples

The `./cli` executable shows how to connect and read from the database.

All commands take a path to a Signal configuration directory as their first argument.

From this path, the paths to the `db.sqlite` and `config.json` are inferred.

### Demo

This demonstration prints information about the database.

```ts
./cli demo ~/.config/Signal --build
```

### Print all conversations

```shell
./cli conversations ~/.config/Signal --limit 10 --build
```

### Print single conversation with messages

```shell
./cli conversation ~/.config/Signal 0973ed24-e7d6-43fc-baac-dbe2564e5db1 --build --limit 100
```

# References

- [Extracting Messages from Signal Desktop](https://www.tc3.dev/posts/2021-11-02-extract-messages-from-signal/)
- [Query Signal Desktop messages locally from SQLite using JavaScript](https://vmois.dev/query-signal-desktop-messages-sqlite/)
- [The process of creating a new, encrypted database is called “keying” the database.](https://www.zetetic.net/sqlcipher/sqlcipher-api/#key)
- [signal-cli](https://github.com/AsamK/signal-cli)
