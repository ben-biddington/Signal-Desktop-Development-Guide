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
cat ~/.config/Signal-development/config.json
{
  "key": "cc5688a163f..."
}
```

## [July 2024] Database enrcryption key is now encrypted

More recent version of `Signal-Desktop` use an encrypted key instead:

```shell
cat ~/.config/Signal-development/config.json
{
  "encryptedKey": "763131bbe5f874ee42c593d97ecf679e32b7971e4cac9f7efad761249361a120d033b3927cc85059a4a21a2096e105e740fdd304d6ee6ea0afa71e34a6c15c43a395ec7cc201a6c69f908cef1ef0880e28613b",
  "safeStorageBackend": "gnome_libsecret"
}
```

## SafeStorage

Encryption for `encryptedKey` provided by [`Electron safeStorage`](https://www.electronjs.org/docs/latest/api/safe-storage), which uses the operating system.

> This module adds extra protection to data being stored on disk by using OS-provided cryptography systems. -- [doc](https://www.electronjs.org/docs/latest/api/safe-storage),

Here's where [`DecryptString`](https://github.com/electron/electron/blob/ed3242adc1ac2cd1e549a9a8a528b59add6764af/shell/browser/api/electron_api_safe_storage.cc#L79) is implemented.

Seealso: https://chromium.googlesource.com/chromium/src/+/lkgr/components/os_crypt/sync/os_crypt_linux.cc.

### Opting out of safe storage

It can be [turned this off by using the `--password-store="basic"` flag](https://www.electronjs.org/docs/latest/api/safe-storage).

### Using `--password-store="basic"` on already-encrypted config fails

Start electron with `--password-store="basic"`

```shell
node_modules/.bin/electron  . --password-store="basic"
```

This fails with:

```shell
Database startup error:

SafeStorageBackendChangeError: Detected change in safeStorage backend, can't decrypt DB key (previous: gnome_libsecret, current: basic_text)
at getSQLKey ([REDACTED]/app/main.js:1261:11)
at initializeSQL ([REDACTED]/app/main.js:1322:11)
at App.<anonymous> ([REDACTED]/app/main.js:1540:20)
```

### You cannot decrypt another application's secrets

I made an example command that tries to:

- Start a new blank electron application
- Decrypt a secret from `Signal-Dekstop` config file

It fails, try it with:

```shell
./cli getSqlKey ~/sauce/Signal-Desktop ~/.config/Signal --build
```

And you see:

```shell
[stdout.data] {
  error: Error: Error while decrypting the ciphertext provided to safeStorage.decryptString.
      at _callee$ (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:34:39)
      at tryCatch (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:7:1062)
      at Generator.<anonymous> (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:7:3008)
      at Generator.next (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:7:1699)
      at asyncGeneratorStep (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:8:70)
      at _next (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:9:163)
      at /home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:9:299
      at new Promise (<anonymous>)
      at App.<anonymous> (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/decrypt/index.js:9:90)
      at App.emit (node:events:519:28)
}
```

I assume the idea is to prevent applications from decrypting eachother's secrets, even when being run by the same user.

How this works [does differ between operating systems](https://www.electronjs.org/docs/latest/api/safe-storage).

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

## Troubleshooting

### SqliteError: file is not a database

You get this if you try and open an encrypted database with the wrong key.

```shell
Opening database at </home/ben/.config/Signal/sql/db.sqlite>

/home/ben/sauce/Signal-Desktop-Development-Guide/node_modules/@signalapp/better-sqlite3/lib/methods/wrappers.js:5
	return this[cppdb].prepare(sql, this, false);
	                   ^
SqliteError: file is not a database
    at Database.prepare (/home/ben/sauce/Signal-Desktop-Development-Guide/node_modules/@signalapp/better-sqlite3/lib/methods/wrappers.js:5:21)
    at /home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/demo.js:21:32
    at query (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/query.js:21:12)
    at _callee$ (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/demo.js:20:35)
    at tryCatch (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/demo.js:9:1062)
    at Generator.<anonymous> (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/demo.js:9:3008)
    at Generator.next (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/demo.js:9:1699)
    at asyncGeneratorStep (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/demo.js:10:70)
    at _next (/home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/demo.js:11:163)
    at /home/ben/sauce/Signal-Desktop-Development-Guide/dist/adapters/signal/sqlite/demo.js:11:299 {
  code: 'SQLITE_NOTADB'
}

```

## How to create a new blank, unencrypted database

In the `Signal-Desktop` directory run:

```shell
rm -rf /tmp/signal-test-60a36fe8-8d1b-4520-b53e-b590c23ddfa7 && \
NODE_ENV=development NODE_CONFIG='{"storagePath":"/tmp/signal-test-60a36fe8-8d1b-4520-b53e-b590c23ddfa7"}' \
npm run start -- --password-store="basic"
```

You'll then observe that the database key is in plain text:

```shell
cat /tmp/signal-test-60a36fe8-8d1b-4520-b53e-b590c23ddfa7/config.json
{
  "key": "ec4f82e6646678188b02a5ffee830d1b5ce8da0f9ddd0daf6e62bb49c74f0d40"
}
```

You can then proceed to read its database.

```shell
./cli demo /tmp/signal-test-60a36fe8-8d1b-4520-b53e-b590c23ddfa7 --build
```

# References

- [Extracting Messages from Signal Desktop](https://www.tc3.dev/posts/2021-11-02-extract-messages-from-signal/)
- [Query Signal Desktop messages locally from SQLite using JavaScript](https://vmois.dev/query-signal-desktop-messages-sqlite/)
- [The process of creating a new, encrypted database is called “keying” the database.](https://www.zetetic.net/sqlcipher/sqlcipher-api/#key)
- [signal-cli](https://github.com/AsamK/signal-cli)
