# Technik, Stand 2026-11-17 (dritter Durchgang)

Grundlage: `crawl.json`, `auswertung.txt`, `robots.txt`, `sitemap.xml`, `seiten/*.html`, `lib/site.js`, `test/vorschau.test.mjs`, dazu 17 Abrufe am Host (GET/HEAD, eine Sekunde Pause, nichts unter `/eidl/api/` oder `/eidl/mod/`).
Gesehen = an Datei oder Antwort nachgeprüft. Angenommen = aus Erfahrung, vermerkt.

## 1. Gegen gestern (Bericht vom 16.11.)

1. Zwei Schalter ohne gemeinsamen Test: **behoben.** `test/vorschau.test.mjs` baut mit `vorschau: true` und `false`, prüft `robots` je Seite und die Orte der Sitemap (Zeilen 26 bis 41). Ob `meta.vorschau` auf dem Server stimmt, bleibt ungeprüft (siehe 4.).
2. Frageseite mit gemischten Antworten: **behoben.** `reviewed` verlangt `every(geprüft)` und mindestens eine Antwort (site.js:20), Test I9 (site.test.mjs:320), Vorschautest Zeile 34.
3. Cache-Control auf Assets: **behoben, mit Rest.** Schrift, Logo, Favicons, Apple-Icon, `moderation-konrad.jpg`, `katex.min.css`: `public, max-age=86400, stale-while-revalidate=604800` (crawl.json `assets`). Hinzu kommt `og-card.png` (HEAD, gleicher Wert) und `/favicon.ico` an der Wurzel (HEAD, gleicher Wert). CSS und die vier Skripte bleiben `no-cache` mit ETag. Siehe Befund M3 zur Aufteilung.
4. 404 mit Selbst-Canonical: **teils behoben.** Die 404-Seite hat jetzt keinen Canonical mehr (GET `/eidl/gibtsnicht/`: `noindex`, kein `rel="canonical"`). Die Links zu den Unterforen fehlen weiter (nur Kopf, Fuß und „Zum Forum“). Status 404, `no-cache`, volle Sicherheitskopfzeilen.
5. `/eidl/index.html` liefert 200: **offen.** HEAD: 200, 5684 Bytes, wie `/eidl/`. Der Canonical im Text zeigt auf `/eidl/` (gesehen in der Datei), also kein Schaden.
6. 29 `f/neu/?kapitel=…`: **offen, unverändert harmlos.** Titel gleich, `noindex`, Canonical `f/neu/`. Beliebige Parameter liefern 200 (HEAD `…/f/s09/?utm=x`: 200, Canonical im Text sauber). Siehe M2.
7. 301/308 gemischt: **offen.** `/eidl` und `/` 301, `/eidl/f/s09` und `http://` 308. Unschädlich.
8. Keine Paginierung: **offen, unverändert unkritisch** bei 31 Fragen. Keine Waisen, kein toter Link (`auswertung.txt`).
9. Sitemap `text/xml`: **offen**, gültig (HEAD: `text/xml; charset=utf-8`). OFL.txt ohne X-Robots-Tag, harmlos.
10. `/eidl/robots.txt`: **nicht erneut geprüft** (Abrufe gespart); die Hostdatei `/robots.txt` entspricht der lokalen `robots.txt`. Der Hinweis zum Server-Repo gilt weiter.
11. Vorschau gewollt: kein Befund.
12. QAPage fehlte: **behoben,** 31 von 31 Frageseiten tragen `QAPage` und `Person`, Start `WebSite`.

## 2. Ende der Vorschau: was würde indexierbar, was stünde in der Sitemap (lib/site.js)

Gelesen: `reviewed` (20), `chapterIndexable` (37), Seiten-`robots` (315, 360, 390, 427), `sitemap` (504 bis 511), `shell` (187), `build.mjs:161`.

| Seite | indexierbar, wenn | Sitemap, wenn |
|---|---|---|
| Frage | `reviewed(q)` | `reviewed(q)` |
| Unterforum | irgendeine Frage geprüft | `threadsOf(forum, geprüfte)` nicht leer |
| Kapitel | mindestens 3 geprüfte Fragen | dieselbe Funktion `chapterIndexable` auf den geprüften |
| Start | irgendeine Frage geprüft | `threads.length`, gleiche Bedingung |
| `ueber/` | immer `index,follow` | nur wenn `threads.length` |
| Rest, `f/neu/`, 404 | nie | nie |

