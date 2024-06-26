# How 'Set Up as Standalone Device' works

In order to get Signal Desktop running locally, you need to be able to connect it to a phone.

When running locally, it does not connect to production so connecting with your real account cannot work.

Instead you can do this, (from the contributing guide):

> You don't have to link the app with your phone. On the QR code screen, you can
> select 'Set Up as Standalone Device' from the File menu, which goes through the
> registration process like you would on a phone.

Setting up as a standalone device lets you receive a code to your phone to allow you to log in. Part of that process involves completing a captcha.

## Captcha

After entering a phone number, your browser opens and you are shown a captcha at:

```
https://signalcaptchas.org/staging/registration/generate
```

## The `signalcaptcha://` redirect

After completing it successfully, your browser is redirected to a URL like:

```
signalcaptcha://signal-hcaptcha.5fad97ac-7d06-4e44-b18a-b950b20148ff.registration.P1_eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.hadwYXNza2V5xQUbS95FbOcFTymWcwlkiuDMCmWDB0NLU3YFf4qbyg1UE6QKu1JcP7hchWLwSaoufylLIMSYjGWJhRJGxt4PnR03wTUwst3kwhcedjHwCGfpWSTTRx3t_oQm5FNvnhkmjEWojiBL87cIoqgzd-n5gmoOEB7Byg1YhYEorfrGViQQ0dV8BvOo2SR1S7lXFbGJZrEgWwoE43yessXEgWdPHR8vWH110BkEZXjSic-32ozO4W8PGNlixo16g-6MqWGOwKrgOVS8rjtD4EaG6fru3kSpl75htnrU6jX03587HkTzaB1s8W5p64pgVJIdmmzgl8LUzpuxokXwVCiM3UOVh7ps44-ZwA3427h1cQWgOtRBf5yxEiSBm-FNHqGAQPn0wFOS4C8qCcFMYLqDImgihOsnNVbzpHPLUr1Xq_nEkJzdCeumV1yKHRyqU5u9-Oo2Aqg1Il1ZHKyRH0tDrBU8Wzhyu2nFUXuATp0ezHt4da0MoZrM1HpD5Sv4ZvmPi-faW5f2Q9hlEAGw3J-wsIAt6xbdqo3QRR-aa8BF6lLEb8OD-gt5SgVSZbJno-LBO5-tIFUrn_yxOCT1aRCQor8GphkypQFAiI70-VR95cbCHQi4B9JQ4BhNrzQPADbbyrxNeGEI4NDh1sjk3lGM6QG4z9UJfF9fsVvCyyRB53UtWUWRU6xxfSXY0yxHykU8kDiCh5IbW19DqZuRejRNkznYaTs-jMknjOVi7OfbI_cyFl7Roks3C1WEXpVTY1Ipd37QQvOhidfKZqCs20wQUX84Y-X4qpb5Q7OdYZYouGVDUjBKRe48c1xUw6tT8drmwe_iksg13ElfxviEEQ84syK_gzFLYRfJYuEttHGC88H8KuKQ_AsP66w0yBCoHTYFjlJurUvSraw-Uf2K4acbbpg4MyBD4VIiycNr3YDwbhyqDx0TvYCsK-uS3OBAiyxtlDYMZGc3UntkB7zsZz8N6_EUgdUG8zh4h_8rCKzzyn7Uq-rQwSQ9hJdy-WC07kIIEQUbotMF2hafex04vrslrs5HXGnV9YaecJHZJjx_VN5KBHVNhvt7gLYWbJuFeco38CmXHaNxJspLLS1qVNWh8WbbAivKNIW2GP0oTy_LZmbRIraNizTjW7_fqxtjVPOBzQEXzC3V72uAYEqDJ0lcZQWwB8NRgosVxGEQv3T7Roy35OkaXGW9V555S1k3Rmk_5Qsn9swLEzansp3ga7rm3DyOYwLrskYkYQ6otvq0xZfJH_nSVDHJOznJ7ktmhgseP7qYVmf88PXlFxQntCkhRF6ZeQ2fMDSdHT1WkfiNWc0GAXdb1dRC5vFeQFaMDLKQlvjvLLvOcY8JswGJVVXkX8l4hiWnjeMtNI3cImGnyHfNwEkMb3ru27tbnxb6jdDPxSJA-y-qx-rTQF3WPR7qmFLNSuru2_Fv4G644ttSGuwSkZG6Y-9ea96hY-vZvKgZG9oZC5bd9ZWOCzCmaorGsmzWvralrUGX8bI2Qjm-q6AanpToq5AZAXNm85ArrQoydyW6fqjbGup5aKtauGPpsKerzaBmqYWiYLp8fE9m-dPZGIZWAcPZpqPSRZuIMl_SMivu0oksPzBtzj07anpLM5JqEY9DGGUzFfwknp_wBE5b0c5ekdlf_zHRv6dZa8gJaPktDw9T3UMSY1wGRtuwYBFg4YqXfBm3r9rqAnswS3k5tmcvUM_uO_NgJhyjZ-oRDe5gl54bR2kXsghRz-vgeWGjZXhwzmZX9OOoc2hhcmRfaWTOD3Lqb6JrcqgyYTRjYzQyZaJwZAA.X3X2ncwx6a9zTzM0flxYmp7jfJg0Ag8DFSNLWbQPuSA
```

