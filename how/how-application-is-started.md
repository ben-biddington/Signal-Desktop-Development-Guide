# How application is started

`Signal-Desktop` is an Electron application which is started in development mode by:

```shell
yarn start
```

Which just invokes electron:

```shell
electron .
```

1. [node] `electron .` executes `app/main.ts`
1. [node] `app/main.ts` -> `import { app } from 'electron';`
1. [node] `app/main.ts` -> `app.on('ready')`
1. [node] `app/main.ts` `app.on('ready')` -> `createWindow`
1. [node] `app/main.ts` `createWindow` configures preload script `ts/windows/main/preload.ts`
1. [browser] `app/main.ts` -> `createWindow` -> `mainWindow = new BrowserWindow(windowOptions);`
1. [browser] `app/main.ts` -> `createWindow` -> `mainWindow.loadURL('background.html')`
1. [node] [preload] `ts/windows/main/preload.ts` calls `ts/windows/main/start.ts`
1. [node] [preload] `ts/windows/main/start.ts` assigns and exposes window-scoped variables like `window.Signal`
1. [browser] `background.html` -> `window.startApp();`
1. [browser] `ts/background.ts` -> `startApp`

The application can be thought of in two parts: the `electron` part and the browser part.

Dependencies are configured mostly as part of preload (`ts/windows/main/start.ts`), but `ts/background.ts` also assigns some window variables:

```shell
grep -Eir "window\..+ = " ../Signal-Desktop/ts/background.ts

window.textsecure.storage.protocol = new window.SignalProtocolStore();
window.Signal.Services.lightSessionResetQueue = lightSessionResetQueue;
window.Whisper.deliveryReceiptQueue = new PQueue({
window.Whisper.deliveryReceiptBatcher = createBatcher<Receipt>({
window.setImmediate = window.nodeSetImmediate;
window.document.title = window.getTitle();
window.getSocketStatus = () => {
window.getAccountManager = () => {
window.textsecure.server = server;
window.textsecure.messaging = new window.textsecure.MessageSender(server);
window.Signal.challengeHandler = challengeHandler;
window.Events = createIPCEvents({
window.Signal.Services.retryPlaceholders = retryPlaceholders;
window.Whisper.events.on('userChanged', (reconnect = false) => {
window.getSyncRequest = (timeoutMillis?: number) => {
window.waitForEmptyEventQueue = waitForEmptyEventQueue;
window.startApp = startApp;
```

## Preload: `ts/windows/main/start.ts`

Preload is registered with `electron` in `createWindow` (`app/main.ts`) and [runs in a context that has access to both the HTML DOM and a limited subset of Node.js and Electron APIs](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload).

```ts
// app/main.ts
preload: join(
        __dirname,
        usePreloadBundle
          ? '../preload.bundle.js'
          : '../ts/windows/main/preload.js'
      ),
```

`ts/windows/main/preload.ts` just loads `ts/windows/main/start.ts`.

1. `ts/windows/main/preload.ts`
1. `ts/windows/main/start.ts`
1. `ts/windows/main/phase2-dependencies.ts` which assigns `window.Signal` (among many other window-scoped variables).

```ts
// ts/windows/main/phase2-dependencies.ts
window.Signal = setup({
  Attachments,
  getRegionCode: () => window.storage.get("regionCode"),
  logger: log,
  userDataPath,
});
```

### `app/main.ts`

<img src="../assets/architecture/electron-app-architecture.png" />

## Browser startup: `window.startApp` (`ts/background.ts`)

See `ts/background.ts`. This is where the initialization for the browse part happens.

### Assign window variables

(Some variables like `window.Signal` and `window.textsecure` have already been assigned by preload.)

```shell
grep -Eir "window\..+ = " ../Signal-Desktop/ts/background.ts

window.textsecure.storage.protocol = new window.SignalProtocolStore();
window.Signal.Services.lightSessionResetQueue = lightSessionResetQueue;
window.Whisper.deliveryReceiptQueue = new PQueue({
window.Whisper.deliveryReceiptBatcher = createBatcher<Receipt>({
window.setImmediate = window.nodeSetImmediate;
window.document.title = window.getTitle();
window.getSocketStatus = () => {
window.getAccountManager = () => {
window.textsecure.server = server;
window.textsecure.messaging = new window.textsecure.MessageSender(server);
window.Signal.challengeHandler = challengeHandler;
window.Events = createIPCEvents({
window.Signal.Services.retryPlaceholders = retryPlaceholders;
window.Whisper.events.on('userChanged', (reconnect = false) => {
window.getSyncRequest = (timeoutMillis?: number) => {
window.waitForEmptyEventQueue = waitForEmptyEventQueue;
window.startApp = startApp;

```