Ergebnis: **Frage, Unterforum, Kapitel und Start decken sich genau** (Gleichheit im Quelltext und im Vorschautest belegt). Einzige Abweichung ist `ueber/` (siehe N1). Mit `vorschau: true` erzwingt `shell` `noindex`, die Sitemap ist leer: stimmig.

Zahlen aus dem Crawl: 31 Fragen, davon in den Seiten 30 mit „Geprüft am“ und eine Testfrage der Moderation (`bf8ec38f9c86`, Antwort der Moderation, Badge „geprüft“, ohne Datum). Alle 31 sind nach `reviewed` geprüft. Die 31 Fragen verteilen sich auf 28 Kapitel mit je 1 oder 2 Fragen (Crawl: Fragenseiten, die auf ein Kapitel zurückverlinken). **Kein Kapitel erreicht drei.** Am Tag danach wären also indexierbar und in der Sitemap: Start, `ueber/`, 4 Unterforen, 31 Fragen = **37 URLs**; die 29 Kapitelseiten bleiben `noindex` und draußen.

## 3. Neue Befunde

### Hoch
Keine.

### Mittel

**M1. `lastmod` fehlt in der Sitemap, obwohl es ein Prüfdatum gibt.** `sitemap()` schreibt nur `<loc>` (site.js:509). `answers.geprueft_am` existiert (store.js:44, als `geprueftAm` im Objekt), und die Seite zeigt es als `<time datetime>`. Zu tun: `lastmod` einer Frage = jüngstes `geprueftAm` ihrer Antworten (Antwort ändern setzt neu); für Unterforum, Kapitel und Start das Maximum der enthaltenen Fragen; `ueber/` nur aus einem Quelldatum, sonst weglassen. **Nicht** aus Stimmen oder Seitenbau-Zeit ableiten, sonst wird `lastmod` bei jedem Bau neu und verliert seinen Wert. Dass Google `lastmod` nur beachtet, wenn es verlässlich stimmt, ist Erfahrungswissen, die aktuelle Dokumentation konnte ich nicht nachschlagen. Gewinn klein bei 37 URLs; der Test aus Zeile 41 würde nach dem Vorbild `<lastmod>` prüfen. Erfolgskontrolle: `curl sitemap.xml | grep -c lastmod` gleich Zahl der URLs.

**M2. `f/neu/?kapitel=…`: Signal ist sauber, die Links nicht.** Auf jeder Kapitelseite zeigt der Knopf „Frage stellen“ zweimal auf `../../neu/?kapitel=<slug>` (gesehen in `eidl__f__kapitel__tensoren.html`), ohne `nofollow`. Die Seiten tragen `noindex` plus Canonical auf `f/neu/`; das widerspricht sich leicht (Canonical sagt „zusammenführen“, `noindex` sagt „raus“), und Google nimmt dann in der Regel `noindex` (angenommen). Schaden unwahrscheinlich. Nicht in `robots.txt` sperren (Google sähe das `noindex` nie). Zu tun, wenn man es sauber haben will: bei den Varianten den Canonical weglassen und nur `noindex,follow` setzen. Erfolgskontrolle: Suchkonsole „Duplikat, vom Nutzer nicht als kanonisch gewählt“ bleibt leer (sagt nur etwas nach dem Start).

**M3. Cache-Aufteilung: richtig, mit einer Einschränkung.** CSS, Skripte und Seiten haben keinen Hash im Namen, also ist `no-cache` mit ETag (Revalidierung, 304) die richtige Wahl; ein Tag Cache auf `style.css` würde Besucher mit altem CSS auf neuem HTML lassen. Schrift, Logo, Icons, `og-card.png` mit einem Tag plus SWR sind sinnvoll, solange sie sich selten ändern. Die Einschränkung: Wird das Logo oder `moderation-konrad.jpg` ersetzt, sehen Besucher es bis zu einen Tag lang alt (mit SWR bis zu acht Tage ohne Wartezeit, aber nachgeladen). Annahme: Das ist für dieses Material in Ordnung. Wer mehr will: Hash im Dateinamen für CSS und Skripte, dann `immutable, max-age=31536000`; das lohnt bei 5 Dateien und LCP unter 1 s nicht. Ein Zwischenweg ohne Umbau wäre `max-age=300` auf CSS und JS. Nicht nötig.

