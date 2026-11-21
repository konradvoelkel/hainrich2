# Sicherheit und Datenschutz: hai.konradvoelkel.com/eidl gegen Modern Web Guidance (64a6d70)

Ich habe nur gelesen, Code und Plan per grep, kein Netz. Die Kopfzeilen am Host stammen aus dem Auftrag (GET vom 2026-11-21).

## Gelesene Leitfäden

- **Ganz gelesen:** `security/security`, `privacy/privacy`, `security/sanitize-untrusted-html`, `security/trusted-types`, `security/validate-origins`, `security/passkeys`
- **Teilweise gelesen:** `security/restrict-outbound-connections` (Einleitung, Umsetzung, Best Practices, Rückfall), `security/secure-external-subresources` (§1–2, Rückfall), `security/passkey-authentication` (Formular-Annotation, Rückfall)
- **Nur den Kopf gelesen, um zu entscheiden, ob sie zutreffen:** `security/client-side-encryption`, `security/digital-signatures`, `security/local-network-access`, `security/quick-sign-ins`, `security/verify-email-ownership`, `security/passkey-registration`, `security/passkey-management`, `security/passkey-reauthentication`, `security/passkey-conditional-create`

## Nicht anwendbar

- **Ohne passendes Muster in der Site:** WebCrypto-Verschlüsselung und -Signaturen, lokales Netz, E-Mail-Prüfung, Immediate-UI-Anmeldung. Der Kurscode ist kein Konto.
- **Ohne Passkeys:** Registrierung, Verwaltung, Reauth und Conditional Create der Passkeys.
- **Ohne Fremdeinbettungen:** postMessage zwischen Fenstern (es gibt nur den dedizierten Worker), die Origin-API, Video-Façade, Social-SDKs, FedCM, CHIPS und `<permission>`.
- **Ohne fremde Subressourcen:** SRI und die Modifikatoren für CSS-`url()`.

## Befunde

### security/security

**(a) erfüllt**
- HTTPS läuft, HSTS ist gesetzt.
- Gefährliche Senken gibt es nur an den drei `innerHTML`-Stellen (siehe unten). Kein `eval`, kein `document.write`, kein `setTimeout` mit String, kein `script.src`. Text geht überall über `textContent`.
- Cookies tragen `HttpOnly; Secure` (`lib/mod.js:101-102`). Abmelden löscht die Sitzung auf dem Server und lässt das Cookie ablaufen (`lib/mod.js:262-265`).
- Clickjacking: `frame-ancestors 'none'` und `X-Frame-Options: DENY`, auf den öffentlichen Seiten und in `MOD_CSP`.
- Die Pflichtdirektiven der CSP stehen: `base-uri 'none'`, `form-action` (öffentlich `'none'`, Moderation `'self'`), `object-src` über `default-src 'none'`. In `script-src` steht kein `unsafe-inline`.
- COOP steht auf `same-origin`. Das passt, denn es gibt keine Popups, kein OAuth und keine Zahlung.
- Cross-Origin-Isolation fehlt, wie der Leitfaden es ohne SharedArrayBuffer rät (`numThreads = 1`, Plan §6.2).
- Fetch Metadata: Jeder POST prüft `Sec-Fetch-Site === 'same-origin'`, sonst den Origin (`lib/http.js:25-33`). Die Prüfung läuft vor Anmeldung, Token und Rumpf (`lib/mod.js:255`, `lib/api.js:122`, `lib/stimmen.js:23`). `same-site` wird abgelehnt, wie die CAUTION es verlangt. `Vary` ist unnötig, weil alle Antworten der App `no-store` sind.
- `nosniff` ist gesetzt, die Content-Types stimmen (`lib/http.js:83`, `lib/mod.js:70`, `site/serve.mjs:19-22`).
- SRI und CORS: Es gibt keine fremden Subressourcen und keine `Access-Control-*`-Kopfzeile.

