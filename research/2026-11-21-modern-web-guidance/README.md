# hai.konradvoelkel.com/eidl gegen Googles Modern Web Guidance

_Stand 2026-11-21. Geprüft wurde der Code am Commit `d417706` (`main`), nicht der gebaute Baum und nicht `node_modules`. Quelle der
Regeln: `GoogleChrome/modern-web-guidance` am Commit `64a6d708f5a43f2cd3fde5d4d7db3905ba1bdf65` vom 16.11.2026, Apache-2.0. Die 210
Leitfäden (`skills/modern-web-guidance/guides/<bereich>/<id>.md`) wurden als Markdown über die GitHub-API gelesen. Das Werkzeug
`npx modern-web-guidance` (search, retrieve, legacy-scan) lief nicht; ob es laufen darf, entscheidet Konrad. Am Host wurden nur die
Kopfzeilen per `GET` abgefragt._

_Gelesen haben vier Prüfer, je einer pro Bereich, alle nur lesend: Sicherheit und Datenschutz, HTML/Formulare/Barrierefreiheit,
Performance/JavaScript/WebAssembly, CSS und Gestaltung. Ihre Befunde stehen ungekürzt unter `findings/`. Die Abweichungen in Abschnitt 2
habe ich selbst an den Codezeilen nachgesehen. Im Browser ist nichts gemessen, und geändert wurde nichts._

**Ergebnis:** Die Site hält die Querschnittsregeln weitgehend ein. Dritte gibt es keine, die CSP ist streng, HTML wird auf dem Server
bereinigt, jeder POST prüft die Herkunft, schwere Arbeit läuft im Worker, und lesen kann man ohne JavaScript. Abweichungen gibt es 55,
meist kleine. Die gewichtigen liegen an zwei Stellen. Erstens hängt die Stichwortsuche an der Bibliothek für das Sprachmodell. Zweitens
hat der Fragepfad Schwächen bei Doppelklick, Fokus und Fehlermeldungen. Fast alles lässt sich in diesem Repo beheben. Am Server wären
Kopfzeilen zu ergänzen, keine davon dringend. Eine Browser-Politik hat das Repo nicht, ein Vorschlag steht in Abschnitt 4.

## 1. Zahlen

| Bereich | Leitfäden ganz / teilweise | (a) erfüllt | (b) Abweichung | (c) bewusst anders | Datei |
|---|---:|---:|---:|---:|---|
| Sicherheit und Datenschutz | 6 / 3, dazu 9 nach dem Kopf eingeordnet | 25 | 7 | 10 | `findings/sicherheit.md` |
| HTML, Formulare, Barrierefreiheit | 18 / 6 | 15 | 25 | 6 | `findings/html-formulare.md` |
| Performance, JavaScript, WebAssembly | 16 / 10, dazu 9 nach dem Titel eingeordnet | 20 | 6 | 5 | `findings/performance-js.md` |
| CSS und Gestaltung | 25 / 0 | 23 | 18 | 2 | `findings/css.md` |
| **Summe**, Doppeltes nur einmal gezählt | **65 / 19** | **83** | **55** | **22** | |

- **Doppelt gezählt** hatten zwei Prüfer zwei Punkte, die hier nur einmal stehen: die Scrollkästen ohne Tastaturfokus (HTML b15 und
  CSS B7) und die Sichtreihenfolge der Fragekarte (HTML c1 und CSS C1).
- **Die Zahl (a) hängt davon ab, wie fein ein Prüfer zählt.** Zwischen den Bereichen ist sie nicht vergleichbar. Belastbar sind (b) und
  (c), weil jeder Punkt eine Stelle im Code hat.
- **Nicht angesehen:** `built-in-ai/*`, weil es nur in Chrome läuft und nicht ohne Konrad kommt, sowie `webmcp/*`. Rund 100 weitere
  Leitfäden passen zu keinem Muster der Site, etwa Karussell, Passkey-Registrierung, Zahlung, Video oder Drag-and-drop.

## 2. Die wichtigsten Abweichungen

