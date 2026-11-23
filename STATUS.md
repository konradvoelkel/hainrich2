# Status

_Stand 2026-11-23._

## Was existiert

- **Am 2026-11-23 gebaut, noch nicht ausgespielt** (Konrads Entscheidungen vom selben Tag, Plan D52; Bericht
  `research/2026-11-21-modern-web-guidance/`, Abschnitt 10):
  - _Trusted Types öffentlich:_ DOMPurify 3.4.18 säubert HTML vom Server im Browser ein zweites Mal, die Policy `hainrich` lässt nur den
    Such-Worker als Skript zu (`site/sicher.js`). Die CSP in `site/serve.mjs` verlangt das; am Host fehlt sie, bis die Skripte draußen sind.
  - _Moderation:_ Fehler vom Server stehen an ihrem Feld, die Tastatur geht dorthin, ohne Skript.
  - _Fragepfad:_ Löschen fragt in einem `<dialog>`, die Tastatur steht auf „Behalten“. Der Browser darf den Kurscode anbieten.
  - _Bild:_ Eingabefelder mit einem Rand von mindestens 3:1.
  - _Tage:_ Tag der Frage und Prüftag sind Berliner Tage (`lib/tag.js`), Zähler und Deckel bleiben UTC.
  - _Tests:_ ein Browser-Test für den schnellen Doppelklick beim Abstimmen, mit Gegenprobe.
  - **Belegt am lokalen Bau:** `npm test` 321 von 321; `npm run smoke` 24 von 24 in Chromium, Firefox und WebKit; `smoke:mod` 28 von 28 in
    Chromium und Firefox.
  - **Nicht geprüft:** Vorleseprogramm, Moderation unter WebKit, alles am Host.
- **Geprüft am 2026-11-21 gegen Googles Modern Web Guidance** (Commit `64a6d70`, gelesen, das Werkzeug lief nicht), am Code von
  `d417706`: 83 Punkte erfüllt, 55 Abweichungen, 22 bewusst anders, Bericht in `research/2026-11-21-modern-web-guidance/`. Eine
  Browser-Politik hat das Repo nicht, ein Vorschlag steht im Bericht.
  - **Gebaut und ausgespielt am 2026-11-22** (Konrad: „Jetzt ausspielen“; Commit `4cb856e`, statische Seiten um 13:40:11, App um
    13:40:26 mit Neustart von `hainrich2-web`; Bericht, Abschnitt 9): 13 Abweichungen ganz, zwei zum Teil.
    - _Suche:_ Die Stichwortsuche hängt nicht mehr an `transformers.min.js`. Das Modell liegt nicht mehr im Cache Storage.
    - _Fragepfad:_ Ein Doppelklick schickt nichts zweimal. Der Fokus bleibt, und Fehler hängen am Feld. Meldungen stehen leer bereit.
      `aria-invalid` folgt `:user-invalid`.
    - _Semantik und Bild:_ gedrückte Pfeile mit Fläche und Umriss, Pfad als Liste, Namen für Tabellen und Pfeile,
      `<meta name="color-scheme">`.
    - _Moderation:_ Trusted Types in `MOD_CSP`.
    - _Testserver:_ `site/serve.mjs` sendet COOP und HSTS wie der Host.
  - **Belegt:**
    - `npm test` 315 von 315.
    - `smoke` 23 von 23 in Chromium, Firefox und WebKit, darunter ein neuer Test, der `transformers.min.js` sperrt.
    - `smoke:mod` 27 von 27 in Chromium und Firefox.
    - Im Browser angesehen: Pfeile, Fehler am Kurscode, Fokus nach dem Entfernen.
    - _Am Host danach, nur `GET`:_
      - Smoke 23 von 23 in Chromium, Firefox und WebKit, auch mit gesperrtem `transformers.min.js`.
      - Die Seiten aus `live/` tragen das neue Markup: Pfad als Liste, Pfeile mit `aria-describedby`, `color-scheme`.
      - `/eidl/api/token` und `/eidl/api/stimme` 405, Moderation 401, Formular mit `data-zustimmung="4"`.
      - Alle 35 Adressen der Sitemap 200.
      - Im eingebauten Browser: Der alte `transformers-cache` ist nach dem Laden weg, die Suche ist bereit, die Konsole leer.
  - **Offen:** der Feldrand unter 3 zu 1 (das Bild entscheidet Konrad), die Maske am Formelrand, die übrigen niedrigen Punkte.
  - **Nicht geprüft:** mit einem Vorleseprogramm.

- Git-Repo auf `main`, Remote `origin` ist `konradvoelkel/hainrich2` auf GitHub, **öffentlich seit dem 2026-11-18** (Plan D46).
- `DEVELOPMENT_PLAN.md`, `CLAUDE.md`, dieses Dokument.
- CI seit 2026-11-06: `.github/workflows/tests.yml` fährt `npm test` bei jedem Push und Pull Request auf `main`, in einem per
  Digest gepinnten Node-Container in der Fassung des VPS, seit dem 2026-11-19 `node:26.13.1` (davor `node:24.22.2`). Seit dem
  2026-11-10 läuft sie auf GitHubs `ubuntu-24.04`, nicht mehr auf Konrads eigenem Runner `ci-eu`: Der nimmt nur private Repos und
  musste vor einer Veröffentlichung weg.
- **Seit dem 2026-11-19, 09:40, läuft am Host Node 26.13.1** statt 24 (Wechsel aus dem Server-Repo, auf Konrads Wort dort; der
  Web-Prozess startete dabei neu). Vorher lokal unter 26.13.1 geprüft, mit denselben `node_modules`, die `site/deploy-app.sh`
  verschickt: `npm test` 311 von 311 ohne Warnung; Modell und Korpus über `lib/corpus.js` geladen wie im Worker, unter Node 22, 24
  und 26 bitgleiche Vektoren und dieselben Treffer; `smoke` 22 von 22, `smoke:mod` 27 von 27; `server/web.mjs` gegen eine
  Wegwerf-Datenbank. Danach von außen gemessen, nur `GET`: `/eidl/api/token` und `/eidl/api/stimme` 405 von der App, Moderation 401
  von der Schranke, schiefe Pfade 401 oder 404, Formular mit `data-zustimmung="4"`, Sitemap mit 35 Adressen, Smoke gegen den Host 22
  von 22. Nicht geprüft: der erste Lauf des Workers unter Node 26 am Host.
- **Seit dem 2026-11-18 steht vor der Moderation eine zweite Schranke** (Konrads Entscheidung, Plan D50; gebaut und ausgespielt aus
  dem Server-Repo): Basic Auth im Webserver für `/eidl/mod` und alles darunter, `/eidl/api/` bleibt offen, die Anmeldung der App
  bleibt dahinter. Von außen gemessen, nur `GET` und ohne Zugangsdaten: 401 für die Moderation, 405 von der App für `/eidl/api/token`
  und `/eidl/api/stimme`, 200 für die Seiten; Smoke gegen den Host 22 von 22. Nachtrag in `research/2026-11-11-threat-model/`.
- **Gebaut und ausgespielt am 2026-11-18 um 11:26** (Konrad: „Routing der App härten“, Plan D51; Commit `21e5d95`): Die App bedient nur noch Pfade, die roh
  schon so dastehen, wie `new URL()` sie auflöst (`plainPath` in `lib/http.js`), und verteilt ausdrücklich auf Abstimmen, Fragepfad
  und Moderation (`createRouter`); alles andere bekommt 404, nichts fällt mehr von selbst an die Moderation. Moderation und
  Fragepfad prüfen es selbst noch einmal. `server/web.mjs`, das Unit-Gerüst und `smoke-mod/start.mjs` benutzen dieselbe Verteilung.
  Belegt: `test/routing.test.mjs` schickt sieben schiefe Pfade roh über die Leitung, gegen die Verteilung und gegen die Moderation
  allein; keiner erreicht die Anmeldeseite. Gegenprobe: Mit abgeschalteter Prüfung scheitern alle vier Tests. Am Host roh
  nachgemessen, nur `GET` und ohne Zugangsdaten: Sieben schiefe Pfade geben 401 von der Schranke oder 404 „Nicht gefunden.“ von der
  App, keiner die Anmeldeseite; `/eidl/api/token` und `/eidl/api/stimme` 405, das Formular trägt weiter `data-zustimmung="4"`, alle 35
  Adressen der Sitemap 200, Smoke gegen den Host 22 von 22.