**(b) Abweichung**
- **B1 HSTS ohne `includeSubDomains` und `preload`** (Kopfzeile am Host). Regel: „`max-age=31536000; includeSubDomains; preload` to force HTTPS“. Einen Baseline-Stand nennt der Leitfaden nicht. Braucht das Server-Repo. Für hai.* allein bringt das wenig; `preload` ist eine Entscheidung für konradvoelkel.com als Ganzes.
- **B2 Kein Reporting** (`Reporting-Endpoints`, `report-to`, Report-Only). Stellen: `site/serve.mjs:18`, `lib/mod.js:17`. Regel: „always keep `Reporting-Endpoints` and `report-to` wired up“. Kein Stand genannt. Für die öffentliche CSP braucht es das Server-Repo, `MOD_CSP` liegt hier. Das wäre ein neuer Datenfluss (Seitenadresse, Browser) an den eigenen Server, also auch ein Satz im Datenschutz. Die Smoke-Tests in drei Engines finden Verstöße beim Bauen, aber keine Regressionen im Feld. Optional.
  - **Nachtrag vom selben Tag:** Laut Server-Repo kommt Reporting auf keiner seiner Sites, weil sonst „Zugriffsprotokolle werden nicht
    geführt“ nicht mehr stimmt. Damit ist B2 bewusst anders, und Frage 2 unten entfällt.
- **B3 `script-src 'self'` statt Nonce oder Hash mit `'strict-dynamic'`** (`site/serve.mjs:18`, `lib/mod.js:17`). Regel: „Avoid broad scheme or domain allowlists … as the primary `script-src` protection“. Kein Stand genannt. Das Risiko ist hier klein: kein JSONP, keine offene Umleitung, keine Uploads, und JSON liegt unter `nosniff`.
  - Fix ohne Server-Repo: `site/build.mjs` schreibt ein `<meta http-equiv="Content-Security-Policy">` mit `script-src 'sha384-…' 'strict-dynamic'` und `integrity` an die Skript-Tags. Die Host-CSP bleibt, beide gelten zusammen.
  - **Unsicher:** ob der Hash-Abgleich externer Skripte in Chromium, Firefox und WebKit trägt, und was mit den Importen im Worker passiert. Vorher im Smoke-Test prüfen. Niedrige Priorität.
- **B4 CORP fehlt.** Regel: „Default to `Cross-Origin-Resource-Policy: same-origin` for app-internal responses“. Kein Stand genannt. Gehört ins Server-Repo, denn Caddy setzt die Kopfzeilen für den ganzen Host (`lib/mod.js:67`). Der Nutzen ist begrenzt: Die Moderation hat `SameSite=Strict`, der Fragepfad nimmt nur POST.
- **B5 Permissions-Policy fehlt.** Regel: „Disable unused browser features (camera, geolocation, microphone)“ (ebenso `privacy/privacy` §5). Kein Stand genannt. Gehört ins Server-Repo, etwa `camera=(), microphone=(), geolocation=()`. Die Site braucht keine dieser Funktionen.

**(c) bewusst anders**
- **C1 `__Secure-` statt `__Host-`** (`lib/mod.js:18`, `:101`). Regel: „Name first-party session cookies with the `__Host-` prefix“. Kein Stand genannt.
  - Grund im Plan §4 „Adresse“: Das Cookie bekommt `Path=/eidl/`, weitere Skripte bekommen eigene Pfade. `__Host-` verlangt `Path=/`.
  - Restrisiko: Eine Schwester-Subdomain unter konradvoelkel.com kann ein gleichnamiges `__Secure-`-Cookie mit `Domain=konradvoelkel.com` und längerem Pfad setzen. `cookieOf` (`lib/mod.js:25`) nimmt das erste, das ankommt. Folge: Abmelden erzwingen oder eine eigene Sitzung unterschieben (siehe Fragen).
