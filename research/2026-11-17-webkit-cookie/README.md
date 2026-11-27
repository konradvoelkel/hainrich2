# Warum `smoke:mod` unter WebKit an der Anmeldung scheitert

_2026-11-17. Playwright 1.65.1, WebKit 27.2 (Build 2388), Chromium und Firefox aus demselben Paket._

**Befund:** WebKit nimmt das Sitzungs-Cookie der Moderation auf `http://localhost` nicht an. Die Anmeldung antwortet mit 303, aber der
Browser hält danach kein Cookie und zeigt wieder die Anmeldeseite. Chromium und Firefox behandeln `localhost` als sicheren Ursprung und
nehmen dasselbe Cookie an. Das Cookie heißt `__Secure-sitzung` und trägt `Secure` (`lib/mod.js`); beides verlangt für WebKit eine
verschlüsselte Verbindung.

Das betrifft nur den Testverbund. Auf dem Host läuft die Moderation über HTTPS, dort gibt es kein Cookie ohne Verschlüsselung.

## Messung

```
node smoke-mod/start.mjs &
node research/2026-11-17-webkit-cookie/probe.mjs
```

| Browser | Antwort der Anmeldung | `Set-Cookie`, wie der Browser es meldet | Cookies danach | Überschrift danach |
|---|---|---|---|---|
| Chromium | 303 | `__Secure-sitzung=…; Path=/eidl/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200` | `__Secure-sitzung` | Fragen und Antworten |
| Firefox | 303 | dasselbe | `__Secure-sitzung` | Fragen und Antworten |
| WebKit | 303 | keins | keins | Anmelden |

Der Server schickt in allen drei Fällen dieselbe Kopfzeile; WebKit verwirft sie, bevor Playwright sie zu sehen bekommt.

## Was daraus folgt

`SMOKE_BROWSER=webkit npm run smoke:mod`: 9 von 25 bestehen, 16 scheitern, alle an `signIn` (die Überschrift bleibt „Anmelden“). Die 9
sind die Tests ohne Anmeldung. Vor dem Umbau vom selben Tag waren es 14 von 23, am 06.11. 13 von 22. Mit den Systempaketen hat es nichts
zu tun: `sudo npx playwright install-deps webkit` lief am 17.11., das Ergebnis blieb.

Der Smoke-Test der Site (`npm run smoke`) braucht keine Anmeldung und läuft unter WebKit, lokal und gegen den Host.

**Abhilfe, nicht gebaut:** den Verbund für WebKit über HTTPS anbieten, mit einem Wegwerf-Zertifikat und `ignoreHTTPSErrors`. Das Cookie
für den Test abzuschwächen wäre falsch: Dann liefe der Test gegen etwas, das es auf dem Host nicht gibt.

**Nicht geprüft:** Safari auf einem echten Gerät, und ob WebKit sich mit `http://127.0.0.1` anders verhält als mit `localhost`.

## Nachtrag 2026-11-27: gebaut

Auf Konrads Wort („Ja, bauen“) läuft `npm run smoke:mod` über HTTPS. `smoke-mod/start.mjs` erzeugt beim Start mit `openssl req -x509`
ein Zertifikat für `localhost`, einen Tag gültig, im Wegwerf-Verzeichnis des Verbunds; `site/serve.mjs` bedient HTTPS, wenn
`HAINRICH2_TLS_KEY` und `HAINRICH2_TLS_CERT` gesetzt sind, sonst wie bisher HTTP. Playwright bekommt `ignoreHTTPSErrors`, auch beim
Warten auf den Server. Das Cookie bleibt, wie es ist. Kein Schlüssel liegt im Repo.

| Browser | `smoke:mod` |
|---|---|
| Chromium | 28 von 28 |
| Firefox | 28 von 28 |
| WebKit | 28 von 28 |

`npm run smoke` (ohne Anmeldung) läuft weiter über HTTP, 24 von 24 in Chromium.