- **Gebaut und ausgespielt am 2026-11-18** (Konrads Entscheidungen vom selben Tag, Plan D48 und D49; jeden Wortlaut hat er einzeln
  bewilligt, ein Anwalt hat ihn nicht gelesen; Commit `15b4bf4`, statische Seiten um 10:43:22, App um 10:43:37):
  - _Fragen stellen ab 18 (D48):_ „Ich bin mindestens 18 Jahre alt.“ im Zustimmungstext, **Zustimmung Version 4**; der Server nimmt
    Version 3 nicht mehr an, eine wartende Frage unter Version 3 behält ihren Vermerk „gemeinfrei“. Abschnitt „Wer fragen darf“ in den
    Nutzungsbedingungen, je ein Halbsatz im Datenschutz und auf der Über-Seite. Geprüft wird das Alter nicht.
  - _Rechtstexte genauer (D49):_ Der Datenschutz hat einen Abschnitt „Sicherungen“ (verschlüsselt bei Cloudflare R2, Standort
    Westeuropa, höchstens sechs Monate; beim Ende des Forums werden die Datenbanken gelöscht) und nennt unter „Löschen nach der
    Freigabe“ die Kopien bei Suchmaschinen und Crawlern. Das Impressum sagt, dass das Forum eine Lehrveranstaltung an der HHU
    begleitet und die Universität es nicht betreibt, nicht beauftragt hat und nicht verantwortet; es benennt die Kontaktadresse als
    Kontaktstelle nach Art. 11 und 12 der Verordnung (EU) 2022/2065 und sagt eine Eingangsbestätigung und eine Rückmeldung zu jeder
    Meldung zu. Zitate sind wörtlich „in der Fassung vom Tag der Antwort“, Antworten stehen unter CC BY-SA 4.0, „soweit sie
    urheberrechtlich geschützt sind“. Die Über-Seite sagt, dass der Bot sagen „soll“, wenn er nichts findet.
  - _Belegt:_ zwei neue Tests (`test/fragen.test.mjs` zu Version 4, mit Gegenprobe gegen Version 3 im Code; `test/site.test.mjs` zu
    den Sätzen). Im gebauten Baum stehen alle vierzehn nachgesehenen Sätze auf ihren vier Seiten, der alte Satz „in keiner Verbindung“
    ist weg.
  - _Am Host nachgesehen, nur lesend:_ Die vier Textseiten gleichen dem Bau Byte für Byte und tragen die zwölf nachgesehenen Sätze;
    `f/neu/` trägt `data-zustimmung="4"` und den Satz zum Alter; alle 35 Adressen der Sitemap antworten mit 200; Smoke gegen den Host
    22 von 22; die Schranke vor der Moderation steht nach dem Neustart weiter (401). Wer beim Neustart ein Formular mit Version 3 offen
    hatte, muss neu laden.
  - _Das Deploy-Skript meldete dabei einen Fehler, der keiner war:_ `site/deploy-app.sh` prüfte zum Schluss die Anmeldeseite der
    Moderation auf 200, und dort antwortet seit demselben Morgen die Schranke mit 401. Der Web-Prozess lief und antwortete. Die
    Prüfung fragt jetzt den Fragepfad (`api/token`: 405 von der App, 503 bei geschlossenem Fragepfad, 502 vom Webserver, wenn die App
    nicht läuft). Beim Ausspielen um 11:26 lief sie zum ersten Mal ganz durch: grün, der Web-Prozess antwortete rund acht Sekunden nach dem Neustart.
- **Gebaut und ausgespielt am 2026-11-17** (Konrads Entscheidungen vom selben Tag, Plan D28 bis D33; Commit `35aa8d4`):
  - _Härtungen (D28):_ Eine ungeprüfte Antwort des Bots verlinkt nur ins Skript, Formeln sind auf 20 em begrenzt, der Worker prüft
    Kennung und Länge jedes Auftrags. An Frage und Antwort steht „Melden“. Der Datenschutz sagt über den Checker nur noch, was er erkennt.
  - _Prüfvermerk (D29):_ „Geprüft am … von Konrad Völkel, Autor des Skripts“ an jeder geprüften Antwort des Bots, Absatz „Wer prüft“
    unter `ueber/`, Spalte `geprueft_am` mit Nachtrag aus dem Verlauf. Eine Frageseite ist erst indexierbar, wenn jede Antwort geprüft ist.
  - _Lizenz (D30):_ Zustimmung Version 3, Fragen werden mit dem Absenden gemeinfrei (CC0 1.0); Vermerk an der Frage, Betreiber im Fuß,
    Autor und CC BY-SA 4.0 an den Zitaten.
  - _Kurztitel (D31):_ Feld an der Frage und bei der Freigabe, Sammelseite `/mod/titel/`, 30 Vorschläge für die Beispielfragen in
    `seeds/kurztitel.json`, ein eigener Aufruf des Worker nach der Freigabe oder auf Knopfdruck, mit eigenem Tagesdeckel.
  - _`QAPage` (D32)_ an geprüften Frageseiten, und _der Schalter für die Vorschau (D33)_ unter `/mod/zahlen/`.
  - Tests gegen den lokalen Bau: `npm test` 266 von 266; `npm run smoke` 21 von 21 in Chromium, Firefox und WebKit; `npm run smoke:mod`
    25 von 25 in Chromium und Firefox. Unter WebKit bestehen dort 9 von 25, die übrigen scheitern an der Anmeldung (siehe „Nicht geprüft“).
  - _Abstimmen:_ `site/stimmen.js` arbeitet Klicks nacheinander ab. Vorher las ein zweiter Klick, der die Antwort auf den ersten nicht
    abwartete, den alten Stand, und im Browser konnte die falsche Stimme stehen bleiben. Aufgefallen ist es, weil der Browser-Test dazu in
    Chromium in 2 von 4 Läufen scheiterte; danach liefen 5 von 5. Das ist ein Indiz, kein Beweis, einen eigenen Test für den Doppelklick
    gibt es nicht.
  - _Ausgespielt_ auf Konrads Wort, nach beiden Probeläufen mit vorhergesagter Liste: `site/deploy.sh` um 14:55:09 mit 69 HTML-Seiten,
    `style.css` und `stimmen.js` samt komprimierten Fassungen (284 Dateien, keine Löschung; ein Lauf mit Prüfsummen zeigte genau diese
    284 als inhaltlich anders), `site/deploy-app.sh` um 14:55:37 mit 13 Dateien unter `lib/`, `server/web.mjs` und neu
    `seeds/kurztitel.json`. `hainrich2-web` nach fünf Sekunden aktiv, ohne automatischen Neustart. Seitdem gilt Zustimmung Version 3.
  - _Am Host nachgesehen, nur lesend:_ Smoke 21 von 21 in Chromium, Firefox und WebKit. Alle 31 Frageseiten tragen den Betreiber im
    Fuß und „Melden“ an jedem Beitrag. 30 tragen den Prüfvermerk (22 mit dem 05.11., 8 mit dem 10.11., Tage in UTC; s21 mit dem 05.11.,
    der Eingriff von der Konsole zählt also nicht), die 31. hat eine Antwort der Moderation und deshalb keinen. Alle 31 tragen `QAPage`;
    bei s09 nennt es die Frage der H1 und zeigt auf `#b2`. `f/neu/` trägt `data-zustimmung="3"` und beide Sätze zu „gemeinfrei“, die
    vier Rechtstext-Seiten die neuen Absätze, der alte Satz über den Checker ist weg. `style.css` und `stimmen.js` gleichen dem Bau.
    `GET` auf die API gibt 405, `mod/` 200, alles bleibt `noindex`, die Sitemap leer. Keine Frage trägt „gemeinfrei“: Unter Version 3
    ist noch keine freigegeben.
- **Gebaut und ausgespielt am Nachmittag des 2026-11-17** (Konrads Entscheidungen, Plan D30, D34 bis D36; Commits `881f9db` und `a918710`):
  - Der Fuß jeder Seite verlinkt die Anmeldung der Moderation.
  - _Lizenzen:_ Die Beispielfragen tragen „gemeinfrei“ (CC0 1.0), die Antworten stehen unter CC BY-SA 4.0: eine Zeile unter den Antworten,
    zwei Sätze im Impressum, der Abschnitt „Zitate und Antworten“ in den Nutzungsbedingungen, `license` in `QAPage`. Die Seite trägt kein
    `rel="license"` mehr, weil drei Lizenzen auf ihr stehen.
  - _s30 entfällt_ (D34): 29 Beispielfragen, 29 Titelvorschläge; Bau und Import überlesen die eingefrorenen Antworten dazu.
  - _Vektor (D35):_ Eine bearbeitete Frage bekommt ihren Vektor neu, über einen Auftrag `nurVektor` an den Worker, lokal und ohne Kosten.
  - _Zitate (D36):_ Beim Start ziehen Zitate, deren Wortlaut noch im Skript steht, auf den ausgespielten Korpus um. Geschätzt an den 129
    Opus-Zitaten aus `phase1` gegen den Korpus vom 15.11.: 107 unverändert, eins bekommt eine neue Adresse (s29, der Anker heißt anders),
    21 stehen so nicht mehr im Skript und bleiben. Am Host ist der Bestand ein anderer, die Zahl dort kenne ich nicht.
  - Tests gegen den lokalen Bau (68 Seiten, 29 Fragen): `npm test` 278 von 278, `npm run smoke` 21 von 21 in Chromium, Firefox und
    WebKit, `npm run smoke:mod` 26 von 26 in Chromium und Firefox.
  - _Ausgespielt_ auf Konrads Wort, nach beiden Probeläufen: `site/deploy.sh` um 16:34:50 mit 68 HTML-Seiten und `daten/fragen.json`
    samt komprimierten Fassungen (276 Dateien) und der Löschung von `f/s30/` im Docroot; `site/deploy-app.sh` um 16:35:18 mit sechs
    Dateien unter `lib/`, `server/web.mjs` und `seeds/kurztitel.json`. `hainrich2-web` nach fünf Sekunden aktiv, ohne automatischen
    Neustart. `daten/fragen.json` stand nicht in der Vorhersage: Sie ändert sich, weil s30 aus den Seeds fiel, und am Host kommt sie
    ohnehin aus `live/`.
  - _Am Host nachgesehen, nur lesend:_ Smoke 21 von 21 in Chromium, Firefox und WebKit. Alle 31 Frageseiten tragen den Link
    „Moderation“, die Zeile zur Lizenz der Antworten und `license` in `QAPage`, keine mehr `rel="license"`. 29 tragen „gemeinfrei“, die
    zwei Testfragen nicht. Impressum und Nutzungsbedingungen zeigen die neuen Sätze. **Drei von 134 Zitaten sind umgezogen**, alle mit
    unverändertem Wortlaut: s29 [3] und `0cfd2b864eda` [4], deren Überschrift im Skript anders heißt, und s12 [5], dessen Adresse jetzt
    auf den Text statt auf den Folienlink zeigt (Vergleich der öffentlichen Seiten vor und nach dem Ausspielen). Prüfdaten und
    Fragetexte sind unverändert. **Kein Vektor hat sich geändert** (bis 16:39). Das passt: Die Texte der 29 Beispielfragen am Host
    gleichen dem Repo, bearbeitet wurde dort keiner. Dass ein Auftrag `nurVektor` am Host durchläuft, hat damit noch niemand gesehen.