- **C2 `SameSite=Strict` statt Lax.** Das ist strenger, so festgelegt in Plan §9.
- **C3 `'wasm-unsafe-eval'` und `style-src-attr 'unsafe-inline'`.** Das erste braucht ONNX-WASM (`lib/model.js:12`), das zweite die Inline-Stile von KaTeX (Plan §9). Eingeschleustes Markup könnte damit Stile setzen, aber keine Skripte ausführen.
- **C4 `Referrer-Policy: no-referrer` statt `strict-origin-when-cross-origin`.** Das ist strenger. Die Folge, `Origin: null`, behandelt `lib/http.js:22-24`.
- **C5 Kein `Clear-Site-Data` beim Abmelden** (`lib/mod.js:262-265`). Regel: „Send `Clear-Site-Data` … on logout endpoints“. Kein Stand genannt.
  - Plan D41: Das Geräte-Cookie soll das Abmelden überleben.
  - Nach meinem Wissen löscht `"cookies"` alle Cookies der registrierbaren Domain, also auch die anderer Anwendungen unter konradvoelkel.com (unsicher).
  - `"storage"` löschte Token und Geheimnisse von Studierenden im selben Browser.
  - `"cache"` brächte nichts, alles ist `no-store`.
  - Die Sitzung beenden `sessions.drop` und `Max-Age=0` schon. Die Einzelheiten sind meine Ableitung, dokumentiert ist nur D41.

### privacy/privacy

**(a) erfüllt**
- Datensparsamkeit: Adressen nur im Arbeitsspeicher, IPv6 je /64. Sitzungen im RAM. Stimmen nur als Hash einer Zufallskennung (`lib/stimmen.js:36`). Abgelehnte Fragen werden gelöscht, offene nach vier Wochen.
- Transparenz: Die Erklärung steht am Formular, die Einwilligung ist getrennt und nicht vorbelegt (`lib/site.js:606-634`). Kein Dark Pattern.
- Keine Dritten. Die Bauprüfung `foreignSource` bricht sonst ab (`lib/site.js:662`, `site/build.mjs:227`).
- Bremsen an allen Endpunkten, auch am lesenden „Meine Fragen“ (`lib/api.js:25-31`, `lib/mod.js:63-65`, `lib/stimmen.js:17-18`).
- Die Logs der App enthalten keinen Text (`server/web.mjs:51-55`, `lib/mod.js:219`).
- Kein Lesen des User-Agent, kein Fingerprinting.
- Zugriff auf die eigenen Daten über „Meine Fragen“. Löschen vor der Freigabe per Knopf (`site/fragen.js:85-89`).
- Der Suchtext geht nur über `sessionStorage` und ist gelöscht, sobald die Frageseite ihn abholt (`site/app.js:120-124`, `site/fragen.js:201-204`).

**(c) bewusst anders**
- **C6 Token, Geheimnisse und eine Kopie der Fragetexte liegen in `localStorage`** (`site/fragen.js:10-11`, `:150`, `:173`). Regel: „DON'T store sensitive tokens or PII in `localStorage`“. Kein Stand genannt.
  - Grund: Plan §10 und §5 Schritt 6 (keine Konten, kein Cookie für Studierende, der Server merkt sich nichts), dazu der Rechtstext nach §11.4.
  - Der Grund des Leitfadens („accessible by any embedded script“) greift hier kaum, es gibt keine fremden Skripte.
  - Restrisiko: `localStorage` gilt für den ganzen Host (Plan §4).
- **C7 Nach der Freigabe lässt sich eine Frage nur über den Meldeweg löschen.** Regel: „DON'T … require users to contact support“. Grund: Nach der Freigabe gibt es keine Verbindung mehr zur Person (Plan §5 Schritt 6), der Meldeweg steht in Plan §11.4. Konten gibt es nicht, die Regel trifft also nur halb.

### security/sanitize-untrusted-html