Die Reihenfolge ist mein Vorschlag. Zuerst kommt, was Studierende beim Fragen und Suchen trifft.

1. **Die Stichwortsuche wartet auf die Bibliothek für das Sprachmodell und fällt mit ihr aus** (Performance b1).
   - **Nachgesehen:** `site/such-worker.js:5` importiert `transformers.min.js` statisch (588 KB, mit Brotli 141 KB). Ein Modul-Worker
     läuft erst, wenn sein ganzer Importgraph geladen ist. Bis dahin steht die Stichwortsuche nicht bereit, obwohl sie den Code nicht
     braucht.
   - **Wenn die Datei nicht lädt,** scheitert der ganze Worker, und die Seite meldet „Die Suche ließ sich nicht laden“. Kopfkommentar
     und Plan §6.2 versprechen das Gegenteil, die Stichwortsuche als Rückfall. Der Smoke-Test sperrt nur `wasm/` und sieht das nicht.
   - **Regel:** „DO use dynamic imports“.
   - **Fix im Repo:** `import('./transformers.min.js')` in `modell()`, im `Promise.all` neben `vektoren.json`. Dazu ein Smoke-Test, der
     `transformers.min.js` sperrt.
2. **Ein Doppelklick schickt eine Frage zweimal ab** (HTML b4).
   - **Nachgesehen:** Der Submit-Handler in `site/fragen.js:157` sperrt den Knopf nicht. `lib/api.js` prüft nicht auf gleichen Text, es
     bremst nur je Token.
   - **Folge:** Zwei Fragen warten auf die Moderation. Mit Einwilligung gehen beide als Entwurf an Claude, und das kostet doppelt.
   - **Fix:** `event.submitter.disabled = true`, im `finally` zurücknehmen. Ebenso am Formular für den Kurscode.
3. **Fokus und Fehlermeldungen im Fragepfad** (HTML b3, b18, b19, b20):
   - **Fokus geht verloren:** „Meine Fragen“ wird alle 3 s neu gebaut, solange ein Entwurf läuft (`site/fragen.js:138`). Löschen und
     Entfernen nehmen den fokussierten Knopf weg.
   - **Fehler vom Server** hängen an keinem Feld, und der Fokus bleibt auf dem Knopf.
   - **Eingeblendete Meldungen:** Die Alert-Absätze werden zusammen mit ihrem Text eingeblendet. Das wird nicht zuverlässig vorgelesen
     (unsicher, nicht gemessen).
   - **Pflichtfelder:** Leere Pflichtfelder gelten in Firefox und Safari schon beim Laden als ungültig, weil `aria-invalid="false"`
     fehlt.
   - **Fixes:** stehen in `findings/html-formulare.md`. Keiner braucht eine Abhängigkeit.
4. **Feldränder mit 1,4 zu 1 Kontrast** (CSS B10, WCAG 1.4.11).
   - **Nachgesehen:** Suchfeld und Formularfelder nehmen `--linie` (`site/style.css:70`, `:174`, `:202`). Verlangt sind 3 zu 1. Die Werte
     sind aus oklch geschätzt, nicht gemessen.
   - **Fix:** ein eigenes Token für Feldränder, etwa `oklch(0.6 0.02 295)`. Das ändert das Bild aller Felder.
5. **Ob ein Abstimmpfeil gedrückt ist, zeigt nur die Farbe** (CSS B11, WCAG 1.4.1).
   - **Nachgesehen:** `.pfeil.an` ändert nur `color` (`site/style.css:220`), und `--marke` und `--leise` sind fast gleich hell.
     `aria-pressed` ist gesetzt, für Vorleseprogramme stimmt es also.
   - **Fix:** Fläche und Umriss an `[aria-pressed="true"]`. Der Umriss bleibt auch im Kontrastmodus sichtbar.
6. **Semantik, die Vorleseprogramme brauchen** (HTML b9, b10, b11, b24):
   - Listen mit `list-style: none` verlieren in Safari ihre Rolle.
   - Die Pfeile heißen auf Listenseiten alle „Gute Frage“.
   - Der Pfad oben ist keine `ol` und hat kein `aria-current`.
   - Die Tabellen haben keinen Namen.
