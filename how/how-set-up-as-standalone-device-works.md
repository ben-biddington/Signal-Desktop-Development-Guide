# How set up as standalone device works

After entering phone number, your browser opens and you are shown a captcha using:

```
https://signalcaptchas.org/staging/registration/generate
```

After completing it successfully, you are redirected to a URL like:

```
signalcaptcha://signal-hcaptcha.5fad97ac-7d06-4e44-b18a-b950b20148ff.registration.P1_eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.hadwYXNza2V5xQUbS95FbOcFTymWcwlkiuDMCmWDB0NLU3YFf4qbyg1UE6QKu1JcP7hchWLwSaoufylLIMSYjGWJhRJGxt4PnR03wTUwst3kwhcedjHwCGfpWSTTRx3t_oQm5FNvnhkmjEWojiBL87cIoqgzd-n5gmoOEB7Byg1YhYEorfrGViQQ0dV8BvOo2SR1S7lXFbGJZrEgWwoE43yessXEgWdPHR8vWH110BkEZXjSic-32ozO4W8PGNlixo16g-6MqWGOwKrgOVS8rjtD4EaG6fru3kSpl75htnrU6jX03587HkTzaB1s8W5p64pgVJIdmmzgl8LUzpuxokXwVCiM3UOVh7ps44-ZwA3427h1cQWgOtRBf5yxEiSBm-FNHqGAQPn0wFOS4C8qCcFMYLqDImgihOsnNVbzpHPLUr1Xq_nEkJzdCeumV1yKHRyqU5u9-Oo2Aqg1Il1ZHKyRH0tDrBU8Wzhyu2nFUXuATp0ezHt4da0MoZrM1HpD5Sv4ZvmPi-faW5f2Q9hlEAGw3J-wsIAt6xbdqo3QRR-aa8BF6lLEb8OD-gt5SgVSZbJno-LBO5-tIFUrn_yxOCT1aRCQor8GphkypQFAiI70-VR95cbCHQi4B9JQ4BhNrzQPADbbyrxNeGEI4NDh1sjk3lGM6QG4z9UJfF9fsVvCyyRB53UtWUWRU6xxfSXY0yxHykU8kDiCh5IbW19DqZuRejRNkznYaTs-jMknjOVi7OfbI_cyFl7Roks3C1WEXpVTY1Ipd37QQvOhidfKZqCs20wQUX84Y-X4qpb5Q7OdYZYouGVDUjBKRe48c1xUw6tT8drmwe_iksg13ElfxviEEQ84syK_gzFLYRfJYuEttHGC88H8KuKQ_AsP66w0yBCoHTYFjlJurUvSraw-Uf2K4acbbpg4MyBD4VIiycNr3YDwbhyqDx0TvYCsK-uS3OBAiyxtlDYMZGc3UntkB7zsZz8N6_EUgdUG8zh4h_8rCKzzyn7Uq-rQwSQ9hJdy-WC07kIIEQUbotMF2hafex04vrslrs5HXGnV9YaecJHZJjx_VN5KBHVNhvt7gLYWbJuFeco38CmXHaNxJspLLS1qVNWh8WbbAivKNIW2GP0oTy_LZmbRIraNizTjW7_fqxtjVPOBzQEXzC3V72uAYEqDJ0lcZQWwB8NRgosVxGEQv3T7Roy35OkaXGW9V555S1k3Rmk_5Qsn9swLEzansp3ga7rm3DyOYwLrskYkYQ6otvq0xZfJH_nSVDHJOznJ7ktmhgseP7qYVmf88PXlFxQntCkhRF6ZeQ2fMDSdHT1WkfiNWc0GAXdb1dRC5vFeQFaMDLKQlvjvLLvOcY8JswGJVVXkX8l4hiWnjeMtNI3cImGnyHfNwEkMb3ru27tbnxb6jdDPxSJA-y-qx-rTQF3WPR7qmFLNSuru2_Fv4G644ttSGuwSkZG6Y-9ea96hY-vZvKgZG9oZC5bd9ZWOCzCmaorGsmzWvralrUGX8bI2Qjm-q6AanpToq5AZAXNm85ArrQoydyW6fqjbGup5aKtauGPpsKerzaBmqYWiYLp8fE9m-dPZGIZWAcPZpqPSRZuIMl_SMivu0oksPzBtzj07anpLM5JqEY9DGGUzFfwknp_wBE5b0c5ekdlf_zHRv6dZa8gJaPktDw9T3UMSY1wGRtuwYBFg4YqXfBm3r9rqAnswS3k5tmcvUM_uO_NgJhyjZ-oRDe5gl54bR2kXsghRz-vgeWGjZXhwzmZX9OOoc2hhcmRfaWTOD3Lqb6JrcqgyYTRjYzQyZaJwZAA.X3X2ncwx6a9zTzM0flxYmp7jfJg0Ag8DFSNLWbQPuSA
```

One option you get is to open it with Signal. When I do that it opens my installed version, not the development version that made the request.

```ts
// ts/components/StandaloneRegistration.tsx
const onRequestCode = useCallback(
  async (transport: VerificationTransport) => {
    if (!isValidNumber) {
      return;
    }

    if (!number) {
      setIsValidNumber(false);
      setError(undefined);
      return;
    }

    const url = getChallengeURL('registration');

    log.info(
      `StandaloneRegistration: navigating to ${url} using 'document.location.href'`
    );

    // Causes browser to open, is that expected?
    document.location.href = url;

    log.info(`StandaloneRegistration: after redirect`);

    if (!window.Signal.challengeHandler) {
      setError('Captcha handler is not ready!');
      return;
    }

    const token = await window.Signal.challengeHandler.requestCaptcha({
      reason: 'standalone registration',
    });

    try {
      const result = await requestVerification(number, token, transport);
      setSessionId(result.sessionId);
      setError(undefined);
    } catch (err) {
      log.error(err);
      setError(err.message);
    }
  },
  [isValidNumber, setIsValidNumber, setError, requestVerification, number]
);
```

Looks like we stop here:

```ts
const token = await window.Signal.challengeHandler.requestCaptcha({
  reason: 'standalone registration',
});
```

We have been set up as the default handler for those urls:

```ts
// app/main.ts
app.setAsDefaultProtocolClient('signalcaptcha');
```

> [setAsDefaultProtocolClient] Sets the current executable as the default handler for a protocol (aka URI scheme). It allows you to integrate your app deeper into the operating system. Once registered, all links with your-protocol:// will be opened with the current executable. The whole link, including protocol, will be passed to your application as a parameter.

But in practice it is not working.

Is this because I already have Signal present? Even if it is not running?

Is this [a linux problem](https://github.com/electron/electron/issues/40685)?

[The change mentioned in that ticket](https://github.com/witcher112/electron-app-universal-protocol-client/blob/9645b1636ff90193a63dc678be2b6fa0e0184124/src/index.ts#L179) does actually work. I have managed to receive a text message in response and log in successfully.

Do this to reset all data and force loging in again:

```
rm -r  ~/.config/Signal-development/
```