### Niedrig

**N1. `ueber/` ist nach dem Ende der Vorschau immer `index,follow`, in der Sitemap steht sie nur, wenn es eine geprüfte Frage gibt** (build.mjs:161, site.js:507). Praktisch ohne Folge, weil es 31 geprüfte Fragen gibt. Wer ganz stimmig sein will: `ueber/` in die Sitemap, sobald `!site.vorschau`.

**N2. „Moderation“ im Fuß, Ziel gesperrt.** Alle 99 Seiten verlinken `mod/` mit `rel="nofollow"`, `robots.txt` sperrt `/eidl/mod/`. Der Crawl konnte die Seite nicht laden (`blocked`), und ich darf `/eidl/mod/` nicht abrufen: **Dass sie `noindex,nofollow` trägt, habe ich nicht gesehen, nur laut Kommentar site.js:174 angenommen.** Bewertung: unkritisch. Ein `noindex` auf einer gesperrten Seite wird von keinem Crawler gelesen; es bliebe nur wirksam, wenn die Sperre fiele. Eine gesperrte, intern verlinkte Adresse kann im Index als reine URL ohne Text auftauchen (Erfahrung), aber nur bei externen oder breit gestreuten Links. Der interne Link ist `nofollow`, die Adresse steht nirgends sonst. Verschenkte Linkkraft: ein Link pro Seite auf ein Ziel, das nichts erben soll, das ist vernachlässigbar. Wenn man ein Restrisiko ausschließen will: Sperre aufheben, `noindex` lesbar lassen (der Zugang bleibt durch die Anmeldung geschützt). Dagegen spricht nur Crawler-Rauschen am Anmeldeformular. Empfehlung: so lassen.

**N3. „Melden“ an jedem Beitrag.** Linkziel `impressum/#inhalte-melden`, Anker existiert (gesehen), Impressum ist `noindex` (Seite und Anker sind für die Suche ohne Wert). Ein Frageseiten-Crawler sieht pro Seite 3 Links dorthin (zwei „Melden“, einer im Fuß), alle ohne `nofollow`. Kein Problem: der Weg ist für Nutzer da, `noindex,follow` auf Impressum lässt die Linkkraft weiterlaufen. Kein Handlungsbedarf.

**N4. Breadcrumb-JSON-LD zeigt auf `noindex`-Kapitelseiten.** Auf jeder Frage und Kapitelseite nennt `BreadcrumbList` die Kapitel-URL (gesehen bei s09). Solange ein Kapitel unter drei geprüften Fragen hat (heute alle 29), ist das Ziel `noindex`. Folge: Google kann den Pfad lesen, zeigt ihn eventuell nicht (Annahme). Wenn Kapitel ab drei Fragen indexierbar werden, löst sich das von selbst. Kein Eingriff.

**N5. 404-Seite ohne Unterforen-Links.** Nur „Zum Forum“ (Kopf, Fuß). Zu tun: drei bis vier Links zu den Unterforen. Prüfen: GET auf eine unbekannte Adresse.

**N6. `/eidl/index.html` 200** (siehe oben). Zu tun: Redirect `index.html` nach `./` in Caddy. Prüfen: HEAD gibt 301/308.

**N7. Weitere Redirect-Eigenheiten.** `http://…/eidl/` 308 (ohne HSTS-Kopf, das ist normal bei HTTP), `/eidl` 301, `/eidl/f/s09` 308, `?utm=x` bleibt 200 (Canonical rettet). Gross- und Kleinschreibung: `/eidl/F/s09/` liefert 404 (kein Soft-404, gleiche Seite wie die 404, `noindex`). `f/s30/` liefert jetzt 404, mit Seite, 2683 Bytes, nicht umgeleitet. Das stimmt mit „gelöscht“; für kurze Zeit könnte `410` das Entfernen beschleunigen, aber s30 war nie indexierbar (`noindex`), kein Handlungsbedarf.

## 4. Kopfzeilen (4. Frage)

