# Status

_Stand 2026-11-17._

## Was existiert

- Git-Repo auf `main`, Remote `origin` ist das private `konradvoelkel/hainrich2` auf GitHub.
- `DEVELOPMENT_PLAN.md`, `CLAUDE.md`, dieses Dokument.
- CI seit 2026-11-06: `.github/workflows/tests.yml` fährt `npm test` bei jedem Push und Pull Request auf `main`, in einem per
  Digest gepinnten `node:24`-Container. Seit dem 2026-11-10 läuft sie auf GitHubs `ubuntu-24.04`, nicht mehr auf Konrads eigenem
  Runner `ci-eu`: Der nimmt nur private Repos und musste vor einer Veröffentlichung weg.
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
- **Gebaut am Nachmittag des 2026-11-17, nicht ausgespielt** (Konrads Entscheidungen, Plan D30, D34 bis D36):
  - Der Fuß jeder Seite verlinkt die Anmeldung der Moderation (`881f9db`, beide Probeläufe mit vorhergesagter Liste).
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
- Die GitHub-App `konrads-ci-runner` ist seit dem 2026-11-17 für dieses Repo abgewählt (in den Einstellungen der App, auf Konrads Wort;
  nach dem Neuladen zeigt GitHub noch `laberampel`, `pycear` und `ci-probe`).
- Am Host von Hand geändert, 2026-11-17 auf Konrads Wort: der Tippfehler „ortohogonale“ in der Antwort zu s21, über `store.editAnswer`
  mit der Rolle `konsole` im Verlauf, die Seite neu geschrieben. Nachgesehen: `f/s21/` trägt das Wort in keiner der drei Kodierungen mehr.
- Abhängigkeiten, Stand 2026-11-16: gepinnt sind transformers.js 4.3.2 (vorher 4.3.0), Playwright 1.65.1 (vorher 1.63.0) und das
  Anthropic SDK 1.8.0 (vorher 1.4.0). `research/2026-11-15-transformers-4.3.2/` belegt, dass 4.3.2 dieselben Vektoren rechnet: 466 Passagen
  und 30 Seed-Fragen in Node, die Fragen und die Trefferlisten in Chromium, Firefox und WebKit, jeweils Byte für Byte.
  `research/2026-11-16-anthropic-sdk-1.8.0/` belegt, dass der Worker mit 1.8.0 dieselben Anfragen schickt und Absagen, Abbrüche und
  Timeouts gleich bucht: 19 Szenarien gegen einen Attrappen-Server, ohne echten Aufruf; nur die Logzeile nennt jetzt die Fehlerklasse.
  **Ausgespielt am 2026-11-16** mit beiden Deploys, Commit `92b6560`: In `www/` änderten sich nur `transformers.min.js` und seine drei
  komprimierten Fassungen (am Host SHA-256 `8b5a3171…34decb`), in `app/` nur `package.json` und die beiden Pakete. Der Neustart von
  `hainrich2-web` kam erst um 01:56:53, rund zweieinhalb Minuten nach den Dateien: Die Verbindung dafür wies `ufw limit` ab, und
  `site/deploy-app.sh` endete mit Status 255; nachgeholt mit einer einzelnen Verbindung. Danach `hainrich2-web` aktiv, Smoke 19/19 gegen
  den Host, die API weist `GET` mit 405 ab, die Anmeldeseite der Moderation kommt. **Einen echten Aufruf mit SDK 1.8.0 gab es noch
  nicht:** Der erste Entwurf nach dem Ausspielen ist der erste, und das Journal des Workers habe ich nicht gelesen.
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
  außerhalb des Repos auf `xtraspace`, die Token-IDs im Repo.

- `lib/`, `tools/`, `test/`: Korpus aus dem Skript, hybride Suche, Antworten mit Citations, Richter,
  Kostenbuch mit Deckel, Review-Seite.
- `site/`, `lib/site.js`, `lib/rank.js`, `smoke/`: die Lese-Site, lokal gebaut nach
  `/media/konrad/xtraspace/hainrich2/site/`. 39 Seiten, Suche im Browser, Impressum und
  Datenschutz. 216 Unit-Tests, 18 Smoke-Tests und 23 Browser-Tests von Moderation, Fragepfad und Abstimmen grün (`npm test`, `npm run smoke`, `npm run smoke:mod`). Sie zeigt vorerst die
  Opus-Antworten als Platzhalter, jede Seite trägt ein Vorschau-Banner.
- Forum-Optik mit vier Unterforen (`lib/forum.js`): Startseite, `f/<unterforum>/` und Beiträge mit Autorenspalte, seit 2026-11-05
  auf dem Server.
- Kapitelseiten `f/kapitel/<kennung>/`, 29 Stück (`lib/forum.js` `KAPITEL`, `lib/site.js` `kapitelPage`), gebaut am 2026-11-12, lokal
  getestet und **ausgespielt am 2026-11-12** (App mit Neustart um 09:23, statisch danach): Fragen des Kapitels, Suche mit Kapitelbezug (`lib/rank.js`, `lib/search.js`, `site/such-worker.js`),
  „Frage stellen“ mit `?kapitel=` ins Formular. Der Hinweis reist mit (`pending.db`, Spalte `kapitel`, wird beim Start nachgetragen) und
  ist bei der Moderation vorgewählt; die Entscheidung bleibt dort. Die Kennung ist die Seitenkennung des Skripts, der Bau prüft sie gegen
  den Korpus. Das Skript verweist noch nicht darauf, und das bleibt so, bis das Forum aus der Vorschau ist (Konrad, 2026-11-12: Vorschau bleibt, bis mindestens eine Studierendenfrage eingereicht ist).
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
- Die Kontaktadresse `mail@hai.konradvoelkel.com` (von Konrad am 2026-11-17 selbst getestet, sie kommt an): MX für `hai`, Fastmail stellt sie als
  `hai+mail@konradvoelkel.com` zu. Mit einer Mail von außen bestätigt (2026-11-04).
