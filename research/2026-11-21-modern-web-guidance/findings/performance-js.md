# Modern Web Guidance (64a6d70): Performance, JavaScript, WebAssembly

Repo `main` bei d417706, gelesen am 2026-11-21. Selbst gemessen habe ich nichts; die Messwerte stammen aus `research/2026-11-17-seo-audit/` und `research/2026-11-19-seo-audit/`. Die `npx`-Aufrufe in den Leitfäden habe ich nicht ausgeführt.

## Gelesene Leitfäden

**Ganz gelesen:** performance/performance, js/js, wasm/cpp-on-the-web, performance/efficient-background-processing, performance/identify-inp-causes, performance/break-up-long-tasks, performance/schedule-tasks-by-priority, performance/optimize-preload-priority, performance/optimize-script-priority, performance/deprioritize-background-fetches, performance/improve-next-page-load-performance, performance/optimize-image-priority, performance/detect-initial-visibility-state, performance/conditional-async-dependencies, performance/identify-heavy-scripts, performance/defer-rendering-heavy-content.

**Teilweise gelesen:** js/capture-location-agnostic-data, js/coordinate-global-events, performance/deliver-optimized-decorative-images, performance/resolution-optimized-pseudo-elements, performance/interactions-in-complex-layouts, performance/defer-work-until-scroll-ends, performance/calculate-total-foreground-time, performance/interaction-paint-timing, pwa/install-web-app, pwa/migrate-web-app-origin.

**Nur nach dem Titel eingeordnet:** performance/batch-analytics-events, performance/full-session-analytics, performance/flicker-free-client-side-ab-testing, performance/faster-spa-view-transitions, performance/out-of-order-html-streaming, performance/lazy-load-video-and-audio, js/calculate-event-differentials, js/sort-high-precision-timestamps, js/support-global-calendar-systems.

## Nicht anwendbar

- Video und Audio, SPA-Übergänge, HTML-Streaming, A/B-Tests, Scroll-Handler, Drag-and-drop und große Grids: Die Site hat nichts davon.
- Die Analytics-Leitfäden (Batching, ganze Sitzung, Zeit im Vordergrund, Paint-Timing): Die Site misst nichts im Feld, siehe (c) 2.
- `content-visibility` und `contentvisibilityautostatechange`: Die Seiten sind klein, es gibt weder Animation noch Canvas, und das Polling ist begrenzt.
- `image-set()`: Das einzige Bild im CSS ist `muster.svg`, eine Vektormaske (style.css:264).
- Scheduler-API: Im Hauptfaden laufen keine langen Aufgaben.
- WASM §1, §5 und §6 (Flags, Linken, Portieren): Es gibt keinen eigenen C- oder C++-Code, ORT kommt fertig gebaut.
- PWA: Es gibt kein Manifest. Nebenbei: `icon-192.png`, `icon-512.png` und `icon-maskable-512.png` werden gebaut und ausgeliefert (build.mjs:102), aber keine Seite verweist auf sie.
- Temporal für Dauern, zum Sortieren von Zeitstempeln und für fremde Kalender: kommt nicht vor.

## Befunde

### performance/performance

(a) erfüllt:
1. Die Skripte stehen als `type="module"` im Kopf und laufen damit aufgeschoben. Kein `async`, und das ist richtig, denn app.js greift beim Auswerten auf das DOM zu (site.js:284, app.js:8). Fremde Skripte gibt es nicht.
2. zitate.js und stimmen.js laden nur dort, wo sie gebraucht werden (site.js:484, 559).
3. Die Schrift wird einmal vorgeladen, mit `as`, `type` und `crossorigin`, ohne `fetchpriority`. Sie trägt H1 und Marke, ist auf Latin beschnitten und hat `font-display: swap` (site.js:281, style.css:35 und 266, build.mjs:109). Die KaTeX-Schriften werden nicht vorgeladen.
4. Das schwere JS lädt erst, wenn jemand suchen will: Der Worker startet beim ersten Fokus (app.js:127). Der Smoke-Test prüft, dass davor keine Anfrage hinausgeht (smoke/site.spec.mjs:21).
5. Die Eingabe ist entprellt, 200 ms (app.js:128–131). Veraltete Treffer fallen über `nummer` weg (app.js:113).
6. BM25, Profile und Inferenz laufen im Worker (such-worker.js).
7. Kein `no-store`: Seiten, CSS und JS haben `no-cache` mit ETag, Schrift und KaTeX-CSS einen Tag (`research/2026-11-17-seo-audit/findings/technik.md`, Zeilen 10 und 49).
8. Im Browser läuft kein `setInterval`. „Meine Fragen“ fragt per `setTimeout` alle 3 s nach, höchstens 240 s lang (fragen.js:8–9, 142).
9. Kein `content-visibility` auf kleinen Seiten, wie der Leitfaden es will.