7. **Die Moderation erzwingt keine Trusted Types,** obwohl sie keine Senke hat (Sicherheit B6).
   - **Fix:** `require-trusted-types-for 'script'; trusted-types 'none'` an `MOD_CSP` in `lib/mod.js:17`. Die Moderations-CSP setzt die
     App selbst, das Server-Repo braucht es dafür nicht.
   - **Baseline:** Newly seit 2026-02-24. Ältere Browser ignorieren die Direktive.
   - **Danach:** `smoke:mod` laufen lassen.
8. **`<meta name="color-scheme" content="light dark">` fehlt** in beiden Köpfen (CSS B8). `color-scheme` steht nur im Stylesheet.
9. **Das Modell liegt ohne Version im Cache Storage** (Performance b3; aus dem Bundle gelesen, im Browser nicht beobachtet).
   - transformers.js legt die Modelldateien in `transformers-cache` ab und nimmt Treffer von dort vor dem Netz.
   - Ein Neuschnitt unter dem Namen `e5s-16384` bliebe bei Wiederbesuchern beim alten Modell, während `vektoren.json` neu ist.
   - **Fix:** eine Version im Modellpfad, oder der Bau bricht ab, wenn sich die Prüfsummen ändern und der Name nicht.
10. **Die Maske am Formelrand kann den Fokusring abschneiden** (CSS B15, unsicher). Chromium und Firefox fokussieren scrollende Formeln
    per Tab. Das ist mit der Tastatur zu prüfen.

Die übrigen 39 sind niedrig oder brauchen den Server (Abschnitt 5). Darunter sind logische Eigenschaften, `@container` statt `@media`, `text-wrap`, `overflow: clip`, tote
CSS-Regeln, `<search>`, `cite` an Zitaten, `<meter>` statt `<progress>`, `toSorted`, KaTeX-CSS auf Seiten ohne Formel und das JPEG der
Moderation.

## 3. Bewusst anders, die tragenden Gründe

- **Kein `setHTML()` und keine Trusted Types auf den öffentlichen Seiten.**
  - Das HTML an den drei `innerHTML`-Stellen kommt fertig bereinigt vom Server (`lib/render.js`: markdown-it ohne HTML, Link-Allowlist,
    KaTeX mit Grenze).
  - Eine Policy könnte es nur durchreichen, und genau das verbietet der Leitfaden.
  - `setHTML()` fehlt in Safari. DOMPurify wäre eine neue Abhängigkeit. Ob der Standard-Sanitizer die Inline-Stile von KaTeX ließe, ist
    nicht geprüft.
  - Siehe Abschnitt 6, Frage 2.
- **`'wasm-unsafe-eval'`, `style-src-attr 'unsafe-inline'`, ein Thread und kein COEP:** ONNX braucht WASM, und KaTeX setzt
  Inline-Stile. Threads brächten zu wenig, um Cross-Origin-Isolation zu rechtfertigen (Plan §6.2, §18).
- **Kein Inline-CSS und keine Felddaten:** `style-src 'self'`, und „Lesen sendet nichts“. Ein Smoke-Test hält fest, dass vor dem
  ersten Fokus keine Anfrage hinausgeht. Gemessen sind LCP 0,6 bis 0,7 s und CLS 0 (SEO-Audit vom 19.11.).
- **Token im `localStorage`, Cookie `__Secure-` statt `__Host-`, kein `Clear-Site-Data`:**
  - Es gibt keine Konten (Plan §10).
  - Das Cookie gilt für `Path=/eidl/` (Plan §4).
  - Das Geräte-Cookie soll das Abmelden überleben (D41).
  - Restrisiko: Eine andere Anwendung unter konradvoelkel.com könnte ein gleichnamiges Cookie setzen.
- **Öffentliche Formulare per `fetch`, Moderation ohne JavaScript:** Die öffentliche CSP hat `form-action 'none'`. Die Moderation
  bestätigt mit einem Haken statt mit einer Rückfrage (Plan §9, D27, D33).