### Mount React view

The `React` part is started in `ts/background.ts`:

```ts
// Around line 1455
render(
  window.Signal.State.Roots.createApp(window.reduxStore), // `createApp` => `ts/state/roots/createApp.tsx`
  document.getElementById("app-container")
);
```

### window.storage

Looks like:

```ts
export type IStorage = StorageInterface & {
  user: User;
  protocol: SignalProtocolStore;
  init: () => Promise<void>;
  fetch: () => Promise<void>;
  reset: () => void;
  getItemsState: () => Partial<StorageAccessType>;
};
```

`window.textsecure.storage` is by default set to an instance of `Storage` (`ts/textsecure/Storage.ts`) and is implemented in terms of

- `Data` (sql)
- `window.Signal.Data`
- `window.reduxActions`

#### How is database initialised?

1. `MainSQL` (`ts/sql/main.ts`)
1. `on('message')` (`ts/sql/mainWorker.ts`)
1. `initialize` (`ts/sql/Server.ts`)

```ts
// ts/sql/main.ts
constructor() {
  const scriptDir = join(app.getAppPath(), 'ts', 'sql', 'mainWorker.js');
  this.worker = new Worker(scriptDir);
  //...
}
```

### window.storage.onready

This is where a server connection is opened and monitored for changes like new messages or contacts.

It also assigns `window.Events` which is how messages are sent to the back end of the `electron` application.

#### MessageReceiver: Event handlers

`ts/background.ts` maintains a local instance of `MessageReceiver` which represents a socket connection to `Signal` servers.

`ts/background.ts` listens for events and performs actions in response, for example `contactSync`.

```ts
// ts/background.ts
messageReceiver.addEventListener(
  "contactSync",
  queuedEventListener(onContactSync)
);
```

There are about 30 of these events.

## Where is `window.reduxStore` assigned?

1. `setupAppState` (`ts/background.ts`) -> `startApp` -> `window.storage.onready` -> `setupAppState` -> `initializeRedux`
1. `initializeRedux` (`ts/state/initializeRedux.ts`)

## ConversationController

`ConversationController` is quite an important class. It is initialised with `start` (`ts/ConversationController.ts`):

```ts
// ts/ConversationController.ts

// We have to run this in background.js, after all backbone models and collections on
//   Whisper.* have been created. Once those are in typescript we can use more reasonable
//   require statements for referencing these things, giving us more flexibility here.
export function start(): void {
  const conversations = new window.Whisper.ConversationCollection();

  window.ConversationController = new ConversationController(conversations);
  window.getConversations = () => conversations;
}
```

As the comment reads, `start` at a point after `window.Whisper.ConversationCollection` has been assigned.

`start` is called from `ts/windows/main/start.ts` which is part of the preload sequence.

```ts
import { start as startConversationController } from "../../ConversationController";

// ...

startConversationController();

//..
```

Initialised in `ts/windows/main/start.ts` by calling `start` in `ts/ConversationController.ts`.

### SignalCoreType.conversationControllerStart not used (except for tests?)

Note that `SignalCoreType.conversationControllerStart` is not called anywhere. There is this comment:

```ts
// ts/signal.ts
// Note: used in test/index.html, and not type-checked!
conversationControllerStart: _conversationControllerStart,
```

## `window.reduxStore.getState().app.hasInitialLoadCompleted`

`hasInitialLoadCompleted` is set by `ts/background.ts` using `window.reduxActions.app.initialLoadComplete();`.

This is called from `onEmpty` which is **only** referenced in these places:

- in response to the `empty` `messageReceiver` event
- in `onOffline`
- in `unlinkAndDisconnect`

So what happens in practice must be that the server raises the `empty` event at some point.

# How application is started under test

For example:

```shell
npm run generate && PAUSE=1 mocha --require ts/test-mock/setup-ci.js ts/test-mock/messaging/image_test.js --timeout 360000
```

The applciation is started with:

```ts
// ts/test-mock/bootstrap.ts, function `start`
this.privApp = await electron.launch({
  executablePath: this.options.main,
  args: this.options.args.slice(),
  env: {
    ...process.env,
    MOCK_TEST: "true",
    SIGNAL_CI_CONFIG: this.options.config,
  },
  locale: "en",
  timeout: 30 * SECOND,
});
```