**(b) 1. Die Stichwortsuche wartet auf transformers.js.** such-worker.js:5 importiert `transformers.min.js` statisch. Ein Modul-Worker beginnt erst zu laufen, wenn sein ganzer Importgraph geladen und geparst ist. `stichworte()` (Z. 76–78) startet deshalb erst nach 588 KB Rohtext. Das sind 141 KB Brotli, lokal nachgerechnet mit Stufe 11 wie build.mjs:139. Auf dem Profil von perf.mjs (1,6 MBit/s, 150 ms) ist das grob 0,7 s Übertragung plus Parsen bei vierfacher Drosselung, geschätzt und nicht gemessen.

Schwerer wiegt etwas anderes. Lädt oder parst die Datei nicht, scheitert der ganze Worker (app.js:92), und es erscheint „Die Suche ließ sich nicht laden“ statt der Stichwortsuche. Das widerspricht dem Kopfkommentar in Z. 2 und Plan §6.2 („auch als Rückfall“). Der Smoke-Test sperrt nur `wasm/` (smoke/site.spec.mjs:78–82).
- Regel: „DO use dynamic imports: Split routes or heavy UI libraries“.
- Baseline: Der Leitfaden nennt keine. ORT lädt seine `.mjs` im selben Worker bereits per `import()`.
- Fix: Z. 5 streichen und in `modell()` `import('./transformers.min.js')` in das `Promise.all` neben `vektoren.json` setzen. Smoke-Test zusätzlich mit gesperrtem `transformers.min.js`.
- Server: nein.

**(b) 2. KaTeX-CSS auch auf Seiten ohne Formel.** site.js:282 setzt `katex.min.css` render-blockierend auf jede Seite, auch auf Über, Impressum, Datenschutz, Nutzungsbedingungen und 404. In `site/texte/*.md` steht kein `$`.
- Regel: „DON'T load invisible or unreachable CSS/JS“.
- Baseline: keine genannt.
- Wirkung gering: 2,9 KB Brotli, einen Tag im Cache.
- Fix: In `shell` nur ausgeben, wenn `body` den Text `class="katex` enthält oder `app.js` bzw. `fragen.js` geladen wird. Diese beiden fügen Server-HTML mit Formeln ein.
- Server: nein.

**(b) 3. Das Modell liegt ohne Version im Cache Storage (unsicher).** transformers.js 4.3.2 öffnet im Worker `caches.open('transformers-cache')`; `useBrowserCache` ist gleich `"caches" in self`. Treffer im Cache nimmt es vor dem Netz. Das habe ich aus dem Bundle gelesen, nicht im Browser beobachtet. Der Pfad `models/e5s-16384/…` trägt keinen Inhalts-Hash (model.js:5, build.mjs:117).

Ein Neuschnitt unter demselben Namen (Plan §6.2: „ein Neuschnitt ist ein Skriptlauf“) ließe Browser, die schon gesucht haben, beim alten Modell und Tokenizer, während `vektoren.json` neu ist. Die rund 21 MB des alten Modells blieben liegen.
- Regel: „DON'T bypass versioning“ und „DO restrict cache sizes and expiry“. Beide stehen im Abschnitt zu Service Workers; ich wende sie sinngemäß auf Cache Storage an.
- Baseline: keine genannt.
- Fix: `MODEL_ID` mit einem SHA-Präfix aus `MODEL_SHA` bilden, oder den Bau abbrechen, wenn sich `MODEL_SHA` ändert und `MODEL_ID` gleich bleibt. Optional alte Schlüssel in `transformers-cache` löschen.
- Server: nein.