Gesehen an allen 99 HTML-Antworten im Crawl und am Host (Start, s09, 404, `/`, `/eidl`): 
- CSP: `default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'` auf jeder Antwort, auch Redirects, 404 und `favicon.ico` an der Wurzel. `form-action 'none'` ist bei Formularen per JS-Anfrage in Ordnung (das Formular läuft über `connect-src`); Test `smoke` deckt es laut Projekt ab, hier nicht nachgeprüft.
- `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (redundant zu `frame-ancestors 'none'`, schadet nicht), `Cross-Origin-Opener-Policy: same-origin`: überall gleich. Im Crawl fehlt COOP in der Auswertung, am Host ist sie da.
- HSTS: `max-age=31536000` überall. Kein `Permissions-Policy` (kein Befund, es gibt keine Kamera/Mikrofon-Funktionen).
- Nur die 308 auf `http://` trägt keine Sicherheitskopfzeilen (normal).
- **HSTS ohne `includeSubDomains` und ohne `preload`: richtig so.** Eine Subdomain kann die Wirkung auf andere Subdomains nicht verantworten; `includeSubDomains` auf `hai.konradvoelkel.com` würde nur dessen Unterdomänen binden (es gibt keine). `preload` verlangt die Registrierbare Domain (Apex) mit `includeSubDomains`, würde also `konradvoelkel.com` und `www` mitbinden und ist für eine Subdomain nicht vorgesehen (Erfahrung, Dokumentation nicht nachgeschlagen). Kein Befund. Optional: `max-age` nach ein paar Monaten auf zwei Jahre, ohne praktischen Wert.
- Kompression: `br` (Start 1965 Bytes), `zstd` (s09: 10 635 Bytes), `gzip` (s09: 13 833 Bytes) gehen alle; unkomprimiert hat s09 186 016 Bytes. `Vary: Accept-Encoding` gesetzt. Kein Text über 2 KB unkomprimiert im Crawl.
- Fehlerseite: 404 mit `no-cache`, `noindex`, ohne Canonical.

## 5. Was ein Crawler am ersten Tag falsch verstehen könnte
- `/eidl/index.html` neben `/eidl/`: gleiche Bytes, Canonical sauber, kein Schaden (N6).
- Parameter: beliebige Anfrage-Strings liefern 200 mit Selbst-Canonical ohne Parameter. Gut.
- Gross/Klein: 404. Gut.
- Fehlerseite: echte 404, kein Soft-404.
- Sitemap und `robots.txt` stehen am Host korrekt (die `robots.txt` auf Hostebene, mit Verweis auf `/eidl/sitemap.xml`; die Sitemap dort ist heute leer, gewollt). Ob eine nicht-leere Sitemap später ankommt, hängt am Bau (`meta.vorschau`).
- Kapitelseiten bleiben am Tag danach alle draußen (Abschnitt 2). Das ist gewollt, aber die Startseite und die Fragen verlinken sie weiter; Navigation ohne Indexierung, kein Fehler.
- Die zwei Testfragen des Eigentümers (`bf8ec38f9c86`, `0cfd2b864eda`) wären am Tag danach indexierbar und in der Sitemap, wenn sie `reviewed` erfüllen. Beide tun das (`geprüft`). Das ist Inhaltsentscheidung: falls es keine Beispiele sein sollen, vorher verstecken oder die Antwort auf `entwurf` stellen.

## 6. Punkte (Einschätzung, keine Messung)
- 2026-11-16: **86.**
- 2026-11-17: **90.** Begründung: Tests für beide Schalter, gleiche Regeln in Seite und Sitemap, Kopfzeilen lückenlos, Kompression modern, Cache-Aufteilung stimmig; abgezogen für fehlendes `lastmod`, `index.html` 200, gemischte Redirect-Codes, magere 404-Seite.

## 7. Nicht geprüft
- `/eidl/mod/` (verboten): Inhalt, `noindex`, Statuscode.
- Caddyfile und `public.db` auf dem Server: der Wert von `meta.vorschau` und der Server-Teil der Seitenerzeugung sind nur durch den Test belegt, nicht live.
- Verhalten bei einem Googlebot oder Bingbot, Suchkonsole, tatsächliche Indexierung: nicht möglich ohne fremden Dienst.
- Googles aktuelle Dokumentation zu `lastmod`, HSTS-Preload, `noindex` bei gesperrten Seiten: nicht nachgeschlagen, die Angaben sind Erfahrungswissen.
- `www.`-Redirects und `/eidl/robots.txt`: nicht erneut abgerufen.
- Leistung: Aufgabe eines anderen Skripts.

Abrufe am Host: 17 (HEAD oder GET, Pause 1 s, kein `/eidl/api/`, kein `/eidl/mod/`).
