# Signal Desktop Development Guide

## Local development

Local development means running Signal Desktop from local files, it can be started with something like:

```shell
yarn install --frozen-lockfile # Install and build dependencies (this will take a while)
yarn generate                  # Generate final JS and CSS assets
yarn start                     # Start Signal!
```

(Taken from `CONTRIBUTING.md`.)

The first thing you'll have to to do is 'Set Up as Standalone Device' so that Signal Desktop thinks you're authenticated.

You won't have any contacts, though, so nobody to message.

### Setting up test data

> you can use the information from your production install of Signal Desktop to populate your testing application! -- `CONTRIBUTING.md`.

All that means is you can copy files from you production version to your test version:

```
~/.config/Signal -> ~/.config/Signal-development
```

This definitely means you now have messages, as they're stored in `~/.config/Signal/sql/db.sqlite`.

As far as everything else, I'm not yet sure.

### Unlinked -- Click to relink Signal Desktop to your mobile device to continue messaging.

When I use my production files, I can see my contacts and conversations, but I also get the message:

```shell
Unlinked -- Click to relink Signal Desktop to your mobile device to continue messaging.
```

That message is used by `DialogRelink.tsx`.

If you follow that, you end up at:

```ts
// ts/state/smart/LeftPane.tsx
import { isDone as isRegistrationDone } from "../../util/registration";

// ...

const hasRelinkDialog = !isRegistrationDone();
```

Where `isRegistrationDone` looks like:

```ts
// ts/util/registration.ts
export function isDone(): boolean {
  return window.storage.get("chromiumRegistrationDone") === "";
}
```

That message is shown when `window.storage.get("chromiumRegistrationDone")` is non-empty.

- [How 'Set Up as Standalone Device' works](./how/how-set-up-as-standalone-device-works.md)
- [How to run on Linux](./how//how-to-run-on-linux.md)

## Contacts

- [How contacts are loaded](./how/how-contacts-are-loaded.md)

## Conversations and messages

- [How to connect to database](./how/how-to-connect-to-database.md)

## Runtime configuration

See the files in `config`:

```shell
tree config
.config/
├── default.json
├── development.json
├── local-production.json
├── production.json
├── staging.json
├── test.json
└── test-lib.json
```

For example, `production.json`:

```json
{
  "serverUrl": "https://chat.signal.org",
  "storageUrl": "https://storage.signal.org",
  "directoryUrl": "https://cdsi.signal.org",
  "directoryMRENCLAVE": "0f6fd79cdfdaa5b2e6337f534d3baf999318b0c462a7ac1f41297a3e4b424a57",
  "cdn": {
    "0": "https://cdn.signal.org",
    "2": "https://cdn2.signal.org",
    "3": "https://cdn3.signal.org"
  },
  "sfuUrl": "https://sfu.voip.signal.org/",
  "challengeUrl": "https://signalcaptchas.org/challenge/generate.html",
  "registrationChallengeUrl": "https://signalcaptchas.org/registration/generate.html",
  "serverPublicParams": "AMhf5ywVwITZMsff/eCyudZx9JDmkkkbV6PInzG4p8x3VqVJSFiMvnvlEKWuRob/1eaIetR31IYeAbm0NdOuHH8Qi+Rexi1wLlpzIo1gstHWBfZzy1+qHRV5A4TqPp15YzBPm0WSggW6PbSn+F4lf57VCnHF7p8SvzAA2ZZJPYJURt8X7bbg+H3i+PEjH9DXItNEqs2sNcug37xZQDLm7X36nOoGPs54XsEGzPdEV+itQNGUFEjY6X9Uv+Acuks7NpyGvCoKxGwgKgE5XyJ+nNKlyHHOLb6N1NuHyBrZrgtY/JYJHRooo5CEqYKBqdFnmbTVGEkCvJKxLnjwKWf+fEPoWeQFj5ObDjcKMZf2Jm2Ae69x+ikU5gBXsRmoF94GXTLfN0/vLt98KDPnxwAQL9j5V1jGOY8jQl6MLxEs56cwXN0dqCnImzVH3TZT1cJ8SW1BRX6qIVxEzjsSGx3yxF3suAilPMqGRp4ffyopjMD1JXiKR2RwLKzizUe5e8XyGOy9fplzhw3jVzTRyUZTRSZKkMLWcQ/gv0E4aONNqs4P+NameAZYOD12qRkxosQQP5uux6B2nRyZ7sAV54DgFyLiRcq1FvwKw2EPQdk4HDoePrO/RNUbyNddnM/mMgj4FW65xCoT1LmjrIjsv/Ggdlx46ueczhMgtBunx1/w8k8V+l8LVZ8gAT6wkU5J+DPQalQguMg12Jzug3q4TbdHiGCmD9EunCwOmsLuLJkz6EcSYXtrlDEnAM+hicw7iergYLLlMXpfTdGxJCWJmP4zqUFeTTmsmhsjGBt7NiEB/9pFFEB3pSbf4iiUukw63Eo8Aqnf4iwob6X1QviCWuc8t0LUlT9vALgh/f2DPVOOmR0RW6bgRvc7DSF20V/omg+YBw==",
  "serverTrustRoot": "BXu6QIKVz5MA8gstzfOgRQGqyLqOwNKHL6INkv3IHWMF",
  "genericServerPublicParams": "AByD873dTilmOSG0TjKrvpeaKEsUmIO8Vx9BeMmftwUs9v7ikPwM8P3OHyT0+X3EUMZrSe9VUp26Wai51Q9I8mdk0hX/yo7CeFGJyzoOqn8e/i4Ygbn5HoAyXJx5eXfIbqpc0bIxzju4H/HOQeOpt6h742qii5u/cbwOhFZCsMIbElZTaeU+BWMBQiZHIGHT5IE0qCordQKZ5iPZom0HeFa8Yq0ShuEyAl0WINBiY6xE3H/9WnvzXBbMuuk//eRxXgzO8ieCeK8FwQNxbfXqZm6Ro1cMhCOF3u7xoX83QhpN",
  "backupServerPublicParams": "AJwNSU55fsFCbgaxGRD11wO1juAs8Yr5GF8FPlGzzvdJJIKH5/4CC7ZJSOe3yL2vturVaRU2Cx0n751Vt8wkj1bozK3CBV1UokxV09GWf+hdVImLGjXGYLLhnI1J2TWEe7iWHyb553EEnRb5oxr9n3lUbNAJuRmFM7hrr0Al0F0wrDD4S8lo2mGaXe0MJCOM166F8oYRQqpFeEHfiLnxA1O8ZLh7vMdv4g9jI5phpRBTsJ5IjiJrWeP0zdIGHEssUeprDZ9OUJ14m0v61eYJMKsf59Bn+mAT2a7YfB+Don9O",
  "updatesEnabled": true
}
```

# Questions

- How does test data setup work? For example `ts/test-mock/messaging/reaction_test.ts`