- **Gebaut und ausgespielt am Abend des 2026-11-17** (Nachtrag zu D35, Commit `d977182`): Ändert die Moderation eine Frage bei
  der Freigabe, wurde bisher der Vektor aus dem Entwurf übernommen, also der des eingereichten Wortlauts; nach einer Redaktion stünde
  er öffentlich in `daten/fragen.json`. Jetzt trägt jedes Ergebnis des Worker ein Kennzeichen seines Wortlauts, ein Vektor wird nur
  gesetzt, wenn es zum Text passt, und sonst rechnet der Worker ihn aus dem freigegebenen Text neu. `npm test` 283 von 283,
  `smoke:mod` 26 von 26 in Chromium und Firefox. Ausgespielt auf Konrads Wort um 17:10:22 mit `site/deploy-app.sh` (drei Dateien unter
  `lib/`, wie im Probelauf; die Site blieb unberührt), Dienst nach fünf Sekunden aktiv. Am Host danach, nur lesend: Vektoren,
  Fragetexte, Prüfdaten und alle 134 Zitate wie vor dem Ausspielen, Smoke 21 von 21 in drei Browsern. Freigegeben wurde am Host seit
  dem 05.11. keine Frage; dass eine Redaktion bei der Freigabe dort Nullen und danach einen neuen Vektor ergibt, hat also noch
  niemand gesehen. Der CI-Lauf zu `d977182` lief beim Ausspielen noch und endete sieben Minuten später grün.
- **Die Vorschau ist beendet, seit dem Abend des 2026-11-17** (Konrads Entscheidung, vor der ersten Studierendenfrage; Plan D45).
  - Konrad hat den Schalter unter `/eidl/mod/zahlen/` zwischen 23:14 und 23:28 selbst umgelegt; seitdem schreibt der Server seine
    Seiten ohne Banner, und Geprüftes ist `index,follow`. Der statische Bau mit `--release` ging auf sein Wort um 23:42 hinaus
    (`site/deploy.sh`, wie im Probelauf: neuer Inhalt in allen 66 HTML-Seiten, `sitemap.xml`, `daten/fragen.json`; gelöscht die
    statischen Seiten zu s19 und s27). Der Bau ging aus dem Arbeitsbaum hinaus und ist seither als `749e0b3` committet; ein Bau aus
    dem Commit gleicht dem Baum am Host Datei für Datei (Inhaltsvergleich mit rsync am 18.11., kein Unterschied).
  - **s19 und s27 gibt es nicht mehr:** Er hat sie in der Moderation endgültig gelöscht. Sie sind aus `seeds/fragen.json` und
    `seeds/kurztitel.json` gestrichen, der Bestand hat 27 Beispielfragen und zwei Testfragen. Der Bau brach an ihnen zuerst ab; eine
    zurückgezogene Beispielfrage lässt er seither weg, eine gelöschte muss aus den Seeds.
  - **Die Rechtstexte hat Konrad am selben Abend gegengelesen:** Impressum, Über-Seite und Nutzungsbedingungen passen, Datenschutz
    mit zwei Korrekturen („Beim ersten Klick/Fokus ins Suchfeld“, „Was Sie in die Suche eintippen“). In den Nutzungsbedingungen sind
    die zwei Sätze über Fragen ohne Vermerk gestrichen, die Über-Seite sagt „Die Fragen kommen von Nutzern“. Alles live seit 23:42.
  - **Am Host danach:** kein Banner mehr auf irgendeiner Seite; `index,follow` an Startseite, Unterforen, Über-Seite und den 29
    Frageseiten, `noindex` an Rechtstexten, Frageformular, Fehlerseite und den Kapitelseiten mit weniger als drei geprüften Fragen;
    s19 und s27 antworten mit 404. Die Sitemap nennt 35 Adressen. Smoke 22 von 22 in Chromium, Firefox und WebKit.
  - **Search Console:** Sitemap `https://hai.konradvoelkel.com/eidl/sitemap.xml` am 17.11. eingereicht, Status „Success“, 35 Seiten
    erkannt.
  - **Ausgespielt am 2026-11-18 um 00:07** (`site/deploy-app.sh`, Commit `749e0b3`, wie im Probelauf drei Dateien): Links aus der
    Moderation zurück zur öffentlichen Site (im Kopf „Zum Forum“, an jeder sichtbaren Frage „öffentliche Seite“) und derselbe
    Wortlaut „Klick/Fokus“ im Hinweis an der Suche. Am Host danach: beides zu sehen, die Vorschau bleibt beendet, Sitemap 35
    Adressen, Smoke 22 von 22 in drei Browsern, CI grün. Hinter der Anmeldung habe ich die Links am Host nicht angesehen.
  - `site/deploy-app.sh` wartet nach dem Neustart auf die erste 200 der Anmeldeseite, höchstens 60 Sekunden. Im Server-Repo hat
    `hainrich2-web` seit dem 17.11. um 23:38 eine `CPUQuota` von einem Kern (Threat Model C5); dort gemessen kam die erste Antwort
    elf Sekunden nach dem Neustart, „nach fünf Sekunden aktiv“ wurde vorher grün. Im ersten echten Lauf antwortete der Dienst rund
    sieben Sekunden nach dem Neustart.
  - Tests vor dem Ausspielen: `npm test` 301 von 301 (auch im Pre-Push-Hook), `smoke:mod` 27 von 27 in Firefox und in drei von vier Läufen in Chromium: Einmal scheiterte dort der
    ältere Test „ungespeicherte Änderungen …“, allein lief er dreimal durch; die Ursache ist nicht gesucht.
  - **Veraltete Zitate gibt es am Host keine mehr** (nur gelesen, um 23:55 gegen den ausgespielten Korpus gerechnet): Am Nachmittag
    waren es zehn. Konrad hat am Abend s19 und s27 gelöscht und die übrigen acht Antworten neu erzeugen lassen und geprüft (s17, s18,
    s20, s21, s22, s24, s26 und die Testfrage `0cfd2b864eda`, Prüfdatum 2026-11-17). Alle 29 sichtbaren Antworten sind geprüft. Das
    waren die ersten echten Aufrufe des Workers mit SDK 1.8.0; die Zahlen-Seite und sein Journal habe ich danach nicht gelesen.
    s29 beginnt weiter mit einer Absage („Die Skriptpassagen vergleichen SGD und Adam nicht hinsichtlich der Generalisierung“). Eine
    Regel, die eine Seite mit veraltetem Zitat aus dem Index hält, gibt es nicht.
  - **Das veröffentlichte Skript ist dem Korpus voraus** (gemessen am 18.11. gegen den Stand des Skripts vom 17.11., 23:52 GMT):
    93 Passagen des Korpus vom 15.11. sind geändert oder weg, 120 geändert oder neu, in allen 29 Kapiteln. Die Moderation misst
    Zitate am ausgespielten Korpus und meldet deshalb keins als veraltet; gegen das Skript selbst gerechnet zitieren 13 der 27
    Beispielfragen Wortlaut, den es so nicht mehr hat (18 Zitate: s01, s02, s04, s06, s09, s12, s15, s16, s17, s20, s21, s25, s26).
    Die zwei Testfragen sind nicht mitgerechnet. Nachziehen heißt: Korpus neu bauen, Verweis umstellen, beides ausspielen; danach
    listet die Moderation diese Antworten. Der Schnitt lässt den Fuß der Kapitelseiten jetzt weg (Forumszeile, Herkunftszeile,
    Glossar-Hinweis): Sonst stünde er in sechs Kapiteln im neuen Korpus, und der Bot zitierte ihn als Skript.
  - **Entschieden am 2026-11-18 (Plan D46):** Die Links aus dem Skript und aus dem Blog dürfen nachziehen; die Sitzungen zu
    `eidl-skript` und zur persönlichen Website sind benachrichtigt. Der Link im Skript ist seit dem 18.11. live, zum Blog weiß ich nichts. Die Lizenzen im
    README gelten so. **Das Repo ist seit dem 18.11. um 00:49 öffentlich** (sein Wort). Vorher hat Konrad den Kurscode selbst in der
    ganzen Historie gesucht, mit verdeckter Eingabe: kein Treffer; ob die Eingabe stimmte, weiß nur er, er hat es bestätigt. Bei
    GitHub eingeschaltet: Secret Scanning, Push Protection, private Sicherheitsmeldungen; `main` ist gegen Force-Push und Löschen
    geschützt, auch für Admins, ohne Pflicht zu Pull Requests. GitHub erkennt die Lizenz als AGPL-3.0 und meldet nach dem
    Einschalten keinen gefundenen Schlüssel. Die Über-Seite verlinkt den Quelltext (`SITE_QUELLTEXT` in `site/site.env`), ausgespielt
    am 18.11. um 00:52 mit `site/deploy.sh`: wie im Probelauf nur diese eine Seite; am Host steht der Abschnitt, der Link antwortet
    ohne Anmeldung mit 200, Smoke 22 von 22 in drei Browsern. Kein Tag gesetzt. Geprüft vor dem Umschalten: keine Actions-Secrets, Variablen, Deploy-Keys oder Webhooks; ein Zweig, kein Tag, 63 Commits; eine
    einzige Autorenadresse, auf seiner eigenen Domain; keine Datei über 300 KB; Mustersuche über die ganze Historie ohne Schlüssel
    (ein Treffer ist die Formatzeile des Passphrase-Hashs in `lib/auth.js`); keine Serveradresse. Die Historie behält: zwei Zeilen mit
    der Zustelladresse der Kontaktadresse, sechs mit einem Pfad seines Benutzerverzeichnisses, 40 mit dem Namen des Laufwerks, zwei
    mit dem Ort der Key-Datei, acht mit `ufw limit`. Feste Werte an einem Kurscode-Namen stehen an vier Stellen, alle in Tests und
    Messskripten; es sind Testwerte, seine Suche nach dem echten Code fand in der ganzen Historie nichts. `gitleaks` lief nicht.