**(b) 4. Das Foto ist ein JPEG.** `moderation-konrad.jpg` hat 150×150 Pixel und 9,5 KB und wird mit 56 px gezeigt (site.js:409).
- Regel: „DO serve modern formats (AVIF / WebP / JPEG XL)“.
- Baseline: keine genannt.
- Lohnt kaum: ein paar KB, nur auf Seiten mit einer Antwort der Moderation.
- Server: nein.

**(c) 1. Das kritische CSS steht nicht inline** (site.js:283).
- Regel: „DO inline critical CSS“.
- Grund: Die CSP hat `style-src 'self'` ohne Inline-Stile (`research/2026-11-17-seo-audit/findings/technik.md`, Zeile 70). Gemessen sind LCP 0,58 bis 0,71 s gedrosselt und CLS 0 (2026-11-19, §4). Inline-CSS bräuchte einen Hash in der CSP im Server-Repo.
- Einen Planeintrag gibt es dazu nicht; der Grund folgt aus CSP und Messung.

### performance/identify-inp-causes, identify-heavy-scripts, detect-initial-visibility-state

**(c) 2. Keine Felddaten.**
- Regel: „DO beacon back the required information to an analytics service“.
- Grund: „Lesen sendet nichts“ (stimmen.js:2, app.js:3). Der Smoke-Test verlangt null Anfragen (smoke/site.spec.mjs:21), der Plan „keine Anfrage vor dem ersten Klick“.
- Baseline: Event Timing ist Newly (seit 2025-12-12; Chrome 76, Edge 79, Firefox 89, Safari 26.2). Long Animation Frames ist eingeschränkt (Chrome/Edge 123), VisibilityStateEntry ebenso (Chrome/Edge 115).
- Hinweis, nicht gezählt: perf.mjs beobachtet `longtask`. `long-animation-frame` würde im Chromium des Labors zeigen, was die lange Aufgabe auf s09 war (TBT 33 ms, 2026-11-17, §4).

### performance/break-up-long-tasks, schedule-tasks-by-priority

(a) Im Hauptfaden laufen keine langen Aufgaben. Eine Trefferliste hat höchstens 8 Zeilen (app.js:67–73, such-worker.js:10–11). Beim Tippen während des Modell-Downloads wurde keine lange Aufgabe gemessen (17.11., §4). Die Scheduler-API (eingeschränkt: Chrome/Edge 129, Firefox 142, nicht Safari) braucht es nicht.

### performance/optimize-preload-priority, optimize-script-priority, optimize-image-priority

(a) Es gibt einen Preload (die Schrift), nirgends `fetchpriority` und nirgends `importance`. Die Bilder haben `width` und `height` (site.js:287, 409–410). Fetch Priority ist Newly seit 2024-10-29.

(a) Ein LCP-Bild gibt es nicht. Dass das LCP-Element Text ist, ist unsicher: perf.mjs zeichnet `lcpEl` auf, aber der Bericht nennt es nicht.

### performance/deprioritize-background-fetches

(a) Es gibt keine Beacons und keine Telemetrie, jeder `fetch` folgt einem Klick. Im Worker laden Stichwortdaten und Modell nacheinander (such-worker.js:77–80) und konkurrieren nicht. Der Fix zu (b) 1 behält diese Reihenfolge bei.

### performance/improve-next-page-load-performance

**(b) 5. Keine Speculation Rules.** Die Site ist eine statische MPA mit 97 Seiten.
- Regel: „DO use speculation rules for static sites“.
- Baseline: eingeschränkt, Chrome/Edge 109, nicht Firefox und Safari.
- Vorschlag: nur `prefetch`, als Dokumentregel `href_matches: "/eidl/*"`, ausgenommen `/eidl/mod/*`, `/eidl/api/*`, `/eidl/f/neu/*` und `[rel~=nofollow]`, mit `eagerness: "moderate"`.
- Die CSP (`script-src 'self'`) verbietet die Regel inline, deshalb ist das ein **Wunsch an den Server**.
- Nutzen mäßig, die Seiten laden schon jetzt mit LCP um 0,6 s.

### performance/conditional-async-dependencies

(a) Top-Level-`await` steht nur im Einstiegsmodul des Workers (such-worker.js:76–87), das kein anderes Modul importiert. Der Safari-Fehler bis 26.6 (gleichzeitige Importe eines TLA-Moduls) greift deshalb nicht. Baseline: Newly seit 2026-09-14.

