# How contacts are loaded

I am choosing a small thing and trying to see if I can understand how it works.

For example, how does Signal load my contacts list?

I would like to know its relationship to the locally-stored data in `~/.config/Signal-development/`.

```shell
tree ~/.config/Signal-development/
/home/ben/.config/Signal-development/
├── blob_storage
│   └── bfa5c62e-ac28-4a2d-86be-6f4c2ebed547
├── Cache
│   └── Cache_Data
│       ├── bd897ffc05e61f17_0
│       ├── index
│       └── index-dir
│           └── the-real-index
├── Code Cache
│   ├── js
│   │   ├── index
│   │   └── index-dir
│   │       └── the-real-index
│   └── wasm
│       ├── index
│       └── index-dir
│           └── the-real-index
├── config.json
├── Crashpad
│   ├── attachments
│   ├── client_id
│   ├── completed
│   ├── new
│   ├── pending
│   └── settings.dat
├── databases
│   ├── Databases.db
│   └── Databases.db-journal
├── DawnGraphiteCache
│   ├── data_0
│   ├── data_1
│   ├── data_2
│   ├── data_3
│   └── index
├── DawnWebGPUCache
│   ├── data_0
│   ├── data_1
│   ├── data_2
│   ├── data_3
│   └── index
├── Dictionaries
│   └── en-US-10-1.bdic
├── ephemeral.json
├── GPUCache
│   ├── data_0
│   ├── data_1
│   ├── data_2
│   ├── data_3
│   └── index
├── IndexedDB
│   └── file__0.indexeddb.leveldb
│       ├── 000004.log
│       ├── 000005.ldb
│       ├── CURRENT
│       ├── LOCK
│       ├── LOG
│       └── MANIFEST-000001
├── Local Storage
│   └── leveldb
│       ├── 000003.log
│       ├── CURRENT
│       ├── LOCK
│       ├── LOG
│       ├── LOG.old
│       └── MANIFEST-000001
├── logs
│   ├── app.log
│   └── main.log
├── Network Persistent State
├── Preferences
├── Session Storage
│   ├── 000003.log
│   ├── CURRENT
│   ├── LOCK
│   ├── LOG
│   └── MANIFEST-000001
├── Shared Dictionary
│   ├── cache
│   │   ├── index
│   │   └── index-dir
│   │       └── the-real-index
│   ├── db
│   └── db-journal
├── SharedStorage
├── sql
│   └── db.sqlite
├── temp
├── Trust Tokens
├── Trust Tokens-journal
└── WebStorage
    ├── QuotaManager
    └── QuotaManager-journal

```

# How application is started

The Electron window is created in `app/main.ts`.

The Electron infrastructure creates Signal in `ts/windows/main/phase2-dependencies.ts`

```ts
// ts/windows/main/phase2-dependencies.ts
window.Signal = setup({
  Attachments,
  getRegionCode: () => window.storage.get("regionCode"),
  logger: log,
  userDataPath,
});
```

Where `setup` comes from `ts/signal.ts`.

```ts
// ts/signal.ts
export const setup = (options: {
  Attachments: AttachmentsModuleType;
  getRegionCode: () => string | undefined;
  logger: LoggerType;
  userDataPath: string;
}): SignalCoreType => {
  const { Attachments, getRegionCode, logger, userDataPath } = options;

  const Migrations = initializeMigrations({
    getRegionCode,
    Attachments,
    Type: TypesAttachment,
    VisualType: VisualAttachment,
    logger,
    userDataPath,
  });

  const Components = {
    ConfirmationDialog,
  };

  const Roots = {
    createApp,
    createSafetyNumberViewer,
  };

  const Services = {
    backups: backupsService,
    calling,
    initializeGroupCredentialFetcher,
    initializeNetworkObserver,
    initializeUpdateListener,

    // Testing
    storage,
  };

  const State = {
    Roots,
  };

  const Types = {
    Message: MessageType,

    // Mostly for debugging
    Address,
    QualifiedAddress,
  };

  return {
    Components,
    Crypto,
    Curve,
    // Note: used in test/index.html, and not type-checked!
    conversationControllerStart,
    Data,
    Groups,
    Migrations,
    OS,
    RemoteConfig,
    Services,
    State,
    Types,
  };
};
```

And `createApp` comes from `ts/state/roots/createApp.tsx`.

```ts
// ts/state/roots/createApp.tsx
// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReactElement } from "react";
import React from "react";
import { Provider } from "react-redux";

import type { Store } from "redux";

import { SmartApp } from "../smart/App";
import { SmartVoiceNotesPlaybackProvider } from "../smart/VoiceNotesPlaybackProvider";

export const createApp = (store: Store): ReactElement => (
  <Provider store={store}>
    <SmartVoiceNotesPlaybackProvider>
      <SmartApp />
    </SmartVoiceNotesPlaybackProvider>
  </Provider>
);
```

`window.Signal` has type `SignalCoreType`:

```ts
export type SignalCoreType = {
  AboutWindowProps?: AboutWindowPropsType;
  Crypto: typeof Crypto;
  Curve: typeof Curve;
  Data: typeof Data;
  DebugLogWindowProps?: DebugLogWindowPropsType;
  Groups: typeof Groups;
  PermissionsWindowProps?: PermissionsWindowPropsType;
  RemoteConfig: typeof RemoteConfig;
  ScreenShareWindowProps?: ScreenShareWindowPropsType;
  Services: {
    calling: CallingClass;
    backups: BackupsService;
    initializeGroupCredentialFetcher: () => Promise<void>;
    initializeNetworkObserver: (network: ReduxActions["network"]) => void;
    initializeUpdateListener: (updates: ReduxActions["updates"]) => void;
    retryPlaceholders?: RetryPlaceholders;
    lightSessionResetQueue?: PQueue;
    storage: typeof StorageService;
  };
  SettingsWindowProps?: SettingsWindowPropsType;
  Migrations: ReturnType<typeof initializeMigrations>;
  Types: {
    Message: typeof Message2;
    Address: typeof Address;
    QualifiedAddress: typeof QualifiedAddress;
  };
  Components: {
    ConfirmationDialog: typeof ConfirmationDialog;
  };
  OS: OSType;
  State: {
    Roots: {
      createApp: typeof createApp;
    };
  };
  conversationControllerStart: () => void;
  challengeHandler?: ChallengeHandler;
};
```

### Where does store come from?

```ts
// ts/background.ts
render(
  window.Signal.State.Roots.createApp(window.reduxStore),
  document.getElementById("app-container")
);
```

Where `window.reduxStore` comes from `ts/state/initializeRedux.ts`

```ts
// ts/state/initializeRedux.ts
const store = createStore(initialState);
window.reduxStore = store;
```

`createStore` from from `ts/state/createStore.ts`