**(a) erfüllt**
- Das HTML wird auf dem Server bereinigt:
  - markdown-it mit `html:false` (`lib/render.js:11`) und Link-Allowlist (`:20-38`)
  - KaTeX ohne `trust` und mit `maxSize` (`:48`)
  - Fragen maskiert (`:65-68`)
  - JSON-Datenblöcke mit `<` (`lib/site.js:180`, `:623`)
- `innerHTML` bekommt nur diese Ausgabe:
  - `site/app.js:31`, über `searchEntry` und `renderQuestion` (`lib/site.js:40-43`)
  - `site/fragen.js:105`, über `renderQuestion` (`lib/api.js:97`, `:101`)
  - `site/fragen.js:120`, über `draftCard` (`lib/api.js:100`)

**(c) bewusst anders**
- **C8 `setHTML()` wird an diesen drei Stellen nicht genutzt.** Regel: „Use `setHTML()` … when available to safely insert untrusted HTML“. Stand: eingeschränkt, Chrome und Edge 146, Firefox 148, Safari nicht.
  - Grund im Code: „`html` kommt fertig gesetzt vom Server, wie die Seiten selbst“ (`site/app.js:26`, `site/fragen.js:104`).
  - Dazu meine Ableitung, nicht gemessen: Der Standard-Sanitizer entfernt laut Leitfaden `style`, KaTeX braucht aber Inline-Stile.
  - Möglich wäre `setHTML` mit eigener Konfiguration und `innerHTML` als Rückfall. Ob sich `style` darin freigeben lässt: **unsicher**.

### security/trusted-types

**(b) Abweichung**
- **B6 Moderation ohne Trusted Types**, obwohl ihre Seiten keine Senke haben. `MOD_CSP` steht in `lib/mod.js:17`. Das einzige Skript ist `lib/mod-tasten.js`, und das benutzt nur Ereignisse und `click()`.
  - Regel: „Enforce Trusted Types … by including the `require-trusted-types-for 'script'` directive“.
  - Stand: Newly available seit 2026-02-24 (Chrome 83, Edge 83, Firefox 148, Safari 26).
  - Fix im Repo, ohne Server-Repo: `; require-trusted-types-for 'script'; trusted-types 'none'` an `MOD_CSP` hängen. `test/mod.test.mjs:205/210` bleiben gültig.
  - Danach mit `smoke:mod` prüfen; WebKit nur über HTTPS (`research/2026-11-17-webkit-cookie`).
- **B7 Öffentliche Seiten ohne Trusted Types.** Die Senken sind `site/app.js:31`, `site/fragen.js:105` und `:120` für HTML, dazu `site/app.js:90` (`new Worker`, ScriptURL). Gleicher Baseline-Stand.
  - Fix: eine Policy `eidl` für die drei HTML-Stellen und für die URL der eigenen `such-worker.js`.
  - Die CSP bekommt `require-trusted-types-for 'script'; trusted-types eidl`, in `site/serve.mjs:18` und im Server-Repo.
  - Haken: Das HTML ist schon bereinigt, `createHTML` würde also nur durchreichen. Genau das schließt der Leitfaden aus („DO NOT: Create a pass-through policy“). Regelkonform ginge es nur mit `setHTML` (fehlt in Safari) oder einem mitgelieferten DOMPurify.
  - Der Gewinn ist klein, denn ohne `unsafe-inline` läuft eingeschleustes Markup ohnehin nicht (`research/2026-11-11-threat-model` §3). Gewonnen wäre, dass jede neue Senke sofort einen Fehler wirft.
  - **Unsicher:** ob transformers.js oder ORT im Worker eine Senke berühren.

### security/validate-origins

**(a) erfüllt**
- Der Origin wird geparst und exakt mit `Host` verglichen, ohne `startsWith`. `Origin: null` scheitert am Parsen und wird abgelehnt (`lib/http.js:25-33`). Das Schema vergleicht die Prüfung nicht; unter HSTS bleibt das ohne Folge.
- Keine Umleitung mit Ziel aus der Anfrage. Die Anmeldung führt fest nach `mod/` (`lib/mod.js:100`).