- **Die H1 steht im Quelltext vor dem Kopf der Fragekarte,** das Grid ordnet sie fürs Auge um. Der Grund ist der Textextraktor
  (SEO-Audit vom 17.11., Befund 2). Die Tab-Folge bleibt dabei gleich.

## 4. Browser-Unterstützung: ein Vorschlag, nicht festgelegt

Die Leitfäden setzen „Baseline Widely available“ voraus und verlangen sonst Fallbacks. Das Repo hat keine eigene Politik. Getestet wird
in aktuellem Chromium, Firefox und WebKit. Vorschlag für `CLAUDE.md` oder den Plan, zu entscheiden von Konrad:

> **Browser:** Baseline Widely available gilt ohne Fallback. Neueres (Newly oder eingeschränkt) nur als Verbesserung, ohne die Lesen,
> Stichwortsuche, Fragen, Abstimmen und Moderation vollständig gehen; keine Polyfills und keine Abhängigkeit dafür. Geprüft wird mit
> dem Smoke-Test in Chromium, Firefox und WebKit.

**Folgen für die Befunde:**
- **So bleiben dürfen:** der Formelrand mit scroll-getriebener Animation (CSS C2, Newly seit 2026-10-27), `text-wrap`, `font-size-adjust`
  und `<meta name="text-scale">`. Sie verbessern nur.
- **Wirkt erst in neueren Browsern:** Trusted Types an der Moderation greift nur dort. Ältere Browser ignorieren es und verlieren nichts.
- **Bräuchte einen Fallback:** keine der Abweichungen aus Abschnitt 2.

## 5. Was der Server bräuchte

Die Kopfzeilen gehören dem Server-Repo. Am Host stehen heute: CSP wie in `site/serve.mjs`, COOP `same-origin`, HSTS ein Jahr, `nosniff`,
`X-Frame-Options: DENY`, `no-referrer`. Gewünscht, nach Nutzen geordnet:

1. **`Permissions-Policy`,** etwa `camera=(), microphone=(), geolocation=()`. Die Site braucht keine dieser Funktionen.
2. **`Cross-Origin-Resource-Policy: same-origin`.** Vorher klären, ob Blog oder Skript Bilder von hai.* einbetten.
3. **HSTS mit `includeSubDomains`.** Wenig Nutzen; `preload` nur zusammen mit der Hauptdomain.
4. **Optional, mit Konrads Wort:**
   - `Speculation-Rules` als Kopfzeile mit einer gebauten Regeldatei. Wirkt nur in Chromium.
   - Die Connection-Allowlist mit `redirects=allow`. Nur Chrome und Edge 152.
5. **Trusted Types für die öffentliche CSP erst nach Frage 2 in Abschnitt 6.**

**Nicht gewünscht:** `Reporting-Endpoints` mit `report-to` (Sicherheit B2). Laut Server-Repo kommt das auf keine der Sites dort, weil
sonst der Satz „Zugriffsprotokolle werden nicht geführt“ nicht mehr stimmt. Damit ist B2 bewusst anders.

Nebenbei, im Repo statt am Server: `site/serve.mjs` sendet weder COOP noch HSTS. `CLAUDE.md` Punkt 9 verlangt, dass es die Kopfzeilen
nachahmt.

## 6. Was Konrad entscheiden muss

1. **Die Browser-Politik** aus Abschnitt 4.
2. **Trusted Types auf den öffentlichen Seiten:**
   - So lassen. Das ist meine Empfehlung, der Grund steht in Abschnitt 3.
   - DOMPurify mitliefern. Das ist eine neue Abhängigkeit, exakt gepinnt.
   - Eine Policy, die nur durchreicht. Das verstößt gegen den Leitfaden.
3. **Die Zustimmungstexte am Frageformular:** Heute ist der ganze Rechtstext das Label, und Pflicht und freiwillig sehen gleich aus (HTML
   b7, b17). Ein kurzes Label mit dem Wortlaut als Beschreibung wäre ein neuer Zustimmungstext. Dann steigt `ZUSTIMMUNG.version`, und
   Text und Technik gehen am selben Tag live.
