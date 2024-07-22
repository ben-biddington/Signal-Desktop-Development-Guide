# How to connect to database

Signal uses an encrypted Sqlite database to store data locally.

It is stored on disk somewhere like:

```shell
~/.config/Signal/sql/db.sqlite
```

And the key to decrypt it is nearby at:

```shell
~/.config/Signal/config.json
```

```shell
cat ~/.config/Signal/config.json
{
  "key": "cc5688a163f..."
}
```

More recent version of `Signal-Dekstop` use an encrypted key instead:

```shell
cat /tmp/mock-signal-XXXXXXk02SeV/config.json
{
  "encryptedKey": "7631314afc42c5075443d2e4ae3672890e7948196269feddb1e4657d0a56ed2848ccacd9a761aadbe5ec4952b46f2f3bec7fc78ffb5836b591edd84beb1d48fa5e12f7251307903605ace6d04b2a2cd82dad34"
}
```

There is a migration to encrypted keys in `getSQLKey` (`app/main.ts`).

Currently my production version does not use an encrypted key.

Encryption is provided directly by [`Electron safeStorage`](https://www.electronjs.org/docs/latest/api/safe-storage). You're supposed to be able to [turn this off by using the `--password-store="basic"` flag](https://www.electronjs.org/docs/latest/api/safe-storage) but it doesn't work for me.

Note that when developing locally you'll have two other configurations:

- ~/.config/Signal-development
- ~/.config/Signal-test

## Examples

These assume you have an unencrypted key in `~/.config/Signal/config.json`.

These examples will not work with an encrypted key.

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