### security/restrict-outbound-connections

**(a) erfüllt**
- Die CSP-Rückfalldirektiven des Leitfadens stehen alle: `form-action` ausdrücklich, `worker-src 'self'` ohne `blob:` (`lib/model.js:14-15`), `connect-src 'self'`.

**(b) Abweichung**
- **B8 Connection-Allowlist fehlt.** Regel: „restricts a document or worker to communicating only with an explicit list“. Stand: eingeschränkt, Chrome und Edge 152, nicht Firefox und Safari.
  - Gehört ins Server-Repo, auch auf `such-worker.js`.
  - Die Liste braucht die Linkziele: Skript-Host, konradvoelkel.com, creativecommons.org.
  - Ohne `redirects=allow` brechen `/eidl` → `/eidl/` und die 303 der Moderation.
  - Optional.

### security/secure-external-subresources

**(a) erfüllt**
- Keine fremden Skripte, Stile, Schriften oder Bilder.
- Die Referrer-Policy für das Dokument ist strenger als verlangt.

### security/passkeys, security/passkey-authentication

**(a) erfüllt**
- Das Anmeldeformular trägt `autocomplete="username"` und `"current-password"` (`lib/mod-pages.js:42`, `:44`).

**(c) bewusst anders**
- **C9 Keine Passkeys für die Moderation.**
  - Grund: Plan D50. Konrad entschied am 2026-11-18 für eine Basic-Auth-Schranke vor `/eidl/mod/`; das Threat Model nennt das selbst „kein zweiter Faktor im strengen Sinn“.
  - Stand: `getClientCapabilities` Newly seit 2025-02-06, `parseRequestOptionsFromJSON` Newly seit 2025-03-31.
  - Der Umbau bräuchte auf dem Server eine geprüfte WebAuthn-Bibliothek; der Leitfaden schreibt „MUST“. Die Kopfzeilen im Server-Repo betrifft er nicht.

## Zählung

| Klasse | Anzahl | Verteilung |
|---|---|---|
| (a) erfüllt | 25 | security 10, privacy 8, sanitize 2, validate-origins 2, restrict 1, external 1, passkeys 1 |
| (b) Abweichung | 7 | B1, B3 bis B8 (B2 ist seit dem Nachtrag bewusst anders) |
| (c) bewusst anders | 10 | C1 bis C9 und B2 |

## Wünsche an den Server

Nach Nutzen geordnet:

1. `Permissions-Policy: camera=(), microphone=(), geolocation=()` (B5).
2. `Cross-Origin-Resource-Policy: same-origin` für den ganzen Host (B4), vorher Frage 4 klären.
3. Trusted Types in der öffentlichen CSP, erst nach Frage 1 (B7).
4. HSTS mit `includeSubDomains` (B1). `preload` nur zusammen mit der Apex-Domain.
5. Entfällt: `Reporting-Endpoints` und `report-to` (B2), siehe den Nachtrag dort.
6. Optional: Connection-Allowlist mit `redirects=allow`, auch auf `such-worker.js` (B8).

## Fragen an Konrad

1. **Trusted Types auf den öffentlichen Seiten:** Durchreich-Policy (gegen den Leitfaden), mitgeliefertes DOMPurify, oder vorerst lassen? Auf der Moderation geht es ohne Policy (B6).
2. ~~**CSP-Berichte**~~ entfällt, siehe den Nachtrag zu B2.
3. **Cookies von Schwester-Subdomains:** Setzen andere Anwendungen unter konradvoelkel.com Cookies? Wenn ja, lohnt `__Host-sitzung` mit `Path=/` trotz Plan §4 (C1).
4. **CORP:** Bettet das Blog oder das Skript Bilder von hai.* ein?
5. **Passkeys:** Kommen sie später als Antwort auf D1?