### wasm/cpp-on-the-web

(a) WASM läuft in einem dedizierten Modul-Worker (§3.1; app.js:90, model.js:12).

(a) Getestet wird im echten Browser, in drei Engines, auch der Rückfall ohne WASM (§4; smoke/site.spec.mjs:78).

**(c) 3. Ein Thread** (model.js:13).
- Regel: „-pthread requires SharedArrayBuffer“, und das wiederum braucht Cross-Origin-Isolation.
- Grund: Plan §6.2 und §18, „11 statt 31 ms, unnötig“; deshalb auch kein COEP.
- Baseline: keine genannt.

### js/js

(a) `replaceChildren` (app.js:68–69, fragen.js:135–138).
(a) `URLSearchParams` für `?kapitel` (fragen.js:194).
(a) `[...chosen]` bleibt stehen, weil `chosen` ein Set ist (search.js:77, 80). Es gibt keinen JSON-Klon, kein `createEvent` und kein `fromCharCode`.

**(b) 6.** site.js:331 sortiert mit `[...threads].sort(…)`; besser `threads.toSorted(…)`.
- Regel: „DO use array.toSorted(compareFn) instead of [...array].sort(compareFn)“.
- Baseline: keine genannt. Der Code läuft im Bau unter Node 26.
- Trivial. compare.js:11 ebenso, falls `keys` immer ein Array ist (unsicher).

**(c) 4. Die mailto-Query ist von Hand gebaut** (site.js:369–370).
- Regel: „DO use new URLSearchParams(search) to read or mutate parameters“.
- Grund laut Kommentar: RFC 6068 verlangt `%20`. `URLSearchParams` schreibt `+`, und Mailprogramme können das wörtlich nehmen. Richtig so.

### js/capture-location-agnostic-data, js/coordinate-global-events

**(c) 5. Tage zählen in UTC (teils unsicher).** Gebildet werden sie mit `toISOString().slice(0, 10)` (lib/fragen.js:45, lib/pending.js:20, lib/store.js:60/65 für `geprueftAm`). Die Moderation sagt dazu ausdrücklich „Tage in UTC“ (lib/mod-pages.js:319), für die öffentlichen Daten steht das nirgends.

Öffentlich heißt das: Eine Frage zwischen 0 und 1 Uhr Berliner Zeit (im Sommer bis 2 Uhr) trägt in `<time>` und `dateCreated` den Vortag.
- Regel: „DO use Temporal.ZonedDateTime for events that are bound to a specific geographical location“.
- Baseline: Temporal ist eingeschränkt (Chrome/Edge 144, Firefox 139, nicht Safari). Der Code läuft aber unter Node; ob Node 26 Temporal ohne Flag hat, ist unsicher.
- Wenn gewollt: `Temporal.Now.plainDateISO('Europe/Berlin')` oder `Intl.DateTimeFormat` mit `timeZone: 'Europe/Berlin'`.

## Zählung

| | Anzahl |
|---|---:|
| (a) erfüllt | 20 |
| (b) Abweichung | 6 (die wichtigste ist 1; 2, 4 und 6 sind gering, 3 ist unsicher, 5 ist optional) |
| (c) bewusst anders | 5 |

## Wünsche an den Server

1. Nur falls Konrad Spekulation will (b 5): die Kopfzeile `Speculation-Rules: "/eidl/spekulation.json"` auf den HTML-Antworten, und die Datei mit `Content-Type: application/speculationrules+json` ausliefern (bauen kann sie build.mjs). Alternative: die CSP um einen Hash der Inline-Regel erweitern.

Sonst ist keiner nötig: (b) 1 bis 4 und 6 sind reine Änderungen im Repo.

## Fragen an Konrad

1. Soll spekulativ vorgeladen werden? Das wirkt nur in Chromium. Der Server sähe dann auch Abrufe von Seiten, die niemand öffnet, und das Server-Repo bräuchte die Kopfzeile.
2. Ist ein Neuschnitt des Modells unter dem Namen `e5s-16384` denkbar? Dann gehört eine Version in den Pfad (b 3).
3. Sollen öffentliche Daten (Tag der Frage, Prüfdatum) Berliner Tage sein statt UTC-Tage?
