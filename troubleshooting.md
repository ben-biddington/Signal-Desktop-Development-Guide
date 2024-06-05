## Error: getaddrinfo ENOTFOUND create.signal.art

5-Jun-2024

```shell
$ yarn generate && yarn start
yarn run v1.22.10
$ npm-run-all build-protobuf build:esbuild build:dns-fallback build:icu-types build:compact-locales sass get-expire-time copy-components
$ yarn build-module-protobuf
$ pbjs --target static-module --force-long --no-typeurl --no-verify --no-create --no-convert --wrap commonjs --out ts/protobuf/compiled.js protos/*.proto && pbts --no-comments --out ts/protobuf/compiled.d.ts ts/protobuf/compiled.js
$ node scripts/esbuild.js
$ node ts/scripts/generate-dns-fallback.js
Error: getaddrinfo ENOTFOUND create.signal.art
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:118:26) {
  errno: -3007,
  code: 'ENOTFOUND',
  syscall: 'getaddrinfo',
  hostname: 'create.signal.art'
}
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
ERROR: "build:dns-fallback" exited with 1.
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```

```shell
grep -Eir create.signal.art ../Signal-Desktop
../Signal-Desktop/build/dns-fallback.json:    "domain": "create.signal.art",
../Signal-Desktop/ts/scripts/generate-dns-fallback.js:  "create.signal.art"
../Signal-Desktop/ts/scripts/generate-dns-fallback.ts:  'create.signal.art',
../Signal-Desktop/ts/util/createHTTPSAgent.js:  "create.signal.art",
../Signal-Desktop/ts/util/createHTTPSAgent.ts:  'create.signal.art',
../Signal-Desktop/preload.bundle.js:      "create.signal.art",

```

Not quite sure what's going on here, but it does appear `create.signal.art` is not available:

```shell
$ ping create.signal.art
ping: create.signal.art: No address associated with hostname
```

Other hosts work:

```shell
$ ping sfu.voip.signal.org -c 3
PING sfu.voip.signal.org(2600:1901:0:feb2:: (2600:1901:0:feb2::)) 56 data bytes
64 bytes from 2600:1901:0:feb2:: (2600:1901:0:feb2::): icmp_seq=1 ttl=119 time=46.8 ms
64 bytes from 2600:1901:0:feb2:: (2600:1901:0:feb2::): icmp_seq=2 ttl=119 time=46.7 ms
64 bytes from 2600:1901:0:feb2:: (2600:1901:0:feb2::): icmp_seq=3 ttl=119 time=48.8 ms

--- sfu.voip.signal.org ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2004ms
rtt min/avg/max/mdev = 46.701/47.433/48.761/0.940 ms

```

Can fix by editing:

```diff
ben@bang:~/sauce/Signal-Desktop$ git diff ts/scripts/generate-dns-fallback.ts
diff --git a/ts/scripts/generate-dns-fallback.ts b/ts/scripts/generate-dns-fallback.ts
index dec7023df..39f442f4b 100644
--- a/ts/scripts/generate-dns-fallback.ts
+++ b/ts/scripts/generate-dns-fallback.ts
@@ -20,7 +20,6 @@ const FALLBACK_DOMAINS = [
   'cdn3.signal.org',
   'updates2.signal.org',
   'sfu.voip.signal.org',
-  'create.signal.art',
 ];

 async function main() {

```

And re-running:

```shell
$ npm run build:esbuild && npm run build:dns-fallback
```