- Logo und Ableitungen in `site/brand/`, erzeugt von `tools/render_brand.py` (Hai, Heine, Violett 295°), mit Vorschaukarte,
  `og:`- und `twitter:`-Tags, seit 2026-11-05 auf dem Server. Der Hai mit Toupet ist Konrads Arbeitshypothese.
- `research/2026-11-05-skriptluecken/`: Übersicht, was die Antworten offenlassen, gegen den ganzen Korpus geprüft. Konrad hat sie am 2026-11-06
  abgearbeitet, der Stand steht im Nachtrag.
- `seeds/fragen.json`: 30 Beispielfragen. Die 90 Antworten liegen in
  `/media/konrad/xtraspace/hainrich2/work/phase1/antworten.json`.

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

- Das Repo ist nicht bereit für die Veröffentlichung (geprüft am 2026-11-17 gegen Playbook §5 Punkt 10 und §3.6, am Stand `6ba0447`).
  Vier Punkte stehen davor: Der Bericht `research/2026-11-11-threat-model/` beschreibt Schwächen, die offen sind (B1, B4, C2, C5, D1;
  A5 prüft Konrad), und er steht in der Historie; A3, A4, D2 bis D4 sind seit dem Ausspielen am selben Tag zu. Die GitHub-App
  `konrads-ci-runner` ist seit dem 17.11. abgewählt, dieser Punkt ist zu. Den Kurscode kann nur Konrad in der Historie
  suchen; den Scan aus I7 gibt es nicht. Fünf Messskripte unter `research/2026-11-04-*` nennen `/home/konrad/Sciebo/…`. Dazu kleiner:
  kein `gitleaks` auf dem Laptop (der letzte Lauf ist vom 10.11.), keine Kopfzeile zur Lizenz in den Quelldateien, kein Link auf den
  Quelltext auf der Site, `THIRD_PARTY_PROVENANCE.md` ohne `onnxruntime-node` und `sharp`, und auf GitHub sind Secret Scanning, Push
  Protection und private Sicherheitsmeldungen erst mit dem Umschalten einstellbar. Sauber: keine Geheimnisse in der Historie nach
  Mustersuche, keine Serveradresse, eine einzige Autorenadresse, keine Datei über 1 MB.

- Stimmen lassen sich nicht prüfen und die Moderation kann sie nicht zurücksetzen. Wer die Browserdaten löscht, stimmt noch einmal; nur die Grenze je Adresse
  bremst das.
- Für die geschlossene Alpha mit den aktuellen Studierenden bleibt der Laptop-Key auf dem VPS, den eigenen Key setzt Konrad erst danach (2026-11-06). Die Grenzen sind dafür angehoben (D24): 50 Anfragen am Tag, der Monatsdeckel von 15 $ reicht bei rund 8 ct je Anfrage für etwa 180. Darüber bleibt die Frage ohne Entwurf, die Texte sagen das noch nicht. Die Rechtstexte hat er freigegeben, die Fragen zu Anthropic geprüft: Die Umsetzung stimmt (Plan §11.3).
- Keine Varianten, keine Votes, keine gelabelten Paare, keine eigenen Antworten, kein Richter: Duplikate entscheidet die Moderation
  von Hand. Kein Themen-Hinweis aus §8, kein Kurscode-Scan aus I7, keine Vornamenliste im Checker.
- Bleibt eine freigegebene Frage wegen Deckel oder Ausfall ohne Antwort, gibt es keinen zweiten Versuch. Die Seite sagt dann „noch keine
  Antwort“.
- Was D18 offenließ, gilt so: Eine englische Frage bekommt einen Entwurf in ihrer Sprache, die Moderation entscheidet.
- Bearbeitete Fragen behalten am Host ihren alten Vektor, bis der Stand vom Nachmittag des 17.11. ausgespielt ist (D35).
- Kein Smoke-Test in der CI. Er braucht den gebauten Baum und die Modelle, beides liegt außerhalb des Repos, und es fehlt ein
  Schritt, der sie holt und prüft. Auch kein Pre-Push-Hook (Playbook §5 Punkt 7).
- Kein Web-Manifest, es bräuchte `manifest-src` in der CSP. Der Laptop-Key liegt außerhalb des Repos und ist getestet.

## Nicht geprüft

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

Der Umbau vom 2026-11-17 ist ausgespielt. Konrad bestätigt die Kurztitel unter `/eidl/mod/titel/` und sieht dabei, ob die Vorschläge
angekommen sind.

Konrad testet den Fragepfad auf dem echten Host. Die Lücken im Skript sind abgearbeitet (2026-11-06): „Warum rückwärts?“ steht im Skript, 15 Antworten sind bearbeitet, s21 ist wieder online, s30 fehlt weiter.
Der Korpus ist neu gebaut und ausgespielt. Das Ende der Vorschau ist seine Entscheidung, vorher bekommen die Studierenden den Link (2026-11-06); erst dann wird Geprüftes
indexierbar. Der Blindvergleich hat keine Frist und entscheidet nur noch das Modell für neue Antworten.
