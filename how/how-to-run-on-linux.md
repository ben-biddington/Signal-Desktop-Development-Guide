# How to run on Linux

In order to get Signal Desktop running locally, you need to be able to connect it to a phone.

When running locally, it does not connect to production so connecting with your real account cannot work.

Instead you can do this, (from the contributing guide):

> You don't have to link the app with your phone. On the QR code screen, you can
> select 'Set Up as Standalone Device' from the File menu, which goes through the
> registration process like you would on a phone.

Setting up as a standalone device lets you receive a code to your phone to allow you to log in. Part of that process involves completing a captcha.

One of the steps is completing a captcha, which opens in a browser window.

In order to return control to Signal Desktop, the browser redirects to a URL like:

```
signalcaptcha://signal-hcaptcha.5fad97ac...
```

## The `signalcaptcha://` redirect cannot complete

After completing the captcha, your browser is redirected to a URL like:

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

I have found that after completing the captcha, control is returned my real version of Signal rather than the development version.

This means that I cannot sign in on the development version.

I think this is because the registration does not work:

```ts
app.setAsDefaultProtocolClient("signalcaptcha");
```

I am still unsure how it _has_ worked for my real Signal.

## A workaround patch

Use [this patch](./assets/how-to-run-on-linux/register-protocols.patch) that uses [register-protocols.ts](./assets/how-set-up-as-standalone-device-works/register-protocols.ts).

This allows control to return to the development version after captcha.

Apply patch with

```shell
cd ../Signal-Desktop && git apply ../Signal-Desktop-Development-Guide/how/assets/how-to-run-on-linux/register-protocols.patch && cd -
```

Rebuild as normal.

```shell
yarn generate && yarn start
```
