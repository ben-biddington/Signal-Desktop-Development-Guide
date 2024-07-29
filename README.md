# Signal Desktop Development Guide

Also [available as gitbook](https://bens-organization-24.gitbook.io/signal-desktop-development-guide/).

## Local development

Local development means running Signal Desktop from local files, it can be started with something like:

```shell
npm install       # Install and build dependencies (this will take a while)
npm run generate  # Generate final JS and CSS assets
npm test          # A good idea to make sure tests run first
npm start         # Start Signal!
```

### Set Up as Standalone Device

The first thing you'll have to to do is ['Set Up as Standalone Device'](https://github.com/signalapp/Signal-Desktop/blob/main/CONTRIBUTING.md#setting-up-standalone) so that Signal Desktop thinks you're authenticated.

You won't have any contacts, though, so nobody to message.

### Setting up test data

> you can use the information from your production install of Signal Desktop to populate your testing application! -- `CONTRIBUTING.md`.

All that means is you can copy files from you production version to your test version:

```
~/.config/Signal -> ~/.config/Signal-development
```

This definitely means you now have messages, as they're stored in `~/.config/Signal/sql/db.sqlite`.

As far as everything else, I'm not yet sure.

### Where is production version installed?

```shell
whereis signal-desktop
signal-desktop: /usr/bin/signal-desktop
```

### Starting with developer tools

(Yes this does work in production.)

```shell
# See: `defaultWebPrefs` in app/main.ts
/usr/bin/signal-desktop --enable-dev-tools
```

[More switches](https://www.electronjs.org/docs/latest/api/command-line-switches).

## Contacts

- [How contacts are loaded](./how/how-contacts-are-loaded.md)

## Conversations and messages

- [How to connect to database](./how/how-to-connect-to-database.md)

## Debugging

### Logs

For tests find logs at something like: `/tmp/mock-signal-XXXXXXQZedmQ/logs/main.log`.

### Where is `window.Signal`?

When debugging, `window.Signal` is not available to the developer console. Why?

`window.Signal` is assigned in `ts/windows/main/phase2-dependencies.ts` which is part of the `Electron` preload.

This is because of [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation).

# Terminology

- PNI: Phone Number Identity
- ACI: Account Identity
- e164: [defines a general format for international telephone numbers](https://en.wikipedia.org/wiki/E.164).