4. **`confirm()` beim Löschen durch ein eigenes `<dialog>` ersetzen?** Bei `confirm()` steht die Vorgabe auf OK, Enter löscht also.
5. **Ein dunklerer Feldrand** (Abschnitt 2, Punkt 4) und **ein Logo für den Dunkelmodus** (CSS B9) betreffen das Bild der Marke.
6. **Ist `autocomplete="off"` am Kurscode Absicht,** etwa wegen der Rechner im Pool? Dann wird es (c) und gehört in den Plan.
7. **Sollen öffentliche Daten Berliner Tage sein?** Heute sind Fragetag und Prüftag UTC-Tage. Eine Frage zwischen 0 und 1 Uhr trägt den
   Vortag, im Sommer bis 2 Uhr.
8. **Spekulatives Vorladen,** siehe Abschnitt 5, Punkt 4.
9. **Darf das Werkzeug laufen,** exakt in einer gepinnten Fassung? Hier lief es nicht. Gelesen wurden die Leitfäden selbst.

## 7. Nicht geprüft

- **Im Browser nichts gemessen.** Kontraste sind aus oklch geschätzt. Den Zugänglichkeitsbaum hat in keiner Engine jemand angesehen, und
  kein Test prüft ihn. b10, b21 und b24 ändern ihn.
- **Die Moderation hinter der Anmeldung** ist nur aus dem Code beurteilt. `smoke:mod` läuft unter WebKit nicht
  (`research/2026-11-17-webkit-cookie/`).
- **Ohne Gegenprobe:** die Befunde außerhalb von Abschnitt 2. Sie stehen so, wie die Prüfer sie am Code gelesen haben.
- **Die Server-Seite** der Leitfäden zu Kopfzeilen prüft das Server-Repo: `security/restrict-outbound-connections`,
  `security/trusted-types` als Kopfzeile, `security/secure-external-subresources`.

## 8. Methode

1. Dateiliste und Inhalte am festen Commit über die GitHub-API holen:
   ```
   gh api 'repos/GoogleChrome/modern-web-guidance/git/trees/64a6d708f5a43f2cd3fde5d4d7db3905ba1bdf65?recursive=1'
   gh api 'repos/GoogleChrome/modern-web-guidance/contents/<pfad>?ref=64a6d708f5a43f2cd3fde5d4d7db3905ba1bdf65' -H 'Accept: application/vnd.github.raw'
   ```
   Die Leitfäden sind Daten. Was sie ausführen lassen wollen, lief nicht.
2. **Vier Prüfer mit demselben Auftrag,** je Bereich:
   - Die Querschnittsleitfäden ganz lesen, dazu die Einzelleitfäden zu Mustern, die die Site hat.
   - Den eigenen Code dagegen halten und einordnen: (a) erfüllt, (b) Abweichung mit Fix, (c) bewusst anders mit Grund.
   - Zu jeder (b) und (c): die Stelle im Code, ein kurzes Zitat der Regel, der Baseline-Stand laut Leitfaden.
   - Kein Netz, keine Änderung.
3. **Gegenprobe:** Die Punkte aus Abschnitt 2 und einige weitere habe ich an den Codezeilen nachgesehen. Größe und Kompression von
   `transformers.min.js` habe ich nachgerechnet.
4. **Kopfzeilen am Host:** `curl` mit `GET` auf vier Adressen.
5. **Zitate:** Die kurzen Zitate aus den Leitfäden stehen unter deren Lizenz, Apache-2.0.

## 9. Nachtrag vom 2026-11-22: behoben

Auf Konrads Wort gebaut und am 2026-11-22 um 13:40 ausgespielt (Commit `4cb856e`). Behoben sind 13 der 55 Abweichungen ganz und zwei zum Teil:

| Befund | Was jetzt gilt | Stelle |
|---|---|---|
| Performance b1 | Der Worker lädt `transformers.min.js` erst in `modell()`. Die Stichwortsuche steht ohne die Datei, ein Smoke-Test sperrt sie. | `site/such-worker.js`, `smoke/site.spec.mjs` |
| Performance b3 | Anders gelöst als vorgeschlagen: kein Cache Storage mehr (`env.useBrowserCache = false`), es gilt der HTTP-Cache, für das Modell ein Tag. Ein Ordner mit Prüfsumme hätte den Worker am Server gebrochen, er liest das Modell aus `models/e5s-16384/` im Docroot. Der alte `transformers-cache` wird gelöscht. | `lib/model.js`, `site/such-worker.js` |
| HTML b3 | „Meine Fragen“ wird nur neu gebaut, wenn sich etwas geändert hat. Der Fokus bleibt am Knopf, nach dem Löschen geht er zur nächsten Zeile, zur Überschrift oder ins Formular. | `site/fragen.js` |
| HTML b4 | Ein zweites Absenden, solange die Antwort aussteht, schickt nichts; der Knopf trägt so lange `aria-disabled`. | `site/fragen.js` |
| HTML b9 | Die Tabellen haben Namen, die leere Kopfzelle der Zahlen heißt „Was“. | `lib/site.js`, `lib/mod-pages.js` |
| HTML b10 | `role="list"` an den Listen ohne Aufzählungszeichen. | `lib/site.js`, `lib/mod-pages.js` |
| HTML b11 | Die Pfeile einer Liste und die Knöpfe unter „Meine Fragen“ nennen ihre Frage über `aria-describedby`. | `lib/site.js`, `site/fragen.js` |
| HTML b18 | Die Meldungen stehen leer bereit und wechseln nur den Text. | `lib/site.js`, `site/fragen.js`, `site/stimmen.js`, `site/style.css` |
| HTML b20 | `aria-invalid="false"`, bis `:user-invalid` greift. | `lib/site.js`, `site/fragen.js` |
| HTML b24 | Der Pfad ist eine `ol`, die Seite selbst trägt `aria-current`, die Trenner setzt das Stylesheet. | `lib/site.js`, `site/style.css` |
| CSS B8 | `<meta name="color-scheme" content="light dark">` in beiden Köpfen. | `lib/site.js`, `lib/mod-pages.js` |
| CSS B11 | Ein gedrückter Pfeil hat Fläche und Umriss. | `site/style.css`, `site/stimmen.js` |
| Sicherheit B6 | `MOD_CSP` erzwingt Trusted Types ohne Policy. | `lib/mod.js` |
| HTML b5, zum Teil | Am Kurscode `autocapitalize="none" autocorrect="off"`. Der Name in der Anmeldung und die Beschriftung „Weiter“ sind unverändert. | `lib/site.js` |
| HTML b19, zum Teil | Fehler vom Server hängen an Kurscode und Fragetext, die Tastatur geht dorthin. Eine zu kurze Frage nennt die Mindestlänge. Die Formulare der Moderation sind unverändert. | `site/fragen.js`, `lib/api.js` |

Nebenbei: `site/serve.mjs` sendet jetzt COOP und HSTS wie der Host.

**Offen aus Abschnitt 2:** der Feldrand (Punkt 4, braucht Konrads Wort zum Bild) und die Maske am Formelrand (Punkt 10, mit der Tastatur zu prüfen).

**Geprüft:** `npm test` 315 von 315. `npm run smoke` 23 von 23 in Chromium, Firefox und WebKit, am lokalen Bau mit dem Stand vom Server vom 18.11. `smoke:mod` 27 von 27 in Chromium und Firefox. Im eingebauten Browser angesehen, an der Wegwerf-Datenbank von `smoke-mod/start.mjs`:
- **Pfeile:** Ein gedrückter Pfeil ist zu sehen, und `aria-describedby` nennt die Frage.
- **Kurscode:** Ein falscher Code setzt den Fokus aufs Feld, die Meldung hängt daran, und nach einer Eingabe ist das Feld wieder gültig.
- **„Meine Fragen“:** Nach dem Entfernen des letzten Eintrags steht der Fokus im Formular.