- **Gebaut am späten Abend des 2026-11-17 und um 23:04 ausgespielt** (Konrads Listen vom Abend, Plan D37 bis D44; Commit `06fe244`):
  - `QAPage` trägt `reviewedBy` und `lastReviewed`; neben „Frage“ steht an einer Beispielfrage „von Konrad Völkel“.
  - Die Zitate stehen in einem `<aside>`, das Prüfdatum ist Text. Gemessen mit trafilatura am lokalen Bau: Die Frage steht bei 29
    von 29 Seiten am Anfang des Auszugs (am Host vor diesem Stand 28 von 31), und der Vermerk nennt sein Datum. Die Ursache steht in
    Abschnitt 10 des Berichts `research/2026-11-17-seo-audit/`.
  - Eine Formel als MyST-Direktive (```` ```{math} ````) wird im Korpus-Schnitt, im Suchausschnitt und in der Anzeige eine Formel.
    Kein Suchausschnitt trägt mehr „{math}“; der Korpus ist nicht neu gebaut, zwei Passagen wechseln erst dann ihre Kennung.
  - `setLicence` in `lib/store.js` für die zwei Testfragen (Konrad: gemeinfrei). Am Host nach dem Ausspielen von der Konsole gesetzt,
    mit Revision und der Rolle `konsole`; beide Seiten tragen den Vermerk sichtbar und im Markup.
  - Der lokale Bau zeigt die 29 Beispielfragen wie am Server: `site/stand-holen.sh` hat den Stand am 17.11. um 21:50 geholt (nur
    gelesen: 29 Antworten geprüft, 29 Kurztitel, zehn bearbeitet), `site/build.mjs --stand` baut daraus.
  - Aus dem Threat Model, auf Konrads Entscheidungen vom selben Abend (Plan D41 bis D44): ein Geräte-Cookie, damit fremde
    Fehlversuche ein bekanntes Gerät nicht von der Moderation aussperren; „Melden“ öffnet eine vorbereitete E-Mail; der Datenschutz
    hat eigene Abschnitte „Widerspruchsrecht“ und „Beiträge melden“ und nennt das zweite Cookie. **Die geänderten Rechtstexte sind
    live, und Konrad hat sie nicht gelesen.** Verschoben oder hingenommen sind B1, B4, C5 und D1.
  - Für die Veröffentlichung: Orte in `.env.local`, Betriebsnotizen aus Plan und Status, README, Lizenzen, Provenienz, Abschnitt
    „Quelltext“ hinter einem Schalter (leer, also nicht zu sehen), Pre-Push-Hook (eingerichtet in diesem Checkout).
  - Tests vor dem Ausspielen: `npm test` 300 von 300, auch im Pre-Push-Hook am gepushten Commit, CI grün. Gegen den lokalen Bau aus
    dem Stand vom Server: `npm run smoke` 22 von 22 in Chromium, Firefox und WebKit, `npm run smoke:mod` 26 von 26 in Chromium und
    Firefox; im Bild angesehen bei 375 px und am Desktop. Der Web-Prozess lief mit diesem Stand einmal lokal gegen eine
    Wegwerf-Datenbank.
  - Ausgespielt wie im Probelauf: `site/deploy.sh` (neuer Inhalt in 64 HTML-Seiten, `style.css`, `daten/passagen.json`), dann
    `site/deploy-app.sh` (sieben Dateien unter `lib/`, neu `lib/orte.js`, `server/web.mjs`, neu `site/site.env`), Dienst nach fünf
    Sekunden aktiv und ohne automatischen Neustart.
  - **Am Host danach:** Smoke 22 von 22 in Chromium, Firefox und WebKit. Neuer Crawl, 99 Seiten: trafilatura nimmt die Frage bei 31
    von 31 Frageseiten mit, immer am Anfang des Auszugs (vorher 28), und der Prüfvermerk nennt auf allen 30 Seiten, die einen haben,
    sein Datum. Jede Frageseite trägt „Melden“ als vorbereitete E-Mail, der Datenschutz die Abschnitte „Beiträge melden“ und
    „Widerspruchsrecht“, das Frageformular den Verweis darauf. Die Anmeldung der Moderation gelingt in Konrads Browser, die Übersicht
    zeigt 31 geprüfte Fragen, zehn mit veraltetem Zitat und nichts Wartendes.
  - **Nicht geprüft:** das Geräte-Cookie am Host (es ist `HttpOnly`, von der Seite aus nicht zu sehen; belegt ist es lokal im
    Unit-Test und im Browser-Test) und in WebKit; keine Sperre am Host ausgelöst; ob ein Mailprogramm die vorbereitete E-Mail ganz
    übernimmt (geprüft ist nur der Link); der Aufruf von `gitleaks` im Hook (nicht installiert); der Abschnitt „Quelltext“ auf einer
    gebauten Seite (nur die Ersetzung an der Textdatei); Ladezeiten nach dem Umbau; alles hinter dem Kurscode.
- Am Host hinter der Anmeldung angesehen, 2026-11-17 gegen 17 Uhr, in Konrads Browser und nur lesend: Alle 31 Kurztitel sind
  gespeichert (Konrad hat die 29 Vorschläge bestätigt, einen gekürzt und zwei selbst geschrieben), sie stehen in den Titeln der
  öffentlichen Seiten. `/eidl/mod/zahlen/`: 0 Anfragen in den letzten sieben Tagen, 13 im Monat für 1,33 $ von 15 $, keine Fehlerzeile,
  0 Kurztitel-Anfragen. **Einen echten Aufruf mit SDK 1.8.0 gab es also noch nicht**, und der Aufruf für den Kurztitel ist weiter nie
  gelaufen. In diesem Monat wurden zwei Fragen eingereicht (05.11.), eine abgelehnt und eine selbst gelöscht; auf die Moderation
  wartet nichts. Die Texte der 29 Beispielfragen am Host gleichen dem Repo, ein neuer Vektor war dort also nicht fällig.
- Die GitHub-App `konrads-ci-runner` ist seit dem 2026-11-17 für dieses Repo abgewählt (in den Einstellungen der App, auf Konrads Wort;
  nach dem Neuladen zeigt GitHub noch `laberampel`, `pycear` und `ci-probe`).
- Am Host von Hand gelöscht, 2026-11-17 auf Konrads Wort: s30, endgültig, über `store.deleteQuestion` mit der Rolle `konsole` (14:48
  UTC; vorher zurückgezogen mit einer Antwort und vier Zitaten). Danach 31 Fragen, `f/s30/` gibt 404, die Suche kennt sie nicht.
- Am Host von Hand geändert, 2026-11-17 auf Konrads Wort: der Tippfehler „ortohogonale“ in der Antwort zu s21, über `store.editAnswer`
  mit der Rolle `konsole` im Verlauf, die Seite neu geschrieben. Nachgesehen: `f/s21/` trägt das Wort in keiner der drei Kodierungen mehr.
- Abhängigkeiten, Stand 2026-11-16: gepinnt sind transformers.js 4.3.2 (vorher 4.3.0), Playwright 1.65.1 (vorher 1.63.0) und das
  Anthropic SDK 1.8.0 (vorher 1.4.0). `research/2026-11-15-transformers-4.3.2/` belegt, dass 4.3.2 dieselben Vektoren rechnet: 466 Passagen
  und 30 Seed-Fragen in Node, die Fragen und die Trefferlisten in Chromium, Firefox und WebKit, jeweils Byte für Byte.
  `research/2026-11-16-anthropic-sdk-1.8.0/` belegt, dass der Worker mit 1.8.0 dieselben Anfragen schickt und Absagen, Abbrüche und
  Timeouts gleich bucht: 19 Szenarien gegen einen Attrappen-Server, ohne echten Aufruf; nur die Logzeile nennt jetzt die Fehlerklasse.
  **Ausgespielt am 2026-11-16** mit beiden Deploys, Commit `92b6560`: In `www/` änderten sich nur `transformers.min.js` und seine drei
  komprimierten Fassungen (am Host SHA-256 `8b5a3171…34decb`), in `app/` nur `package.json` und die beiden Pakete. Der Neustart von
  `hainrich2-web` kam erst um 01:56:53, rund zweieinhalb Minuten nach den Dateien: Die Verbindung dafür wies die Ratenbegrenzung für SSH am Server ab, und
  `site/deploy-app.sh` endete mit Status 255; nachgeholt mit einer einzelnen Verbindung. Danach `hainrich2-web` aktiv, Smoke 19/19 gegen
  den Host, die API weist `GET` mit 405 ab, die Anmeldeseite der Moderation kommt. **Einen echten Aufruf mit SDK 1.8.0 gab es noch
  nicht:** Der erste Entwurf nach dem Ausspielen ist der erste, und das Journal des Workers habe ich nicht gelesen.
- `research/2026-11-18-seo-audit/`: viertes SEO-Audit, das erste nach dem Ende der Vorschau, am ausgespielten Stand `89a8b4a` mit
  97 Seiten. Einschätzung 85 von 100 (17.11.: 84). Gemessen: 35 Seiten `index,follow`, die Sitemap nennt genau diese 35; trafilatura
  nimmt die Frage auf 29 von 29 Seiten vorn mit; Gewicht und Anfragen wie am 17.11. **Googles Live-Test in der Search Console nimmt
  eine Frageseite an:** indexierbar, Breadcrumbs gültig, Q&A gültig und für Rich Results zulässig, mit fünf unkritischen Hinweisen
  (Datum der Frage ohne Uhrzeit, drei optionale Felder fehlen). Indexiert ist noch nichts („Discovered – currently not indexed“).
  **Offen und jetzt live:** Gegen das Skript von heute zitieren mindestens 13 der 29 Antworten Wortlaut, den es so nicht mehr hat,
  darunter vier der acht vom 17.11.; im extrahierten Text fehlt seit dem Umbau vom 17.11. der Beleg (205 Zitatmarken ohne Ziel, eine
  einzige Adresse des Skripts in 29 Auszügen); die Links aus dem Skript treffen 29 Kapitelseiten mit `noindex` und ohne Einleitung;
  s29, s06 und s20 halten ihren Titel nicht; der nächste Schritt liegt unter den Zitaten.
  **Umgebaut am selben Tag und ausgespielt um 02:12** (`25b36b9`, Abschnitt 9 des Berichts), was keine Entscheidung braucht: Die Zeile über den
  Zitaten nennt die zitierten Kapitel mit Link ins Skript, der Prüfvermerk beginnt mit „Antwort eines Sprachmodells, geprüft am …“,
  jede Kapitelseite sagt in zwei Sätzen, wer antwortet, wer prüft und dass Fragen einen Kurscode braucht, eine Beschreibung endet nicht
  mehr auf einer Frage, in einer Klammer oder in einem offenen Zitat, der Bot-Autor im `QAPage` trägt `url`. Gemessen am lokalen Bau
  aus dem Stand vom Server (27 Fragen): Herkunft in den ersten 400 Zeichen des Auszugs auf 27 von 27 Seiten (vorher 0 von 28),
  zitiertes Kapitel und Adresse des Skripts im Auszug 27 von 27 (vorher 1 und 0 von 28), die Frage weiter auf allen vorn; 5 von 27
  Beschreibungen geändert. Der Prüfvermerk braucht bei 375 px drei Zeilen statt zwei. Tests gegen diesen Bau: `npm test` 305 von 305,
  `npm run smoke` 22 von 22 in Chromium, Firefox und WebKit, `npm run smoke:mod` 27 von 27 in Chromium und Firefox.
  **Am Host nachgemessen** (alle 29 Frageseiten neu abgerufen, nur GET): Frage vorn im Auszug 29 von 29, Herkunft in den ersten
  400 Zeichen 28 von 28 Seiten mit Antwort des Bots, zitiertes Kapitel und Adresse des Skripts 28 von 28, Bot-Autor mit `url` 28
  von 28, keine Beschreibung endet auf „?“ oder „:“; drei Kapitelseiten tragen die Einleitung; `npm run smoke` gegen den Host 22
  von 22. Nicht gemessen: andere Extraktoren als trafilatura, ein echtes Telefon.
  Offen bleiben der Korpus und die veralteten Zitate, die Schwelle für die Kapitelseiten, `nav.weiter` und die Texte des Betreibers.
- `research/2026-11-17-seo-audit/`: drittes SEO-Audit, am ausgespielten Stand `d977182` mit 99 Seiten. Startbereitschaft 84 von 100
  (eine Einschätzung; 16.11.: 79). Von den 17 Befunden des 16.11. sind 13 erledigt oder entschieden. Offen vor dem Ende der Vorschau:
  zehn geprüfte Antworten zitieren Wortlaut, den das Skript nicht mehr hat; ein Textextraktor findet die Frage auf 30 von 31
  Frageseiten nicht (der Umbau vom 16.11. dazu hat nichts bewirkt); s29 und s20 sagen im ersten Satz ab, was ihr Titel verspricht,
  bei s06 führt der erste Satz in die Irre; der Link „Alle Fragen zu …“ führt bei 25 von 31 Fragen auf eine Liste mit nur dieser
  Frage. Gemessen: LCP 0,58 bis 0,68 s gedrosselt, ein Wiederbesuch kostet rund 1 KB. **Umgebaut und ausgespielt am selben Abend**
  (Commit `7ca0c6e`, Abschnitt 9 des Berichts): Die Frage steht als Erstes in ihrer Karte und der Faden ist ein `<article>`, unter
  der Antwort stehen Unterforum und Skriptkapitel statt des Kapitellinks, Beschreibungen in ganzen Sätzen mit lesbaren Formeln, jede
  Quelle einmal im `QAPage`, `lastmod` in der Sitemap, „Melden“ mit Namen, dazu Kleinigkeiten. Vorher `npm test` 286 von 286, Smoke 22
  von 22 in drei Browsern, `smoke:mod` 26 von 26 in Chromium und Firefox, CI grün. **Am Host nachgemessen** mit einem neuen Crawl:
  trafilatura nimmt die Frage bei 28 von 31 Seiten mit (vorher bei einer; s09, s11 und s15 fehlen, Grund offen), keine Beschreibung
  unter 70 Zeichen und keine mit Lücke (vorher 7 und 4), Smoke 22 von 22 in drei Browsern. Nicht gemessen: Ladezeiten nach dem Umbau.
  Offen bleiben Konrads Texte und Klicks.
- `research/2026-11-16-seo-audit/`: zweites SEO-Audit, am ausgespielten Stand mit 99 Seiten. Startbereitschaft 79 von 100 (eine
  Einschätzung), kein Rückschritt seit dem Audit vom 06.11. Offen vor dem Ende der Vorschau: Frageseiten verlinken weder ihr Kapitel
  noch andere Fragen, „geprüft“ nennt weder Prüfer noch Datum, Kapitelseiten würden ab einer geprüften Frage indexiert, und für das
  Ende der Vorschau fehlt der Schalter in `public.db` samt Test. Eine Regel für Trainings-Crawler gibt es nicht, das ist Konrads
  Entscheidung. **Umgebaut am selben Tag, nicht ausgespielt** (Abschnitt 7 des Berichts): Frageseiten verlinken Kapitel und Unterforum,
  Kapitelseiten werden erst ab drei geprüften Fragen indexierbar, Beschreibungen ohne Listenzeichen und mit lesbaren Formeln, die
  Suche sagt ihre Treffer an, das Frageformular hält den Fokus und sagt, wer fragen kann, breite Formeln zeigen ihren Rand, lange
  Zitate sind eingeklappt (s09 bei 360 px von 7760 auf 3839 px), und
  `test/vorschau.test.mjs` hält das Ende der Vorschau für die dynamischen Seiten fest. 234 Unit-Tests, Smoke 20/20 in drei Browsern,
  `smoke:mod` 23/23 in Chromium und Firefox. Beim Probelauf am 17.11. gefunden und behoben: zwei Suchausschnitte verloren den
  Unterstrich eines Index („(Ax)j“). **Ausgespielt am 2026-11-17** mit beiden Deploys, Commit `e454d4c`: `site/deploy.sh` brachte 69
  HTML-Seiten, `app.js`, `fragen.js`, `style.css`, `daten/passagen.json` und neu `zitate.js`, keine Löschung; `site/deploy-app.sh`
  brachte nur `lib/site.js` und startete `hainrich2-web` um 11:57:34 neu, der erste echte Lauf über eine SSH-Verbindung. Danach am
  Host: Dienst aktiv ohne automatischen Neustart, `live/` neu geschrieben, Smoke 20/20 in Chromium, Firefox und WebKit, s09 verlinkt
  ihr Kapitel und hat sieben eingeklappte Zitate, `f/neu/` zeigt den neuen Satz, `GET` auf die API gibt 405. **Nicht geprüft am
  Host:** das Frageformular hinter dem Kurscode, eine Stimme. Lokal scheiterten in `smoke:mod` unter WebKit 14 von 23 Tests, wie schon
  am 06.11. (13 von 22); in Chromium und Firefox laufen alle. Die Ursache steht seit dem 17.11. in `research/2026-11-17-webkit-cookie/`.
- `research/2026-11-04-dedupe/`: Messskripte und Ergebnisse zu Duplikaterkennung, Skript-Suche und
  Antworten mit lokalen Modellen.
- `research/2026-11-04-browsermodell/`: Modellwahl für den Browser. Das geschnittene Modell liegt
  außerhalb des Repos im Datenverzeichnis, die Token-IDs im Repo.

- `lib/`, `tools/`, `test/`: Korpus aus dem Skript, hybride Suche, Antworten mit Citations, Richter,
  Kostenbuch mit Deckel, Review-Seite.
- `site/`, `lib/site.js`, `lib/rank.js`, `smoke/`: die Lese-Site, lokal gebaut nach
  `$HAINRICH2_DATEN/site/`. 39 Seiten, Suche im Browser, Impressum und
  Datenschutz. 216 Unit-Tests, 18 Smoke-Tests und 23 Browser-Tests von Moderation, Fragepfad und Abstimmen grün (`npm test`, `npm run smoke`, `npm run smoke:mod`). Sie zeigt vorerst die
  Opus-Antworten als Platzhalter, jede Seite trägt ein Vorschau-Banner.
- Forum-Optik mit vier Unterforen (`lib/forum.js`): Startseite, `f/<unterforum>/` und Beiträge mit Autorenspalte, seit 2026-11-05
  auf dem Server.
- Kapitelseiten `f/kapitel/<kennung>/`, 29 Stück (`lib/forum.js` `KAPITEL`, `lib/site.js` `kapitelPage`), gebaut am 2026-11-12, lokal
  getestet und **ausgespielt am 2026-11-12** (App mit Neustart um 09:23, statisch danach): Fragen des Kapitels, Suche mit Kapitelbezug (`lib/rank.js`, `lib/search.js`, `site/such-worker.js`),
  „Frage stellen“ mit `?kapitel=` ins Formular. Der Hinweis reist mit (`pending.db`, Spalte `kapitel`, wird beim Start nachgetragen) und
  ist bei der Moderation vorgewählt; die Entscheidung bleibt dort. Die Kennung ist die Seitenkennung des Skripts, der Bau prüft sie gegen
  den Korpus. **Das Skript verweist seit dem 2026-11-18 darauf** (Plan D46, gesetzt im Repo `eidl-skript`): am Ende jeder der 29
  Kapitelseiten „Frage zu diesem Kapitel? Im Forum zum Skript; fragen kann, wer den Kurscode aus ILIAS hat, mitlesen können alle.“ An
  drei Kapitelseiten des veröffentlichten Skripts nachgesehen, die Ziele antworten mit 200, die Startseite trägt keinen Link. Die
  Kennzeichnung als privates Angebot aus Plan §13 steht dort nicht; nach Auskunft der Sitzung im Skript-Repo hat Konrad sie dort
  streichen lassen.
- `site/deploy.sh`: liefert den fertigen Baum per rsync in den Docroot.
- `site/deploy-app.sh` führt seit 2026-11-16 alle Schritte über eine SSH-Verbindung (vorher drei), nennt beim Scheitern den Schritt und
  was schon auf dem Server liegt, und prüft nach dem Neustart, ob `hainrich2-web` nach fünf Sekunden aktiv ist und keinen automatischen
  Neustart gezählt hat (`research/2026-11-16-deploy-eine-verbindung/`). Geprüft: zwölf Fehlerwege gegen Attrappen, und im Probelauf gegen
  den Server eine Verbindung statt zwei. **Nicht geprüft:** ein echter Lauf mit Neustart, den gab es mit dem neuen Skript noch nicht.
- `https://hai.konradvoelkel.com/eidl/` ist seit 2026-11-04 online, als Staging: der Vorschau-Baum mit den
  Opus-Platzhaltern, Banner und `noindex` auf allen 39 Seiten, leere Sitemap, Impressum und Datenschutz. Das ist
  Konrads Entscheidung. Der Name ist nirgends verlinkt, steht aber wie jeder
  Zertifikatsname in den öffentlichen CT-Logs. A und AAAA bei INWX, Rolle `hainrich2`, Wache (Server-Repo
  `1b83e10`, `27a20d6`). Die 13 Smoke-Tests sind auch gegen den echten Host grün (`SMOKE_URL`).
- Der Korpus auf dem VPS, für Worker, Moderation und die Suche im Browser, ist vom Skriptstand, der am 2026-11-15 um 10:48 GMT
  veröffentlicht wurde (Commit nicht nachgesehen), gebaut am 2026-11-15, 466 Passagen, unter `work/korpus-2026-11-15b/`, ausgespielt am
  2026-11-15 um 20:06 mit beiden Deploys: Prüfsummen in `www/` und `korpus/` wie lokal, `hainrich2-web` nach dem Neustart aktiv, Smoke
  19/19 gegen den Host. `work/korpus-aktuell` zeigt darauf (D25), und `site/build.mjs` baut die Suche daraus (`--korpus`). Davor am
  selben Tag: `8c24caa` (veröffentlicht 2026-11-14) in `korpus-2026-11-15/`, ausgespielt um 10:50; der Unterschied ist eine Passage in
  `universelle-approximation`, nur die Tausendertrennung („295 554“ statt „295.554“). Davor: `7a6254c` mit 444 Passagen in `korpus-2026-11-10b/`, vor D25 stand die Suche auf 434 Passagen vom 2026-11-06. `phase1` bleibt eingefroren auf `a74d433`: Die Antworten in
  `antworten.json` zitieren daraus, und der Bau prüft ihre Zitate dagegen (I4, `--daten`).
  Die Zitate in `public.db` zieht kein Werkzeug um: Bei s12 zeigt ein Textfragment noch auf die entfernte Folienzeile, die Seite öffnet dann oben.
- `node tools/skriptstand.mjs` vergleicht die veröffentlichte `llms-full.txt` mit dem
  Korpus hinter `work/korpus-aktuell` und nennt die Antworten in `antworten.json`, deren Zitat es so nicht mehr gibt (Exit 1). Für `public.db` zeigt die Moderation dieselbe Liste, in der Übersicht
  und an der Frage, gemessen am ausgespielten Korpus; der Web-Prozess liest ihn aus `korpus/` neben `app/`. Die Liste ist seit 2026-11-09 live, angesehen hat sie
  auf dem Host nur Konrad; erwartet sind 14 Fragen, s30 ist nicht online.
  Einen Auslöser vom Skript aus wie bei ds-en gibt es nicht, der Check läuft von Hand. Zuletzt nachgezogen am 2026-11-15:
  22 neue und 3 geänderte Passagen, vor allem die Formen-Verteilung in `autograd-berechnungsgraph` (+14) und die Lernkurve in
  `universelle-approximation` (+6). In `antworten.json` kommen s19 und ein weiteres Zitat bei s17 auf die Opus-Liste, sie hat jetzt 18 Antworten.
  Am Abend desselben Tages noch eine geänderte Passage (Tausendertrennung), die Liste bleibt bei 18.
- Die Kontaktadresse `mail@hai.konradvoelkel.com` (von Konrad am 2026-11-17 selbst getestet, sie kommt an), am 2026-11-04 mit einer Mail von außen bestätigt.
  Wohin sie zugestellt wird, steht nicht in diesem Repo.
- Google Search Console: Domain-Property `sc-domain:hai.konradvoelkel.com`, angelegt am 2026-11-17 in Konrads Konto (sein Auftrag).
  Bestätigt ohne eigenen Schritt („Ownership auto verified“, Verfahren „Domain name provider“), weil `konradvoelkel.com` dort schon
  per DNS bestätigt ist: kein neuer DNS-Eintrag, keine Datei. Die Sitemap `https://hai.konradvoelkel.com/eidl/sitemap.xml` ist seit dem Ende der Vorschau am selben
  Abend eingereicht (Status „Success“, 35 Seiten erkannt); `robots.txt` nennt sie ebenfalls.
- Logo und Ableitungen in `site/brand/`, erzeugt von `tools/render_brand.py` (Hai, Heine, Violett 295°), mit Vorschaukarte,
  `og:`- und `twitter:`-Tags, seit 2026-11-05 auf dem Server. Der Hai mit Toupet ist Konrads Arbeitshypothese.
- `research/2026-11-05-skriptluecken/`: Übersicht, was die Antworten offenlassen, gegen den ganzen Korpus geprüft. Konrad hat sie am 2026-11-06
  abgearbeitet, der Stand steht im Nachtrag.
- `seeds/fragen.json`: 30 Beispielfragen. Die 90 Antworten liegen in
  `$HAINRICH2_DATEN/work/phase1/antworten.json`.

- Moderation seit 2026-11-05 auf dem Server, `https://hai.konradvoelkel.com/eidl/mod/`: Anmelden, Fragen und Antworten
  bearbeiten, prüfen, zurückziehen, Verlauf, blättern mit Weiter und Zurück oder den Cursortasten. Dienst `hainrich2-web`, `public.db` auf dem VPS ist die Quelle für alles
  Öffentliche, `live/` hält die Seiten, restic sichert die Datenbank. Konrads Login funktioniert (2026-11-05). Code in `lib/store.js`, `lib/auth.js`,
  `lib/checker.js` (harte Regeln), `lib/publish.js`, `lib/mod.js`, `lib/mod-pages.js`, `server/web.mjs`.

- Fragepfad (Plan D20), **seit 2026-11-05 auf dem Server offen, zum Test durch Konrad**, auf der Vorschau unter `/eidl/f/neu/`: Kurscode und Token (`lib/api.js`), `pending.db`
  mit Fristen (`lib/pending.js`), Einwilligung und Freigabe (`lib/fragen.js`), Schlange in `/run` (`lib/spool.js`), Worker
  (`lib/draft.js`, `server/worker.mjs`), Seite `f/neu/` mit „Meine Fragen“ (`site/fragen.js`), Warteschlange unter `/eidl/mod/neu/`,
  weiche Checker-Treffer. Rolle im Server-Repo erweitert (`d87bf31`) und ausgespielt. Rechtstexte: `site/texte/datenschutz-fragen.md`,
  `site/texte/nutzungsbedingungen.md`, live über `site/build.mjs --stimmen --fragen`. Jeder künftige Bau braucht beide Schalter. Ohne Kurscode-Hash im Vault bleibt der Pfad zu.

- „Claude noch einmal fragen“ in der Moderation (Plan D23): Der Lauf liest ganze Kapitel, das Ergebnis wartet als Vorschlag in `vorschlaege`, öffentlich wird es erst mit der Übernahme. Mit Attrappe getestet, nicht mit echtem Claude. **Seit 2026-11-06 live.** Die Wache des Servers prüft seitdem auch `hainrich2-web` und die Worker-Einheiten.
- Neuer Auftritt (Höhenlinien als Textur aus `tools/render_brand.py`, Karten wie Aufkleber, Startseite 108 Pixel kürzer), 404-Seite mit `handle_errors` im Server-Repo, Folienlinks in Zitaten ausgeblendet: **seit 2026-11-06 live**. Überschriften in Bricolage Grotesque (OFL, `@fontsource-variable/bricolage-grotesque` 5.3.0, Lizenz im Impressum): **live**, Smoke gegen den echten Host grün.
- Strukturierte Daten (`WebSite`, `BreadcrumbList`) und neue OG-Karte: **seit 2026-11-06 live**, Smoke gegen den echten Host grün. `QAPage` bewusst nicht, dort müssten Nutzer antworten können.
- Beiträge tragen Namen (Plan D22): Bot hAInrich2, „Anonymer Nutzer“, Konrad Völkel mit Foto und Link. Dazu kurze Titel, Beschreibungen aus der Antwort, H1 mit Skriptname, Über-Seite und Startseite in der Sitemap (`research/2026-11-06-seo-audit/`). **Seit 2026-11-06 live**, Smoke gegen den echten Host grün.
- Seite „Über hAInrich2“ (`site/texte/ueber.md`), unten auf jeder Seite verlinkt: Herkunft des Namens, die Idee, FAQ-Wiki, Prototyp. **Seit 2026-11-05 live**, Smoke gegen den echten Host grün.
- Unter den Suchtreffern steht seit 2026-11-05 „Diese Frage stellen“, auf dem echten Host geprüft: Der getippte Text kommt über `sessionStorage` ins Formular, nicht über die Adresse.
- Zahlen für Admins unter `/eidl/mod/zahlen/` (`lib/zahlen.js`, Tabelle `zaehler`), **seit 2026-11-05 live**: Claude-Kosten aus dem Kostenbuch des Worker, Stand gegen die Deckel, Ergebnisse,
  Bestand, Stimmen, Verlauf. Ohne Seitenaufrufe. Die Tageszähler beginnen mit dem Ausspielen, die Kosten reichen weiter zurück. Auf dem Server geprüft: Der Benutzer `hainrich2` liest das Kostenbuch, schreiben kann er nicht. Die Seite selbst hat dort noch niemand geöffnet.
- Abstimmen über Fragen (Plan D21), **seit 2026-11-05 live**: hoch oder runter ohne Anmeldung, auf der Frageseite und in den Listen der
  Unterforen, die Listen sortieren nach Punkten (`lib/stimmen.js`, `site/stimmen.js`, Tabelle `votes` in `public.db`). Eigener Schalter:
  `hainrich2_stimmen` im Server-Repo und `site/build.mjs --stimmen` für den Absatz in `site/texte/datenschutz-stimmen.md`. Jeder künftige Bau braucht
  `--stimmen`, sonst verschwindet der Absatz aus der Erklärung. Auf dem echten Host in Chromium geprüft: Stimme, Rücknahme, keine Konsolenfehler, fremde Herkunft 403.

## Was nicht existiert

- Das Repo ist nicht bereit für die Veröffentlichung (geprüft am 2026-11-17 gegen Playbook §5 Punkt 10 und §3.6, am Stand `6ba0447`;
  am Abend desselben Tages vorbereitet, Plan D40). Davor steht noch: Der Bericht `research/2026-11-11-threat-model/` beschreibt
  Schwächen, die offen sind (B1, B4, C2, C5, D1; A5 prüft Konrad), und er steht in der Historie. Den Kurscode kann nur Konrad in
  der Historie suchen; den Scan aus I7 gibt es nicht. `gitleaks` ist auf dem Laptop nicht installiert, der letzte Lauf ist vom 10.11.;
  der Pre-Push-Hook ruft es auf, sobald es da ist. Die Historie behält, was der Stand nicht mehr nennt: lokale Pfade und einige
  Betriebsnotizen. Auf GitHub sind Secret Scanning, Push Protection und private Sicherheitsmeldungen erst mit dem Umschalten
  einstellbar. Erledigt am 17.11.: keine Pfade eines Rechners mehr im Stand (ein Test hält das), Betriebsnotizen aus Plan und
  Status genommen, Lizenzen im README je Bestandteil, Provenienz um `onnxruntime-node`, `sharp` und libvips ergänzt, Abschnitt
  „Quelltext“ für die Über-Seite hinter einem Schalter, Pre-Push-Hook. Sauber schon vorher: keine Geheimnisse in der Historie nach
  Mustersuche, keine Serveradresse, eine einzige Autorenadresse, keine Datei über 1 MB. Stand 2026-11-18: Das Repo ist öffentlich
  (D46). C2 und D1 sind seit der zweiten Schranke vor der Moderation enger (D50); als offen beschreibt der Bericht noch B1 und B4.

- Stimmen lassen sich nicht prüfen und die Moderation kann sie nicht zurücksetzen. Wer die Browserdaten löscht, stimmt noch einmal; nur die Grenze je Adresse
  bremst das.
- Für die geschlossene Alpha mit den aktuellen Studierenden bleibt der Laptop-Key auf dem VPS, den eigenen Key setzt Konrad erst danach (2026-11-06). Die Grenzen sind dafür angehoben (D24): 50 Anfragen am Tag, der Monatsdeckel von 15 $ reicht bei rund 8 ct je Anfrage für etwa 180. Darüber bleibt die Frage ohne Entwurf, die Texte sagen das noch nicht. Die Rechtstexte hat er freigegeben, die Fragen zu Anthropic geprüft: Die Umsetzung stimmt (Plan §11.3).
- Keine Varianten, keine Votes, keine gelabelten Paare, keine eigenen Antworten, kein Richter: Duplikate entscheidet die Moderation
  von Hand. Kein Themen-Hinweis aus §8, kein Kurscode-Scan aus I7, keine Vornamenliste im Checker.
- Bleibt eine freigegebene Frage wegen Deckel oder Ausfall ohne Antwort, gibt es keinen zweiten Versuch. Die Seite sagt dann „noch keine
  Antwort“.
- Was D18 offenließ, gilt so: Eine englische Frage bekommt einen Entwurf in ihrer Sprache, die Moderation entscheidet.
- Kein Smoke-Test in der CI. Er braucht den gebauten Baum und die Modelle, beides liegt außerhalb des Repos, und es fehlt ein
  Schritt, der sie holt und prüft. Auch kein Pre-Push-Hook (Playbook §5 Punkt 7).
- Kein Web-Manifest, es bräuchte `manifest-src` in der CSP. Der Laptop-Key liegt außerhalb des Repos und ist getestet.

## Nicht geprüft

- Zur Schranke vor der Moderation (D50): Den Weg mit Zugangsdaten hat nur die Sitzung im Server-Repo gemessen, in einer VM. Ob eine
  abgewiesene Anfrage am Host eine Zeile mit Adresse ins Journal schreibt, prüft Konrad dort als root; in der VM schrieb sie keine.
  `site/serve.mjs` ahmt die Schranke nicht nach.
- Aus den Rechtstexten vom 2026-11-18 (D48, D49): Dass der Server eine Frage mit Version 3 abweist, zeigt nur der Unit-Test; am Host
  habe ich nichts abgesendet. „Standort Westeuropa“ stammt aus dem Server-Repo
  (Eintrag vom 2026-09-27), im Dashboard von Cloudflare hat es an diesem Tag niemand nachgesehen. Ob jemand unter 18 fragt, kann die
  Site nicht feststellen. Die zugesagte Eingangsbestätigung zu einer Meldung schreibt ein Mensch; eine Technik dafür gibt es nicht.
- Aus dem Umbau vom 2026-11-17: Der Aufruf für den Kurztitel ist nie gegen die echte API gelaufen, nur gegen Attrappen. Ob das Modell
  die Länge einhält und ob `fallbacks` mit dieser Anfrage durchgeht, zeigt erst der erste echte Vorschlag; scheitert er, fehlt nur der
  Vorschlag. Die Migration von `public.db` lief am Host durch: Der Dienst startete, und die Prüfdaten stehen an 30 Seiten. Ob die 29
  Titelvorschläge angekommen sind, sieht man nur hinter der Anmeldung unter `/eidl/mod/titel/`; das Journal von `hainrich2-web` habe ich
  nicht gelesen. Hinter der Anmeldung und hinter dem Kurscode hat am Host seit dem Ausspielen niemand etwas ausgelöst: kein Feld für den
  Kurztitel, kein Schalter, keine Frage unter Version 3. Die Sätze zu CC0 in Zustimmung, Nutzungsbedingungen, Datenschutz und Impressum
  sind mein Entwurf, keine Rechtsberatung. Konrad hat sie mit seinem Wort zum Ausspielen freigegeben, nachdem ich das so angekündigt
  hatte; ob er sie gelesen hat, weiß ich nicht. `QAPage` hat kein Werkzeug von Google gesehen (die Adresse geht an keinen Drittdienst).

- Kapitelseiten und Kapitelbezug: Die Tests prüfen Markup, Sortierung im Beispiel und den Weg bis zur Moderation. Gemessen ist die
  Wirkung auf echte Fragen nicht. Die Stärke des Zuschlags (`KAPITEL_BONUS`, `KAPITEL_FAKTOR`, Platz 1 bei `fuse`) ist geschätzt.
  Am Host ist `/eidl/f/kapitel/backpropagation/` nach dem Ausspielen mit 200 erreichbar, Caddy liefert `f/*` also auch zwei Ebenen tief aus `live/`. Die Suche auf den Kapitelseiten ist bis 2026-11-15 in keinem echten Browser gelaufen, und ihre Treffer führten ins Leere: `site/app.js` setzte
  `f/<id>/` relativ zur Kapitelseite. Behoben am 2026-11-15 mit `data-root` vor dem Link, ein Smoke-Test klickt jetzt einen Treffer auf
  `/eidl/f/kapitel/backpropagation/` (lokal 19 von 19). Live seit 2026-11-15 mit `site/deploy.sh`, `app.js` am Host bytegleich, Smoke gegen den Host 19 von 19. Die Migration der `pending.db` ist nur daran belegt, dass der Web-Prozess nach dem Neustart läuft.
- Threat Model vom 2026-11-11 (`research/2026-11-11-threat-model/`): Von elf Befunden sind fünf behoben, getestet und seit dem 2026-11-11 ausgespielt (D26: Bremsen, /64, `api/meine`,
  Kostenbuch, Laufzeit des Worker), aus dem Arbeitsbaum vor dem Commit. Am Host geprüft sind der Start des Web-Prozesses und der Smoke-Test (18 grün); ausgelöst hat dort niemand eine
  Bremse, und der Worker hat mit dem neuen Kostenbuch noch keinen echten Auftrag bearbeitet. Das Löschen in der Moderation (D27) ist gebaut, getestet und seit dem 2026-11-11 ausgespielt; am Host hat es noch niemand benutzt, der Abschnitt liegt hinter der Anmeldung. Die Sätze zum Löschweg in `site/texte/datenschutz-fragen.md` und `datenschutz.md` hat Konrad am 2026-11-11 freigegeben, sie sind seit demselben Tag live (`site/deploy.sh`; im Inhalt änderte sich nur die Datenschutzseite, die Seite am Host ist bytegleich mit dem gebauten Stand, Smoke gegen den Host 18 grün). Der Löschweg hängt an der Adresse im Impressum: Der Name hat MX-Einträge, ob das Postfach die Adresse annimmt, ist mit keiner Testmail geprüft. Offen sind der zweite Kostendeckel, der Satz über den Checker (A3), die zweite Schranke vor `/eidl/mod/`, Links und
  Formelgrößen in Antworten. Ob eine Absage der API wirklich nichts kostet, ist angenommen, nicht nachgeschlagen. Der Abbruch des Worker nach 15 Minuten war nur gelesen, nie am Host gesehen.
- Der Worker hat auf dem Server zwei echte Fragen bearbeitet (05.11.), eine mit Antwort und vier Zitaten, eine mit `kein_beleg`: drei Anfragen, 23 ct, 166 MB. `fallbacks` ging mit Citations durch,
  ein Ersatzmodell musste noch nicht einspringen. Prompt-Version 2 ist damit nicht gemessen, das war eine einzige Antwort.
- `hainrich2-worker` kommt nachweislich nicht an `pending.db`, `hainrich2` nicht an den Key.
- Die Rechtstexte zum Fragepfad und zum Abstimmen sind mein Entwurf, keine Rechtsberatung. Der Absatz zum Abstimmen steht seit 2026-11-05 auf der Site, ausgespielt auf Konrads
  Wort, ausdrücklich gelesen hat er ihn nicht.
- Prompt-Version 2: Kein echter Lauf hat bisher gezeigt, ob die Modelle sich daran halten. Alle vorhandenen Antworten stammen aus
  Version 1.
- Die Qualität der 90 Antworten. Bisher hat sie kein Mensch bewertet.
- 81 der 90 Antworten stammen noch aus der Suche mit `k = 60`, nur s02, s08 und s12 sind neu. Bei den übrigen
  wäre die Auswahl heute meist etwas anders; ihre Zitate betrifft das nicht.
- Ob der Prüfschritt etwas taugt: 58 von 87 Hinweisen, bei allen Modellen ähnlich oft.
- Impressum und Datenschutz hat Konrad am 2026-11-05 freigegeben, mit dem Absatz zur Moderation. Die Fassung für Fragen von außen
  hat er am 2026-11-06 freigegeben, mit dem Zusatz, dass die Moderation alles sieht (Zustimmung Version 2). Den Absatz „Löschen nach der Freigabe“ und den
  Satz unter „Ihre Rechte“ hat er am 2026-11-11 freigegeben, live seit demselben Tag wie das Löschen in der Moderation (D27). Dass zu einer
  Frage auch das Kapitel gespeichert wird, von dessen Seite sie kam, nennt „Was auf dem Server liegt“ seit 2026-11-15, von ihm freigegeben und
  am selben Tag live; die Kapitelseiten liefen seit dem 2026-11-12 ohne diesen Satz.
- Die CSP steht doppelt, in der Rolle und in `site/serve.mjs`. Live sind beide gleich, aber kein Test hält sie
  zusammen.
- Der Smoke-Test ist in Chromium, Firefox und WebKit gegen den echten Host grün (2026-11-06, `SMOKE_BROWSER`). Ein echtes iPhone hat niemand getestet. `smoke:mod` läuft lokal in Firefox grün. Unter WebKit scheitert jeder Test mit Anmeldung (2026-11-17: 16 von 25): WebKit nimmt das `Secure`-Cookie auf `http://localhost` nicht an, gemessen in `research/2026-11-17-webkit-cookie/`. Das betrifft nur den Testverbund, der Host läuft über HTTPS; die Moderation ist damit aber in WebKit in keinem Test gelaufen. Die Systempakete für WebKit sind seit dem 17.11. installiert (`playwright install-deps`), daran lag es nicht.
- Latenz auf einem echten Telefon; gemessen ist nur CPU-Drosselung im Headless-Chromium.
- Text-Fragmente nur in Chromium und nur an vier Links geprüft.
- Alle Trefferquoten stammen aus einem kleinen, selbst geschriebenen Set, nicht aus echten Fragen.
- Der Abnahmewert für Duplikate in den Top 5 (85 %) ist nicht erreicht: 74 bis 80 %.

## Nächster Schritt

Die Vorschau ist seit dem 2026-11-17 beendet. Am Host läuft `21e5d95`: die App seit dem 2026-11-18 um 11:26, die statischen Seiten seit 10:43, mit den Rechtstexten vom selben Tag und Zustimmung Version 4. Die Kurztitel sind bestätigt.

Konrad testet den Fragepfad auf dem echten Host. Die Lücken im Skript sind abgearbeitet (2026-11-06): „Warum rückwärts?“ steht im Skript, 15 Antworten sind bearbeitet, s21 ist wieder online, s30 fehlt weiter.
Der Korpus ist neu gebaut und ausgespielt. Geprüftes ist seit dem Ende der Vorschau indexierbar. Der Blindvergleich hat keine Frist und entscheidet nur noch das Modell für neue Antworten.
