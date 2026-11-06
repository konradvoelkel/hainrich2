# Status

_Stand 2026-11-05._

## Was existiert

- Git-Repo auf `main`, Remote `origin` ist das private `konradvoelkel/hainrich2` auf GitHub.
- `DEVELOPMENT_PLAN.md`, `CLAUDE.md`, dieses Dokument.
- CI seit 2026-11-06: `.github/workflows/tests.yml` fährt `npm test` bei jedem Push und Pull Request auf `main`, auf Konrads
  eigenem Runner `ci-eu` (Repo `ci-server`) in einem per Digest gepinnten `node:24`-Container. Der Runner nimmt nur private
  Repos; wird dieses öffentlich, muss er vorher weg.
- `research/2026-11-04-dedupe/`: Messskripte und Ergebnisse zu Duplikaterkennung, Skript-Suche und
  Antworten mit lokalen Modellen.
- `research/2026-11-04-browsermodell/`: Modellwahl für den Browser. Das geschnittene Modell liegt
  außerhalb des Repos auf `xtraspace`, die Token-IDs im Repo.

- `lib/`, `tools/`, `test/`: Korpus aus dem Skript, hybride Suche, Antworten mit Citations, Richter,
  Kostenbuch mit Deckel, Review-Seite.
- `site/`, `lib/site.js`, `lib/rank.js`, `smoke/`: die Lese-Site, lokal gebaut nach
  `/media/konrad/xtraspace/hainrich2/site/`. 39 Seiten, Suche im Browser, Impressum und
  Datenschutz. 184 Unit-Tests, 18 Smoke-Tests und 22 Browser-Tests von Moderation, Fragepfad und Abstimmen grün (`npm test`, `npm run smoke`, `npm run smoke:mod`). Sie zeigt vorerst die
  Opus-Antworten als Platzhalter, jede Seite trägt ein Vorschau-Banner.
- Forum-Optik mit vier Unterforen (`lib/forum.js`): Startseite, `f/<unterforum>/` und Beiträge mit Autorenspalte, seit 2026-11-05
  auf dem Server.
- `site/deploy.sh`: liefert den fertigen Baum per rsync in den Docroot.
- `https://hai.konradvoelkel.com/eidl/` ist seit 2026-11-04 online, als Staging: der Vorschau-Baum mit den
  Opus-Platzhaltern, Banner und `noindex` auf allen 39 Seiten, leere Sitemap, Impressum und Datenschutz. Das ist
  Konrads Entscheidung. Der Name ist nirgends verlinkt, steht aber wie jeder
  Zertifikatsname in den öffentlichen CT-Logs. A und AAAA bei INWX, Rolle `hainrich2`, Wache (Server-Repo
  `1b83e10`, `27a20d6`). Die 13 Smoke-Tests sind auch gegen den echten Host grün (`SMOKE_URL`).
- Der Korpus ist vom Skriptstand 2026-11-04 abends, 442 Passagen, nach dem Umbau des Skripts. Alle Zitat-Links der 30
  Frageseiten antworten. Ändert sich das Skript wieder, zieht `tools/move-citations.mjs` die Zitate nach Wortlaut um. Das Skript ist inzwischen
  weiter: `a74d433` vom 2026-11-05 bringt „Warum rückwärts?“, der Korpus kennt das noch nicht, auch auf dem VPS nicht.
- Die Kontaktadresse `mail@hai.konradvoelkel.com`: MX für `hai`, Fastmail stellt sie als
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

- Stimmen lassen sich nicht prüfen und die Moderation kann sie nicht zurücksetzen. Wer die Browserdaten löscht, stimmt noch einmal; nur die Grenze je Adresse
  bremst das.
- Für die geschlossene Alpha mit den aktuellen Studierenden bleibt der Laptop-Key auf dem VPS, den eigenen Key setzt Konrad erst danach (2026-11-06). Die Rechtstexte hat er freigegeben, die Fragen zu Anthropic geprüft: Die Umsetzung stimmt (Plan §11.3).
- Keine Varianten, keine Votes, keine gelabelten Paare, keine eigenen Antworten, kein Richter: Duplikate entscheidet die Moderation
  von Hand. Kein Themen-Hinweis aus §8, kein Kurscode-Scan aus I7, keine Vornamenliste im Checker.
- Bleibt eine freigegebene Frage wegen Deckel oder Ausfall ohne Antwort, gibt es keinen zweiten Versuch. Die Seite sagt dann „noch keine
  Antwort“.
- Was D18 offenließ, gilt so: Eine englische Frage bekommt einen Entwurf in ihrer Sprache, die Moderation entscheidet.
- Bearbeitete Fragen behalten ihren alten Vektor, bis die Moderation ihn neu rechnen kann. Die Stichwortsuche sieht den
  neuen Text, die semantische Suche den alten.
- Kein Smoke-Test in der CI. Er braucht den gebauten Baum und die Modelle, beides liegt außerhalb des Repos, und es fehlt ein
  Schritt, der sie holt und prüft. Auch kein Pre-Push-Hook (Playbook §5 Punkt 7).
- Kein Web-Manifest, es bräuchte `manifest-src` in der CSP. Der Laptop-Key liegt außerhalb des Repos und ist getestet.

## Nicht geprüft

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
  hat er am 2026-11-06 freigegeben, mit dem Zusatz, dass die Moderation alles sieht (Zustimmung Version 2).
- Die CSP steht doppelt, in der Rolle und in `site/serve.mjs`. Live sind beide gleich, aber kein Test hält sie
  zusammen.
- Smoke-Test nur in Chromium, nicht in Firefox und Safari.
- Latenz auf einem echten Telefon; gemessen ist nur CPU-Drosselung im Headless-Chromium.
- Text-Fragmente nur in Chromium und nur an vier Links geprüft.
- Alle Trefferquoten stammen aus einem kleinen, selbst geschriebenen Set, nicht aus echten Fragen.
- Der Abnahmewert für Duplikate in den Top 5 (85 %) ist nicht erreicht: 74 bis 80 %.

## Nächster Schritt

Konrad testet den Fragepfad auf dem echten Host. Die Lücken im Skript sind abgearbeitet (2026-11-06): „Warum rückwärts?“ steht im Skript, 15 Antworten sind bearbeitet, s21 ist wieder online, s30 fehlt weiter.
Als Nächstes gehört der Korpus neu gebaut. Das Ende der Vorschau ist seine Entscheidung, vorher bekommen die Studierenden den Link (2026-11-06); erst dann wird Geprüftes
indexierbar. Der Blindvergleich hat keine Frist und entscheidet nur noch das Modell für neue Antworten.