**Am Host danach, nur `GET`:**
- Smoke 23 von 23 in Chromium, Firefox und WebKit, auch der Test mit gesperrtem `transformers.min.js`.
- Die Seiten aus `live/` tragen das neue Markup.
- Der alte `transformers-cache` ist nach dem ersten Laden weg.

**Nicht geprüft:**
- Kein Vorleseprogramm hat die Seiten gelesen.
- Den Fokus beim Neubau der Liste, während ein Entwurf läuft, prüft nur `smoke:mod` indirekt.
- Die Moderation unter WebKit läuft weiter in keinem Test.

## 10. Nachtrag vom 2026-11-23: Konrads Entscheidungen und die nächsten Korrekturen

**Entschieden** (Plan D52): Trusted Types auch öffentlich, mit DOMPurify (Abschnitt 6, Punkt 2, gegen meine Empfehlung); `<dialog>` statt
`confirm()` (Punkt 4); der dunklere Feldrand (Punkt 5, das Logo für den Dunkelmodus nicht); `autocomplete="off"` am Kurscode war keine
Absicht und ist weg (Punkt 6); Berliner Tage (Punkt 7). Offen bleiben die Browser-Politik (Punkt 1), die Zustimmungstexte (Punkt 3), das
spekulative Vorladen (Punkt 8) und das Werkzeug (Punkt 9).

| Befund | Was jetzt gilt | Stelle |
|---|---|---|
| Sicherheit B2 | `require-trusted-types-for 'script'; trusted-types hainrich dompurify`. Alles HTML geht durch DOMPurify 3.4.18 (exakt gepinnt), MathML von KaTeX bleibt ganz; die Policy `hainrich` lässt als Skript-Adresse nur den Such-Worker zu. Am Host fehlt die CSP noch, sie kommt nach dem Ausspielen (Abschnitt 5). | `site/sicher.js`, `site/app.js`, `site/fragen.js`, `site/serve.mjs` |
| HTML b19, jetzt ganz | Auch in der Moderation steht jeder Fehler an seinem Feld, mit `aria-invalid` und `aria-describedby`, und `autofocus` setzt die Tastatur ins erste Feld mit Fehler; die Seiten bleiben ohne Skript. Fehler ohne Feld stehen oben. | `lib/mod.js`, `lib/mod-pages.js` |
| HTML b23 | Löschen fragt in einem `<dialog>`, die Tastatur steht auf „Behalten“, Escape behält, danach ist sie wieder am Knopf. | `lib/site.js`, `site/fragen.js`, `site/style.css` |
| HTML b5, jetzt ganz am Kurscode | `autocomplete="off"` ist weg, das Feld hat einen `name`. Der Name in der Anmeldung und „Weiter“ sind unverändert. | `lib/site.js` |
| CSS B10 | `--feldrand` für Eingabefelder: hell 3,7:1 gegen die Karte, dunkel 3,8:1; vorher 1,4:1. | `site/style.css` |
| JS (c) 5 | Tag der Frage und Prüftag als Berliner Tage, über `Intl.DateTimeFormat` mit `Europe/Berlin`. Zahlen und Deckel bleiben UTC. | `lib/tag.js`, `lib/fragen.js`, `lib/pending.js`, `lib/store.js` |

**Geprüft am lokalen Bau** (Stand vom Server vom 22.11.): `npm test` 321 von 321. `npm run smoke` 24 von 24 in Chromium, Firefox und
WebKit, darunter die Suche mit dem Modell im Worker unter Trusted Types und ein Test, dass Chromium rohes HTML abweist. `smoke:mod` 28 von
28 in Chromium und Firefox, darunter: DOMPurify entfernt am HTML von Frage und Entwurf nichts; der Dialog; die Tastatur im Feld mit dem
Fehler; ein schneller zweiter Klick auf denselben Pfeil wartet auf den ersten (mit Gegenprobe: ohne die Reihe in `site/stimmen.js` rot).

**Nicht geprüft:** der Dialog und die Feldfehler mit einem Vorleseprogramm; die Moderation unter WebKit; Trusted Types am Host.