If Signal is registered on your machine as a handler for any URL having protocol `signalcaptcha://`, then it will be passed this entire string.

This is how Signal continues the 'Set Up as Standalone Device' workflow. The next step is to send an SMS with a code that can then be pasted back into to UI.

This registration is done in `app/main.ts`.

```ts
// app/main.ts
app.setAsDefaultProtocolClient("signalcaptcha");
```

> [setAsDefaultProtocolClient] Sets the current executable as the default handler for a protocol (aka URI scheme). It allows you to integrate your app deeper into the operating system. Once registered, all links with your-protocol:// will be opened with the current executable. The whole link, including protocol, will be passed to your application as a parameter.

### Registration with `setAsDefaultProtocolClient` does not work on Linux (?)

In practice I have found that instead of the development version of Signal handling the redirect after captcha, my installed production version is opened instead.

This means I cannot sign in at all.

It seems as though `setAsDefaultProtocolClient` is not working.

This may be [a linux problem](https://github.com/electron/electron/issues/40685).

[The change mentioned in that ticket above](https://github.com/witcher112/electron-app-universal-protocol-client/blob/9645b1636ff90193a63dc678be2b6fa0e0184124/src/index.ts#L179) does actually work. I have managed to receive a text message in response and log in successfully.

You can see the full listing [here](./assets/how-set-up-as-standalone-device-works/register-protocols.ts).

The important part of the change is invoking `xdg-mime`.

```shell
xdg-mime default electron-app-universal-protocol-client-fd50893b0cb02764198c50102c3fc7c3.desktop x-scheme-handler/signalcaptcha
```

> The xdg-mime program can be used to query information about file types and to add descriptions for new file types. -- https://linux.die.net/man/1/xdg-mime

> [where `default` means] Ask the desktop environment to make application the default application for opening files of type mimetype. An application can be made the default for several file types by specifying multiple mimetypes.

This means the system is left with that registration:

```shell
$ xdg-mime query default x-scheme-handler/signalcaptcha
electron-app-universal-protocol-client-fd50893b0cb02764198c50102c3fc7c3.desktop
```

You can see an entry for `x-scheme-handler/signalcaptcha` has been added to `~/.config/mimeapps.list`.

```shell
cat ~/.config/mimeapps.list | tail
video/flv=vlc_vlc.desktop
video/x-flc=vlc_vlc.desktop
video/x-fli=vlc_vlc.desktop
video/x-flv=vlc_vlc.desktop
text/html=firefox_firefox.desktop
x-scheme-handler/http=firefox_firefox.desktop
x-scheme-handler/https=firefox_firefox.desktop
x-scheme-handler/about=firefox_firefox.desktop
x-scheme-handler/unknown=firefox_firefox.desktop
x-scheme-handler/signalcaptcha=electron-app-universal-protocol-client-fd50893b0cb02764198c50102c3fc7c3.desktop

```

## Another workaround?

[#6876](https://github.com/signalapp/Signal-Desktop/issues/6876#issuecomment-2107842792)

You can supply a `signalcaptcha` url like this, too -- but that requires a second instance.

```
yarn start signalcaptcha://[captchalink]
```

## Tips

### Reset data for development version

```

rm -r ~/.config/Signal-development/

```

After you do this you'll have to go through the 'Set Up as Standalone Device' agains next time you open the development version.

### How to undo `xdg-mime default`

One of the problems with updating the default handler is that is prevents my production version of Signal working.

To reverse this, the only way I have found is to delete the entry from [mimeapps.list](https://wiki.archlinux.org/title/XDG_MIME_Applications).

```shell
cat ~/.config/mimeapps.list | tail
video/flv=vlc_vlc.desktop
video/x-flc=vlc_vlc.desktop
video/x-fli=vlc_vlc.desktop
video/x-flv=vlc_vlc.desktop
text/html=firefox_firefox.desktop
x-scheme-handler/http=firefox_firefox.desktop
x-scheme-handler/https=firefox_firefox.desktop
x-scheme-handler/about=firefox_firefox.desktop
x-scheme-handler/unknown=firefox_firefox.desktop
x-scheme-handler/signalcaptcha=electron-app-universal-protocol-client-fd50893b0cb02764198c50102c3fc7c3.desktop

```

This is the one we have added:

```shell
x-scheme-handler/signalcaptcha=electron-app-universal-protocol-client-fd50893b0cb02764198c50102c3fc7c3.desktop
```

If you remove that line then you revert back to the behaviour where it opens your installed Signal.