where the configuration looks like:

```json
{
  "executablePath": "/home/ben/sauce/Signal-Desktop/node_modules/.bin/electron",
  "args": ["/home/ben/sauce/Signal-Desktop/ci.js"],
  "env": {
    "PAUSE": "1",
    "SHELL": "/bin/bash",
    "SESSION_MANAGER": "local/bang:@/tmp/.ICE-unix/2483,unix/bang:/tmp/.ICE-unix/2483",
    "QT_ACCESSIBILITY": "1",
    "COLORTERM": "truecolor",
    "XDG_CONFIG_DIRS": "/etc/xdg/xdg-ubuntu:/etc/xdg",
    "SSH_AGENT_LAUNCHER": "gnome-keyring",
    "NVM_INC": "/home/ben/.nvm/versions/node/v20.15.0/include/node",
    "XDG_MENU_PREFIX": "gnome-",
    "no_proxy": "localhost,127.0.0.0/8,::1",
    "GNOME_DESKTOP_SESSION_ID": "this-is-deprecated",
    "LANGUAGE": "en_US:en",
    "LC_ADDRESS": "en_NZ.UTF-8",
    "GNOME_SHELL_SESSION_MODE": "ubuntu",
    "LC_NAME": "en_NZ.UTF-8",
    "SSH_AUTH_SOCK": "/run/user/1000/keyring/ssh",
    "XMODIFIERS": "@im=ibus",
    "DESKTOP_SESSION": "ubuntu",
    "LC_MONETARY": "en_NZ.UTF-8",
    "GTK_MODULES": "gail:atk-bridge",
    "ZEITGEIST_DATA_PATH": "/home/ben/.local/share/zeitgeist",
    "PWD": "/home/ben/sauce/Signal-Desktop",
    "NIX_PROFILES": "/nix/var/nix/profiles/default /home/ben/.nix-profile",
    "XDG_SESSION_DESKTOP": "ubuntu",
    "LOGNAME": "ben",
    "QT_QPA_PLATFORMTHEME": "appmenu-qt5",
    "XDG_SESSION_TYPE": "wayland",
    "NIX_PATH": "/home/ben/.nix-defexpr/channels",
    "SYSTEMD_EXEC_PID": "4333",
    "XAUTHORITY": "/run/user/1000/.mutter-Xwaylandauth.GFAWQ2",
    "HOME": "/home/ben",
    "USERNAME": "ben",
    "IM_CONFIG_PHASE": "1",
    "LC_PAPER": "en_NZ.UTF-8",
    "LANG": "en_US.UTF-8",
    "LS_COLORS": "rs=0:di=01;34:ln=01;36:mh=00:pi=40;33:so=01;35:do=01;35:bd=40;33;01:cd=40;33;01:or=40;31;01:mi=00:su=37;41:sg=30;43:ca=30;41:tw=30;42:ow=34;42:st=37;44:ex=01;32:*.tar=01;31:*.tgz=01;31:*.arc=01;31:*.arj=01;31:*.taz=01;31:*.lha=01;31:*.lz4=01;31:*.lzh=01;31:*.lzma=01;31:*.tlz=01;31:*.txz=01;31:*.tzo=01;31:*.t7z=01;31:*.zip=01;31:*.z=01;31:*.dz=01;31:*.gz=01;31:*.lrz=01;31:*.lz=01;31:*.lzo=01;31:*.xz=01;31:*.zst=01;31:*.tzst=01;31:*.bz2=01;31:*.bz=01;31:*.tbz=01;31:*.tbz2=01;31:*.tz=01;31:*.deb=01;31:*.rpm=01;31:*.jar=01;31:*.war=01;31:*.ear=01;31:*.sar=01;31:*.rar=01;31:*.alz=01;31:*.ace=01;31:*.zoo=01;31:*.cpio=01;31:*.7z=01;31:*.rz=01;31:*.cab=01;31:*.wim=01;31:*.swm=01;31:*.dwm=01;31:*.esd=01;31:*.jpg=01;35:*.jpeg=01;35:*.mjpg=01;35:*.mjpeg=01;35:*.gif=01;35:*.bmp=01;35:*.pbm=01;35:*.pgm=01;35:*.ppm=01;35:*.tga=01;35:*.xbm=01;35:*.xpm=01;35:*.tif=01;35:*.tiff=01;35:*.png=01;35:*.svg=01;35:*.svgz=01;35:*.mng=01;35:*.pcx=01;35:*.mov=01;35:*.mpg=01;35:*.mpeg=01;35:*.m2v=01;35:*.mkv=01;35:*.webm=01;35:*.webp=01;35:*.ogm=01;35:*.mp4=01;35:*.m4v=01;35:*.mp4v=01;35:*.vob=01;35:*.qt=01;35:*.nuv=01;35:*.wmv=01;35:*.asf=01;35:*.rm=01;35:*.rmvb=01;35:*.flc=01;35:*.avi=01;35:*.fli=01;35:*.flv=01;35:*.gl=01;35:*.dl=01;35:*.xcf=01;35:*.xwd=01;35:*.yuv=01;35:*.cgm=01;35:*.emf=01;35:*.ogv=01;35:*.ogx=01;35:*.aac=00;36:*.au=00;36:*.flac=00;36:*.m4a=00;36:*.mid=00;36:*.midi=00;36:*.mka=00;36:*.mp3=00;36:*.mpc=00;36:*.ogg=00;36:*.ra=00;36:*.wav=00;36:*.oga=00;36:*.opus=00;36:*.spx=00;36:*.xspf=00;36:",
    "XDG_CURRENT_DESKTOP": "ubuntu:GNOME",
    "VTE_VERSION": "6800",
    "WAYLAND_DISPLAY": "wayland-0",
    "NIX_SSL_CERT_FILE": "/etc/ssl/certs/ca-certificates.crt",
    "DENO_INSTALL": "/home/ben/.deno",
    "GNOME_TERMINAL_SCREEN": "/org/gnome/Terminal/screen/df6600a5_df30_46c8_bf66_7eda143ed718",
    "DOTNET_BUNDLE_EXTRACT_BASE_DIR": "/home/ben/.cache/dotnet_bundle_extract",
    "NVM_DIR": "/home/ben/.nvm",
    "GNOME_SETUP_DISPLAY": ":1",
    "LESSCLOSE": "/usr/bin/lesspipe %s %s",
    "XDG_SESSION_CLASS": "user",
    "TERM": "xterm-256color",
    "LC_IDENTIFICATION": "en_NZ.UTF-8",
    "LESSOPEN": "| /usr/bin/lesspipe %s",
    "USER": "ben",
    "NO_PROXY": "localhost,127.0.0.0/8,::1",
    "GNOME_TERMINAL_SERVICE": ":1.136",
    "DISPLAY": ":0",
    "SHLVL": "1",
    "NVM_CD_FLAGS": "",
    "LC_TELEPHONE": "en_NZ.UTF-8",
    "QT_IM_MODULE": "ibus",
    "LC_MEASUREMENT": "en_NZ.UTF-8",
    "XDG_RUNTIME_DIR": "/run/user/1000",
    "LC_TIME": "en_NZ.UTF-8",
    "XDG_DATA_DIRS": "/usr/share/ubuntu:/home/ben/.local/share/flatpak/exports/share:/var/lib/flatpak/exports/share:/usr/local/share/:/usr/share/:/var/lib/snapd/desktop",
    "PATH": "/home/ben/.cargo/bin:/home/ben/.deno/bin:/home/ben/.nvm/versions/node/v20.15.0/bin:/home/ben/.nix-profile/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin:/snap/bin:/home/ben/.dotnet/tools:~/sauce/adr-tools/src:~/sauce/pottery/src",
    "GDMSESSION": "ubuntu",
    "DBUS_SESSION_BUS_ADDRESS": "unix:path=/run/user/1000/bus",
    "NVM_BIN": "/home/ben/.nvm/versions/node/v20.15.0/bin",
    "LC_NUMERIC": "en_NZ.UTF-8",
    "OLDPWD": "/home/ben",
    "_": "/usr/bin/mocha",
    "MOCK_TEST": "true",
    "SIGNAL_CI_CONFIG": "{\"certificateAuthority\":\"-----BEGIN CERTIFICATE-----\\nMIIFwDCCA6igAwIBAgIUH4s+Chj0H/rJGlds6A9JcN9f5BowDQYJKoZIhvcNAQEL\\nBQAwgY8xCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJDQTELMAkGA1UEBwwCTEExFDAS\\nBgNVBAoMC1NpZ25hbCBNb2NrMRQwEgYDVQQLDAtTaWduYWwgTW9jazEXMBUGA1UE\\nAwwOU2lnbmFsIE1vY2sgQ0ExITAfBgkqhkiG9w0BCQEWEmluZHV0bnlAc2lnbmFs\\nLm9yZzAgFw0yMjAyMjgxOTU2NDBaGA8yMTIyMDIwNDE5NTY0MFowgY8xCzAJBgNV\\nBAYTAlVTMQswCQYDVQQIDAJDQTELMAkGA1UEBwwCTEExFDASBgNVBAoMC1NpZ25h\\nbCBNb2NrMRQwEgYDVQQLDAtTaWduYWwgTW9jazEXMBUGA1UEAwwOU2lnbmFsIE1v\\nY2sgQ0ExITAfBgkqhkiG9w0BCQEWEmluZHV0bnlAc2lnbmFsLm9yZzCCAiIwDQYJ\\nKoZIhvcNAQEBBQADggIPADCCAgoCggIBAM3E82nXdDLWjATjl9cWHwSmstUERDCE\\niZwHC2CVXxZalKo0knXDvBCbBDnenG5gaYzJVZ8s1+Vk4K193E1LDNkBuSCfnyMg\\ngvlNs2PSrIMy2Is8Vi+81dD2J4MBoHSCxPFO6pJQLahjbwyuFnAyffgapfHKnBbL\\n4zmMcd/hyYjswFZrqbdwm2DBrsJLl//vfveR+E72o9qLggIlVpP9Hii8aU9KOD1p\\nkE2dMkogfhhyfFFOCOOVZU/i9azYBVgicZxT1rj+O3LAwoHNMo2H0koa77WqaFbf\\ngqqTpm8yfSLXwWeVv4190I5R8yM/kWnt+/HsBc233wm3WyMJ26WQbQ5FYFwMOMPY\\nRoNY6KKBzpYKC6UUxlPUqeIKQzwGDOq4CPrjY1YyWXkszDNdT/GSJ2YPMY7P4ehF\\nArw+mGLjmoqwRNSPdasU6B/y3VfAK14MHqPuM+rlBv27QiYKN12dICq4q7tITdpd\\nF0Qy0WLuI1XXEsH+mToPzi1yvfwEwru0jCder0CCzD18ifeYQEorWf1oaNfuVHL/\\ne5Y5N0ST04oV2/GsNPlGNWgpEdKQxu3kQBDEwZHXnRgxGVCZXTQNzBQkTFJyLpnz\\n5ns8W4T+OJhLSV6bktqUpWbwRB0S1RYg09sP5z5qeCFdII4zlk4pcicmIQc5NwL2\\nxyPie+VNHvEFAgMBAAGjEDAOMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQELBQAD\\nggIBAI6Oskw0by2g1pmjU53eTqrFt4Rai2BJeUzPM3iUj6OBgB7IiXiwFdxWSLTL\\nSvkW7SSKOtX0Uc246qrRUStw9CPWdHBdm4LiMTgVFIFXJ0wq5oEZwrNfmV9Yqjo4\\nPhgQfaAvObB6M8b/yntMQWEHT0u+oBdXEmnCYZZzLN84KeW74p2VRmqjWejtSC3g\\n4HR+tMhALmUUibyVCTMHEEWUe4ohi0DMjCs2/7lRoTCy8YVC7tHgYAPb1S6pS5BL\\nVZfOeDjWcqx6UI1JBJXnpUCMNUO6VW14slK92vSPOKoS9tpx4JatI02QSWA4T/Nf\\nuXMXvTskDKegvNn8hIaXqOct0FpdtoG30MKU606N9Rxnk5p0RNfsMbdu4we47G4J\\nD9KWxBRGh2RkCl6HLcJlm+TFsQQE1xxYcaXa/icIOrDhlWvkrwj/VZxhgMQoRNBb\\n+UyCD/meUxUaEDvBBlbp9gVpAqr5mIiIPdKGsgMZY63mGGWujlPXA0OC9cC+FtMU\\nU9xqkvgBKNs6LaLdK9AUjQq3VYaCoi3Y9lGdkjIP2s5TQ7CuWbGSmoGA439l7qo3\\ngbKNhQ48VehfGKPPFOdD23U1cK+/KjqT6X3S0/AvWfaNEwVo8fNaP4j4FrWz3fRy\\nef8JpIuJ1HKPBaadOw0RZy41liJGwQ0coF9HG/2Sxb7S+OgP\\n-----END CERTIFICATE-----\\n\",\"genericServerPublicParams\":\"AECVlQS3SWJhGYfCwjClt7j152IXKTU34hmO3BvUtLoqLu+jpZz5cy2jQhZolDshs69FpKpZhwgjPsPvwd15+FDaP7AdQNAUwyLEjtPE88Z/XTN6CLzKqpDdXhx9muyQYsrtPtGqrDscRspE4w2aVsEAUlOeNoDKPf7UnQjBiwFDTC2I/kQV638NBY40q4HLXHx/uo1MOhVmUar5na6VzCcS63VUv8+zzUbt51jN/QW5UtQtQ2wTtOpemdAZHuyVO/7t6DOQ+vJUBvxFXdnS00c2u3mZqW0CilGcXkXfQ+pF\",\"serverPublicParams\":\"AJDe7g7oQkqEQ49VC9kgsoYt4MYPX5vbdFcB5f5cQbtS4J2jT1D6LLeuALsoaStyMPRxzevM0lQNG8bwMFXoSGnglxGDgI9e157eOgENVDNZfXbiyUCOw1X/ANxIIyk4ePL4040+7vOLkkYAfrmgNUry4WMNHl9j8bYIH54jaexgCM+Wq2udlK9ox27gvVe2GqajGKnlhbWG2w6deNWR70m4OZb1Cb7pmxY1XCDxSl0R039mbmSnJ5qPsWHQpvMCUr5GISdtIouvlViUkoftAo0Ihg2Noyn1SryVW3niOd5egKNBn2GnI+xaKljIz8PlCVS715TcptVFqkEaHAJCRwyUYAW7ly8T0wdlNBzZBSsNHOvs4bM9X+IBkMHPF0wdZ2jFW6VuM64QZpF9Yxp814ekeJr9t9N/Dxytfuth1NJnYEXy0R3GupJKpYK7Gz14MIMlZBh5JUKX7YGhFSEth2ji3r5aZLl0AcsePb5vDFSRPk+Bshszh+rGcdka4wPuD3LHJr1eSoBEPPMd6WiN9EoH6+cFGrq0vmR4Rt0f8RAVOOsfFJb9418T+qI9VFHsErkJmjSB5YN7igRCarhG1VbYbZ5UmxtjEq/wy2/0FvPaLfscuvyfYpIsmqltiE/AfmYFk9tYJUSZqUoUT6a88roUK5UErGE1nhtMJsbj+kJbZivt5yEEpFszyRctg4AkOrpcUWijn5sd3YsmpXOzlQ6IoD6UTIETOtQRIU+8gZoV/J919KLd9w76BAGTbFEzcUSZslbJXjqS7A4Z7sjryaDFRpUq00C3msQABkY4XqZNeO7vdIZIMURAHNgDjGSHdv7myFYcev09UwmP82uiE2w21Ggas+Zsfrze307HUOFppdrlYMk7V2NAbOG97au2Hg==\",\"serverTrustRoot\":\"BZ8zqn+/bbZcpoKqnvkHXvoTI+n9o/Iuc9kpVog2ZEYs\",\"forcePreloadBundle\":false,\"ciMode\":\"full\",\"buildExpiration\":1724115632613,\"storagePath\":\"/tmp/mock-signal-XXXXXXy7PMNm\",\"storageProfile\":\"mock\",\"serverUrl\":\"https://127.0.0.1:38779\",\"storageUrl\":\"https://127.0.0.1:38779\",\"sfuUrl\":\"https://127.0.0.1:38779\",\"cdn\":{\"0\":\"https://127.0.0.1:38779\",\"2\":\"https://127.0.0.1:38779\"},\"updatesEnabled\":false,\"directoreType\":\"cdsi\",\"directoryCDSIUrl\":\"https://127.0.0.1:38779\",\"directoryCDSIMRENCLAVE\":\"51133fecb3fa18aaf0c8f64cb763656d3272d9faaacdb26ae7df082e414fb142\"}"
  },
  "locale": "en",
  "timeout": 30000
}
```

So it is doing the same as `npm run start`, only it is setting config first.

```js
// ci.js
// Copyright 2022 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

const CI_CONFIG = JSON.parse(process.env.SIGNAL_CI_CONFIG || "");

const config = require("./app/config").default;

config.util.extendDeep(config, CI_CONFIG);

require("./app/main"); // Same as `npm run start`
```

### What does `MOCK_TEST` do?
