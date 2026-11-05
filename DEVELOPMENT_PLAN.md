# hAInrich2: Entwicklungsplan

_Stand 2026-11-05. Gebaut sind Phase 0, Phase 1 bis zum Blindvergleich, Phase 2 und die Moderation, der Fragepfad liegt lokal,
was fehlt, steht in §15 und `STATUS.md`. Die Abschnittsnummern bleiben stabil,
Entscheidungen tragen ihr Datum. Was der Eigentümer tun oder entscheiden muss, ist mit `[owner]`
markiert._

## 1. Was das ist

Ein Frage-Antwort-Forum zum Skript „Einführung in Deep Learning“. Studierende fragen, ein klar
gekennzeichneter Bot antwortet aus dem Skript, jede Antwort trägt das wörtliche Originalzitat mit
Link. Wiederholte Fragen bekommen die vorhandene Antwort. Alle können lesen und über Fragen abstimmen, mit Kurscode kann man
fragen und selbst antworten. Moderation schaltet frei, korrigiert und legt kanonische
Fragen fest.

Der Name ist Absicht: Das ist die Schleife aus `docs/hainrich-2-proposal.md` im hAInrich-Repo
(Fragen sammeln, Antwort mit Modell entwerfen, Kurator prüft, Korpus wächst), hier als eigenes
System auf einem anderen Korpus. Das alte Repo bleibt unberührt.

## 2. Entscheidungen

| Nr | Entscheidung (Konrad, 2026-11-04) |
|---|---|
| D1 | Betrieb als Webanwendung auf dem eigenen VPS, nicht auf GitHub oder GitLab Pages. Sehr kostensparsam. Der VPS hat keine GPU, also läuft im Betrieb jede LLM-Aufgabe über die Claude API. |
| D2 | Neues Repo `hainrich2`. Verantwortlich ist Konrad Völkel mit eigenem Impressum, nicht die HHU. |
| D3 | Lesen ist öffentlich und statisch. Fragen stellen geht nur mit dem Kurscode aus ILIAS. |
| D4 | Neue Fragen sieht zunächst nur, wer sie gestellt hat, bis Moderation sie freischaltet. |
| D5 | Vor dem Fragen wird klar offengelegt und bestätigt, dass Fragen nach der Freigabe öffentlich werden. Die Weiterverarbeitung freigegebener Fragen durch ein Sprachmodell in den USA braucht keine eigene Einwilligung, wird aber transparent gemacht. Vor der Freigabe geht eine Frage nur mit ausdrücklicher Einwilligung an das Modell (D20). Neu gefasst von Konrad, 2026-11-05. |
| D6 | Personenbezogene Daten sind laut Nutzungsbedingungen verboten. Ein Checker reagiert auf Matrikelnummern, Namen und Ähnliches und sperrt die Veröffentlichung. Der öffentliche Bestand gilt als nicht personenbezogen und braucht keine Löschfrist (Einschränkung in §11.2). |
| D7 | Client-Modell: Ziel 30 MB, bis 135 MB erlaubt, wenn die Messung es verlangt. |
| D8 | Das Forum läuft durch, keine Trennung nach Durchgängen. |
| D9 | Angenommen: Skriptstellen während des Wartens, Lückenbericht, „Frage zu diesem Abschnitt“, gelabelte Paare aus Klicks, nur geprüfte Antworten in Suchmaschinen. |
| D10 | Bot-Antworten erscheinen mit Badge `ungeprüft`, ohne Frist für die Prüfung. Ohne Beleg heißt es „nichts gefunden“, kein Allgemeinwissen. Antwortsprache ist die Sprache der Frage, in Sie-Form. |
| D11 | Adresse: `https://hai.konradvoelkel.com/eidl`, `/` leitet auf `/eidl/` um. |
| D12 | Übungsaufgaben und Organisatorisches bleiben ganz draußen: keine Antworten, keine Verweise, keine festen Texte. Das Forum behandelt nur Skriptinhalte. |
| D13 | Die Löschregel aus §11.2 gilt: `pending.db` ohne Backup, Abgelehntes sofort weg, Unbearbeitetes nach 28 Tagen. |
| D14 | Budget: 20 $ im Monat als Limit in der Console. |
| D15 | Anfangs moderiert nur Konrad, gegebenenfalls kommt eine Tutorin dazu. |
| D16 | Der Checker sperrt jede Zahl mit 6 bis 12 Ziffern. |
| D17 | Kontakt im Impressum ist `mail@hai.konradvoelkel.com`, Zustellung als `hai@konradvoelkel.com` im Fastmail-Konto. Anschrift wie bei Laberampel. |
| D18 | Das Forum ist deutsch wie das Skript. Englische Fragen sind kein Ziel: keine Seeds, kein Testset, kein Tuning dafür (Konrad, 2026-11-04). Was der Schreibpfad mit einer englischen Frage tut, bleibt für Phase 3 offen. |
| D20 | Wer mit Kurscode fragt, kann beim Absenden einwilligen, dass die Frage sofort an Claude geht und einen Entwurf bekommt. Frage und Entwurf sieht nur die fragende Person, bis die Moderation entscheidet. Ohne Einwilligung wartet die Frage auf die Freigabe und wird erst danach beantwortet. Beide Wege sind gleichwertig, die Einwilligung ist nicht vorbelegt und bis zur Entscheidung widerrufbar (Konrad, 2026-11-05). |
| D21 | Über Fragen dürfen alle abstimmen, auch ohne Kurscode: hoch oder runter, die Summe steht an der Frage, Listen sortieren danach (Konrad, 2026-11-05). Weil niemand angemeldet ist, ist eine Stimme nicht überprüfbar: Wer die Browserdaten löscht, stimmt noch einmal. Deshalb entscheidet die Summe nichts, sie sortiert nur. Sie blendet nichts aus und ändert keine Kosten. |
| D19 | Das Forum hat Unterforen, nach dem Inhaltsverzeichnis des Skripts: Grundlagen, Lernen und Training, Architekturen und Repräsentationen, Praxis und Anwendung (Konrad, 2026-11-05). Eine Frage gehört über ihr Kapitel zu genau einem; `Optimierer` zählt zum Training. Die Adressen liegen unter `f/`, das bedient Caddy schon aus `live/`. |

## 3. Invarianten

Regeln, die die Technik erzwingt, nicht nur ein Text behauptet (Playbook §3.6). Jede bekommt einen
Test (§16).

| Nr | Invariante | Durchgesetzt durch |
|---|---|---|
| I1 | Text ohne Freigabe und ohne Einwilligung erreicht nie die Claude API. | Der Worker hat per `InaccessiblePaths` keinen Zugriff auf `pending.db` und sieht nur die Schlange. Dort hinein legt der Web-Prozess nur nach Einwilligung ohne Treffer des Checkers (§8) oder nach der Freigabe. |
| I2 | Nichts wird ohne Freigabe öffentlich. | Snapshots entstehen ausschließlich aus `public.db`. |
| I3 | Kein öffentlicher Datensatz führt zu einer fragenden Person. | Beim Freigeben wandert nur der Text; öffentliche Zeitstempel nur auf den Tag genau. |
| I4 | Zitate stammen aus dem Korpus, nie aus Modelltext. | Das Modell verweist auf Passagen, eingesetzt wird der Originaltext. |
| I5 | Der Web-Prozess hat keinen API-Key. | `LoadCredential` nur in der Worker-Unit, die unter einem eigenen Benutzer läuft. |
| I6 | Ausgaben haben zwei harte Deckel. | Budgetzähler im Worker plus Ausgabenlimit des Workspace in der Console. |
| I7 | Der Kurscode steht nie im Repo, in der Memory oder im Client. | Nur ein scrypt-Hash im Ansible-Vault. Zeichenketten-Scan im Build. |
| I8 | Der Bot ist überall als Bot erkennbar. | Fester Teil der Antwort-Vorlage. |
| I9 | Nur `geprüft` ist indexierbar. | `noindex` als Vorgabe, Sitemap nur aus geprüften Antworten. |
| I10 | Jeder Schreibzugriff kommt von einem ausdrücklichen Klick. | Keine stille Telemetrie, kein Zählpixel, kein Zugriffsprotokoll. |
| I11 | Stimmen führen zu niemandem, auch nicht zueinander. | Der Browser würfelt je Frage eine eigene Kennung, der Server speichert nur deren Hash und keine Adresse. Öffentlich ist nur die Summe. |

## 4. Architektur

```
                 Caddy
Browser --GET--> statische Seiten, JSON-Snapshots, Modell, WASM
Browser --POST-> /api/* --> hainrich2-web      kein API-Key, liest und schreibt beide Datenbanken
                                 |
                 pending.db  <---+---> public.db
                 kein Backup     |       Backup per restic
                                 |
                                 v  nur Eingewilligtes und Freigegebenes
                 /run/hainrich2/schlange      im Arbeitsspeicher, in keinem Backup
                                 |
                                 v
                 hainrich2-worker  startet, sobald etwas in der Schlange liegt
                                   API-Key, eigener Benutzer, kein Zugriff auf data/
                                 |
                                 v
                             Claude API
```

- **`hainrich2-web`:** Node 24 aus der Rolle `node`, `node:http` und `node:sqlite`, keine
  Framework-Abhängigkeit. Nur Schreibpfade und Moderation. `MemoryMax` eng gesetzt.
- **`live/`:** Der Web-Prozess schreibt Startseite, Frageseiten, Sitemap und `daten/fragen.json` samt `.br`, `.zst` und `.gz`
  in ein eigenes Verzeichnis, Caddy bedient diese Pfade von dort. Im Docroot würde das `--delete` von `site/deploy.sh` jede
  Bearbeitung überschreiben. Der Vektor einer Frage steht in `fragen.json` am Eintrag, sonst verrutscht die Suche, sobald
  eine Frage zurückgezogen wird.
- **`hainrich2-worker`:** Oneshot-Unit, kein Daemon. Eine `.path`-Unit mit `DirectoryNotEmpty=` startet ihn, sobald eine
  Datei in der Schlange liegt, das ist schnell genug für „sofort“ und kostet im Leerlauf keinen Speicher. Das Embedding-Modell
  lädt er nur dann. Jeder Auftrag endet mit einem Ergebnis, auch bei Fehler und Deckel: Die Datei verschwindet, also läuft
  er nicht im Kreis, und Eingewilligtes bleibt nicht liegen.
- **Schlange:** `eingang/` und `ausgang/` in `/run/hainrich2/schlange`, je Auftrag eine JSON-Datei. `/run` liegt im
  Arbeitsspeicher und nicht unter `restic_paths`. Ein Neustart des Servers verliert Aufträge; der Web-Prozess merkt das und
  lässt die Frage auf die Moderation warten.
- **Lesen:** Jede Änderung am öffentlichen Bestand schreibt Snapshots atomar per `rename`:
  `questions.json`, `vectors.json`, eine statische HTML-Seite je Frage, `sitemap.xml`. Markdown und
  KaTeX werden beim Veröffentlichen gerendert, auch die Mathematik braucht zum Lesen also kein
  JavaScript. Fällt die API aus, bleibt das Forum lesbar.
- **Backups:** `restic_excludes` schließt `/srv/*/data/*.db` aus; gesichert wird nur, was in
  `restic_sqlite_dbs` steht. Dort kommt nur `public.db` hinein. So landet die Warteschlange nie in
  den bis zu sechs Monate alten Sicherungen.
- **Zugriffsprotokoll:** Der Caddy-Block der Rolle hat keinen `log`-Block, wie bei `laberampel` und
  `autokorrektur`; einen Schalter gibt es deshalb nicht. Damit gilt die Fassung „ohne Protokoll“ aus
  `~/files/work/RECHTSTEXTE.md` §3. Wer das ändert, ändert am selben Tag den Satz.
- **Server:** Rolle `hainrich2` in `~/files/work/server`, das Projekt-Repo liefert nur Dateien
  (`site/build.mjs`, `site/deploy.sh`). Erst DNS, dann Caddy-Block. Beides `[owner]`.
- **Adresse:** Alles liegt unter dem Pfad `/eidl/`, also `/eidl/api/*` und `/eidl/mod/`; Seiten
  verweisen relativ, `/eidl` leitet auf `/eidl/` um. Der Pfad ist zugleich der Wert von `corpus`,
  weitere Skripte bekommen eigene Pfade. Im Browser trennt der Pfad aber nichts: `localStorage` gilt
  für den ganzen Host, also Schlüssel mit Präfix `eidl:`, und das Moderations-Cookie bekommt
  `Path=/eidl/`. `robots.txt` liegt an der Host-Wurzel und verweist auf `/eidl/sitemap.xml`.
- **Kosten:** VPS und Backup sind vorhanden, eine Subdomain kostet nichts. Laufende Kosten sind nur
  die API-Aufrufe (§7.4).

## 5. Lebenslauf einer Frage

1. **Tippen.** Der Client sucht in Fragen und Skriptpassagen. Es wird nichts gesendet.
2. **Treffer.** Klick auf „Das ist meine Frage“ zeigt sofort die vorhandene Antwort. Der Wortlaut
   geht als Variante in die Moderation und ist ein gelabeltes Paar (`gleich`).
3. **Neue Frage.** Klick auf „Nein, neue Frage“ verlangt Kurscode-Token, Zustimmung und den
   PII-Check (§8). Die abgelehnten Kandidaten werden als Paare `verschieden` mitgeschickt.
4. **`pending`.** Der Text liegt in `pending.db`, dazu der Hash eines Geheimnisses, das nur im
   Browser der fragenden Person liegt. Nur diese Person sieht die Frage. Während des Wartens zeigt
   der Client die passenden Skriptstellen. Sie kann die Frage bis zur Entscheidung selbst löschen,
   das ist auch der Widerruf der Einwilligung.
4a. **Entwurf, nur mit Einwilligung (D20).** Ohne Treffer des Checkers legt der Web-Prozess die Frage in die Schlange, der
   Worker beantwortet sie wie in §7.2, das Ergebnis landet in `pending.db` und nur die fragende Person sieht es, in „Meine
   Fragen“ mit Hinweis auf Bot und fehlende Prüfung. Bei weichen Treffern geht nichts hinaus, die Frage wartet. Ist der Deckel
   erreicht oder fällt die API aus, wartet sie ebenso, und die Oberfläche sagt das.
5. **Moderation.** Freigeben, bearbeiten, einer Frage als Variante zuordnen oder ablehnen. Liegt ein Entwurf vor, entscheidet
   sie über beides und kann ihn bearbeiten oder gleich als geprüft markieren.
   Ablehnen löscht den Text sofort; nur der Grund bleibt 7 Tage für die fragende Person sichtbar.
   Fragen zu Übungsaufgaben oder Organisatorischem werden abgelehnt (D12), dafür gibt es einen
   Standardgrund.
6. **Freigabe.** Der Text wandert ohne Geheimnis-Hash nach `public.db`, ein Entwurf als Antwort mit. Der Text vor der Freigabe
   bleibt nicht als Revision erhalten, sonst läge ein gestrichener Name in `public.db` und im Backup. Ab hier gibt es serverseitig
   keine Verbindung zur Person. „Meine Fragen“ lebt nur im Browser (`localStorage`). Die Frage behält ihre zufällige Kennung,
   so findet der Browser sie wieder, ohne dass der Server etwas verknüpft.
7. **Richter.** Der Worker holt die 20 ähnlichsten Fragen, ein Modell entscheidet über Duplikate
   (§6.4). Bei Duplikat wird die Frage Variante und die vorhandene Antwort gilt.
8. **Antwort.** Sonst entsteht eine Bot-Antwort mit Zitat, sichtbar mit Badge `ungeprüft`, `noindex`. Das gilt für Fragen ohne
   Entwurf: Der Web-Prozess legt sie nach der Freigabe in die Schlange. Bis dahin steht dort „noch keine Antwort“.
9. **Kein Beleg.** Nach einem zweiten Anlauf mit ganzen Kapiteln (§7.2) geht die Frage als
   `kein_beleg` an die Moderation und in den Lückenbericht. Öffentlich steht „Dazu habe ich im Skript
   nichts gefunden“, nie „steht nicht im Skript“.
10. **Prüfung.** Moderation setzt `geprüft` oder korrigiert. Erst dann ist die Seite indexierbar.

Wartezeit: Ohne Einwilligung bestimmt die Freigabe durch Menschen die Antwortzeit, mit Einwilligung kommt der Entwurf in
rund einer Minute. Das sagt die Oberfläche offen.
Benachrichtigung gibt es nur als „Meine Fragen“, weil eine E-Mail-Adresse genau das wäre, was wir
nicht speichern wollen.

## 6. Suche im Browser

### 6.1 Was läuft

Ergebnis von Phase 0 (2026-11-04): **`multilingual-e5-small`, Vokabular auf 16.384 Tokens geschnitten.**
Gleicher Stack wie hAInrich: transformers.js, ONNX Runtime WASM, Web Worker, `numThreads = 1`, Modell
selbst ausgeliefert. Anfragen tragen das Prefix `query: `, Passagen `passage: `. Download 29,4 MB
(28,6 MB Modell, 0,8 MB Tokenizer), komprimiert rund 21 MB, dazu 14 MB WASM-Runtime.

| Kandidat | Download (int8 + Tokenizer) | Lizenz | Ergebnis |
|---|---|---|---|
| `multilingual-e5-small`, geschnitten | 29,4 MB | MIT | **gewählt**, gleiche Qualität wie ungeschnitten |
| `Xenova/multilingual-e5-small` | 135 MB | MIT | gleiche Qualität, gut viermal so groß |
| `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | 135 MB | Apache 2.0 | verworfen, Skript-Suche nicht besser als MiniLM |
| `ibm-granite/granite-embedding-97m-multilingual-r2` | 123 MB | Apache 2.0 | nicht gemessen, nicht mehr nötig |
| `ferrisS/german-multilingual-e5-small` | ~39 MB (geschätzt) | MIT | nicht gemessen, nicht mehr nötig |

### 6.2 Der Schnitt

Ein Vokabelschnitt ändert keine Gewichte: Texte, deren Tokens erhalten bleiben, bekommen denselben
Vektor. Die Tabelle liegt im int8-ONNX als Initializer eines `Gather` vor und macht 96 der 118 MB aus,
der Rest sind 21,7 MB. `research/2026-11-04-browsermodell/trim.py` schneidet Tabelle und Tokenizer
direkt, die vollen Gewichte braucht es dafür nicht.

Behalten werden Spezialtokens, Einzelzeichen, alle 6.734 Tokens des Skripts, dann die häufigsten
Tokens aus Transkripten, anderen Skripten und englischen Texten. Das Skript zuerst ist entscheidend:
Ohne diese Regel blieben 40 % der Passagen gleich tokenisiert, mit ihr 99,8 %. Fehlende Wörter
zerfallen in kleinere Stücke, `<unk>` kam nicht vor.

`keep-ids-16384.txt` macht den Schnitt ohne die privaten Korpustexte reproduzierbar. `site/build.mjs`
kopiert das fertig geschnittene Modell von `xtraspace` und prüft die SHA-256 aus dem Messbericht; auf
einem frischen Rechner muss vorher `trim.py` auf dem festgepinnten Basismodell laufen (Revision
`761b726d`). Neue Fachwörter im Skript kosten etwas Genauigkeit, ein Neuschnitt ist ein Skriptlauf.

Das Modell lädt erst beim ersten Fokus ins Suchfeld, Crawler und reine Leser zahlen nichts. Bis es da
ist, läuft eine lexikalische Suche, die auch als Rückfall bleibt. WASM-Threads wären auf dem eigenen
Host möglich, lohnen aber nicht: 11 statt 31 ms auf dem Desktop bei ohnehin reichender Latenz. COOP und
COEP entfallen damit.

### 6.3 Was die Suche leistet

Embeddings liefern Kandidaten, sie entscheiden nichts (§19). Ein Schwellwert kommt nirgends vor. Die
Top 5 erscheinen als Vorschläge, die Entscheidung trifft ein Klick oder der Richter.

Der direkte Kosinus zwischen Fragen findet das Duplikat nur zu gut 60 % in den Top 5. Besser ist der
Umweg über das Skript: Jede Frage bekommt ein Profil aus ihren 20 ähnlichsten Passagen, die Rangfolge
mischt Kosinus und Profilähnlichkeit (z-normiert, Profil doppelt gewichtet). Das hebt die Top 5 auf 74
bis 80 % und die Top 20 auf 92 %, ohne größeres Modell. Die Passagen-Ähnlichkeiten rechnet der Client
für die Skript-Suche ohnehin. Sobald Antworten Zitate tragen, kann das Profil aus den echten Zitaten
kommen; das dürfte besser sein, ist aber nicht gemessen.

### 6.4 Der Richter

Nach der Freigabe entscheidet `claude-haiku-5-5` in zwei Schritten. Die Kandidaten berechnet der
Worker mit demselben Embedder neu, Vektoren vom Client gelten nicht.

1. **Liste:** Die neue Frage und ihre Top 20 gehen in einen Aufruf, das Modell nennt eine Nummer oder 0.
   Top 20 statt Top 5, weil das die Trefferquote von rund 75 auf 92 % hebt.
2. **Bestätigung:** Der Treffer geht als Einzelpaar noch einmal an dasselbe Modell. Zusammengelegt wird
   nur, wenn beide Schritte zustimmen.

Der zweite Schritt ist nötig: In der Liste legte Haiku „L1-Regularisierung“ mit „L2-Regularisierung“
zusammen, als Einzelpaar lehnte es das ab. Nach der Bestätigung blieb keine klar falsche
Zusammenlegung übrig, automatisch erkannt werden rund 60 % der echten Duplikate (§19). Das ist gewollt
vorsichtig: Ein verpasstes Duplikat kostet eine Antwort mehr und lässt sich von Hand zusammenlegen, eine
falsche Zusammenlegung zeigt still eine falsche Antwort. Beide Aufrufe kosten zusammen rund 0,02 Cent.
Die Moderation kann jede Zusammenlegung trennen, jeder Fall landet im Revisionslog.

## 7. Antworten

### 7.1 Korpus

Quelle ist `https://eidl-skript-131e30.pages.cs.uni-duesseldorf.de/llms-full.txt` (397 KB, mit
`URL:`-Zeile je Kapitel), abgerufen zur Laufzeit mit ETag, keine Kopie im Repo (Playbook §3.11). Die
Startseite, `readme` und die Abschnitte `Übung` und `Literatur` fallen weg (D12), Stand 2026-11-04
bleiben 424 Passagen aus 30 Kapiteln. Der Worker prüft täglich. Passagen sind ein bis drei Absätze und zerschneiden keine Formeln, Listen oder
Codeblöcke. Überschriften-Anker werden aus dem veröffentlichten HTML gelesen, nicht nachgebaut
(MyST macht aus „Zurück zum Perzeptron“ `zur-ck-zum-perzeptron`). Der Hash je Passage erkennt
Änderungen. Betroffene Antworten bekommen den Status `quelle_geändert` und erscheinen in der
Moderation.

### 7.2 Ablauf

1. Hybride Suche im Worker: Embeddings plus BM25, Top 12 samt Nachbarpassagen, etwa 10k Tokens.
2. Claude antwortet nur aus den Passagen. Die Frage wird als Daten übergeben, nicht als Anweisung.
   Rutscht eine Frage zu Übungen oder Organisatorischem durch, gibt es keine Antwort (D12).
3. Ohne Beleg ein zweiter Anlauf mit den zwei besten ganzen Kapiteln. Das lokale Modell lehnte zu
   Unrecht ab, obwohl die Inhalte im Skript stehen. Claude tut das selten: Bei 90 Antworten brauchte
   nur Sonnet viermal den zweiten Anlauf, dreimal blieb es bei „kein Beleg“.
   Teilantworten zählen nicht auf, was fehlt, und behaupten nie, etwas stehe nicht im Skript (Konrad, 2026-11-05): Das Modell
   sieht rund 27 von 442 Passagen, und bei 5 von 23 Fragen waren solche Aussagen falsch. Es schreibt stattdessen das Steuerwort
   `TEILANTWORT`. Das wird nie angezeigt und fließt als `partial` in den Lückenbericht.
4. Prüfschritt: Trägt jedes Zitat seine Aussage? Eine gültige Passage kann die falsche sein. Vorerst nur
   ein Hinweis an die Moderation, kein Tor: Der erste Prüfer schlug bei 54 von 87 Antworten an, bei allen
   Modellen gleich oft, oft wegen eigener Schlussfolgerungen (§19). Ob er taugt, zeigt der Abgleich
   mit den Bewertungen aus dem Blindvergleich.
5. Der Worker setzt das Zitat ein: ganze Passage, Kapitel, Link. Der PII-Check läuft auch hier.

### 7.3 Zitate

Claude hat dafür eine fertige Funktion: Citations mit `citations: {enabled: true}` auf
`document`-Blöcken. Jede Passage ist ein eigenes Dokument mit eigenem Inhalt, die Antwort verweist
per `document_index` darauf. Das ist genau „Zitat per ID“, ohne eigenes Format, und `cited_text` kostet
keine Output-Tokens. Citations verträgt sich nicht mit `output_config.format`, also bleibt die Antwort
Text und „kein Beleg“ ein Schlüsselwort. Das passt, denn JSON zerstörte in der Messung LaTeX. Geprüft
am 2026-11-04 mit Opus, Sonnet und Haiku 5.5, auch im Batch. Eine Antwort ohne ein einziges Zitat
zählt nicht als Antwort.

Links: Überschriften-Anker plus Text-Fragment (`#anker:~:text=…`) aus den ersten Wörtern bis zur ersten
Formel. Gemessen am veröffentlichten Skript: Der Browser springt zum Text, ohne Treffer bleibt der Anker
als Rückfall. Die Anker sind stabil, solange die Überschrift bleibt; das prüft der tägliche Lauf.

### 7.4 Modell und Kosten

Listenpreise laut mitgelieferter Claude-API-Doku, Stand 2026-10-06, vor dem Start prüfen. Annahme je
Antwort: 10k Tokens rein, 2k raus samt Denken. Gemessen an 90 Antworten waren es rund 14k rein und 0,8k
bis 1,4k raus, deutscher Text mit Formeln tokenisiert teurer als gedacht. Die Summen stimmen trotzdem:
7,9 ct bei Opus, 3,6 ct bei Sonnet, 0,2 ct bei Haiku. Der Prüfschritt mit Sonnet kostet 0,8 ct je Antwort.

| Modell | $/MTok rein/raus | je Antwort | am Deckel (20 am Tag) im Monat | mit Batch (−50 %) |
|---|---|---|---|---|
| `claude-opus-5-5` | 4 / 20 | 8,0 ct | 48 $ | 24 $ |
| `claude-sonnet-5-5` | 2 / 10 | 4,0 ct | 24 $ | 12 $ |
| `claude-haiku-5-5` | 0,10 / 0,50 | 0,2 ct | 1,20 $ | 0,60 $ |

Der Deckel ist die Obergrenze, nicht die Erwartung. Vorgabe ist Opus 5.5, wie gewünscht. Ob für
„sehr kostensparsam“ ein kleineres Modell reicht, entscheidet ein Blindvergleich auf den 30
Seed-Fragen in Phase 1 `[owner]`. Das ganze Skript in den Prompt zu legen kostet ungecacht rund
60 ct je Frage bei Opus und lohnt erst bei Volumen, deshalb Retrieval. Batch ist ein späterer
Schalter; bei wenigen Fragen am Tag sparen die zusätzlichen Zustände kaum etwas.

Der Worker nutzt das offizielle SDK `@anthropic-ai/sdk`, einen eigenen Workspace mit eigenem Key und
prüft `stop_reason` auf `refusal`. Im Betrieb gehört `fallbacks: "default"` dazu; im Blindvergleich ist es
bewusst aus, damit kein anderes Modell unbemerkt einspringt. Entwürfe laufen einzeln, nicht im Batch: Batch verträgt sich
nicht mit `fallbacks` und wäre nicht sofort.

Seit D20 kostet eine Frage Geld, bevor ein Mensch sie gesehen hat. Deshalb zählt der Worker selbst: höchstens 20 Anfragen am
Tag und 15 $ im Monat, darüber bleibt die Frage ohne Entwurf. Das liegt mit Abstand unter den 20 $ aus D14, das Limit in der
Console bleibt der zweite Deckel (I6). Beide Werte sind Vorgaben, die Konrad ändern kann.

## 8. PII-Checker

Ein reines Modul, gleich in Browser und Server (Playbook §3.4). Der Browser gibt nur sofort Rückmeldung,
durchgesetzt wird auf dem Server.

**Harte Sperre** (Absenden geht nicht, die Stelle wird markiert): E-Mail-Adressen, Telefonnummern,
IBANs, jede Zahl mit 6 bis 12 Ziffern (D16), Wörter wie „Matrikelnummer“ mit Zahl. Fehlalarme sind
vertretbar, „1 Mio.“ statt „1000000“ ist zumutbar.

**Weiche Treffer** (Absenden geht, Moderation muss sie ausdrücklich abhaken, bevor sie freigeben
kann): „ich heiße“, „mein Name“, „Herr“, „Frau“, „Prof.“ mit Eigenname, Grußformeln, Treffer in einer
öffentlichen Vornamenliste, Paare großgeschriebener Wörter außerhalb des Skriptvokabulars,
Gesundheitswörter wie „Attest“, „krank“, „Nachteilsausgleich“ (Art. 9 DSGVO). Ein weicher Treffer hält
auch den Entwurf zurück: Die Frage geht trotz Einwilligung nicht an Claude, bis die Moderation sie
freigibt. Gebaut sind die Regeln ohne Vornamenliste und ohne Wortpaare.

Namen sind per Regel nicht zuverlässig zu fangen. Das Sicherheitsnetz dafür ist die Moderation, der
Checker lenkt nur ihren Blick. **Die Teilnehmerliste aus ILIAS kommt nicht in den Checker:** im
Client würde sie die Kursliste veröffentlichen, und sie gehört nicht auf den VPS.

Der Checker läuft auf allem, was öffentlich wird: Fragen, Varianten, eigene Antworten,
Moderationsänderungen, Bot-Ausgaben.

**Themen-Hinweis** (kein PII, sperrt nichts): Wörter wie „Blatt“, „Abgabe“, „Klausur“, „Termin“ zeigen
vor dem Absenden, dass das Forum nur Skriptinhalte behandelt (D12). Das muss weich bleiben, „die
Aufgabe eines Autoencoders“ ist eine gute Frage.

## 9. Moderation und Datenmodell

**Rollen:** `moderator` (Kurator ist dasselbe) darf freigeben, bearbeiten, zusammenlegen, trennen,
kanonische Fragen festlegen und Antworten prüfen. `admin` zusätzlich Konten, Limits, Budget. Konten
legt ein CLI auf dem VPS an, Passphrasen als scrypt-Hash, Sitzung als `HttpOnly`-, `Secure`-,
`SameSite=Strict`-Cookie. Das ist das einzige Cookie im System.

**Oberfläche `/mod/`,** auch auf dem Telefon bedienbar: Warteschlange neuer Fragen mit markierten
Treffern und den ähnlichsten Fragen, die der Browser der Moderation selbst berechnet; Warteschlange
ungeprüfter Antworten; `kein_beleg`; `quelle_geändert`; Meldungen.

**`public.db`:** `questions` (kanonischer Text, Status, Kapitel, Herkunft, Tag), `variants`,
`answers` (Art `bot`, `moderation`, `nutzer`; Status; Modell; Prompt-Version; Skript-Stand),
`citations` (Passage, Hash, Zitat, Link), `revisions` (vorher, nachher, Rolle, Zeit; jede Bearbeitung
bleibt nachvollziehbar), `votes` (Frage, Hash einer Kennung, die der Browser je Frage würfelt, plus oder minus; ein Token gibt es dafür nicht, D21), `pairs`, `usage`, `moderators`.
Eine Spalte `corpus` steht überall, damit später weitere Skripte ohne Umbau passen.

**`pending.db`:** `pending` (Text, Geheimnis-Hash, Tag, Zustimmungsversion, Einwilligung ja oder nein, Treffer, Zustand,
Entwurf samt Zitaten, Ablehnungsgrund). Mehr nicht, keine IP-Adresse und kein Token. Gelöscht wird mit `secure_delete`, das WAL
wird danach geleert.

Eigene Antworten durchlaufen dieselbe Freigabe wie Fragen.

## 10. Kurscode, Token, Limits

- `POST /api/token` prüft den Kurscode gegen den Hash und gibt ein signiertes, zufälliges Token aus,
  das im `localStorage` liegt. Der Server speichert dazu nichts. Es gibt keine Nutzerkonten. Der Schlüssel zum Signieren hängt
  am Hash des Codes.
- Fehlversuche und Ausgabe werden je IP begrenzt, nur im Arbeitsspeicher: 5 Fehlversuche in 15 Minuten, 5 Tokens und 6 Fragen
  in der Stunde je Adresse.
- Grenzen als Vorgabe: 2 neue Fragen pro Stunde je Token, höchstens 100 offene Fragen insgesamt,
  20 Anfragen am Tag im Worker (§7.4). Was über dem Tagesdeckel liegt, wartet auf die Moderation.
- Die Grenze je Nutzer ist weich: Alle teilen einen Code, wer ihn neu eingibt, bekommt ein neues Token. Seit D20 kostet Missbrauch
  deshalb Geld, bis zum Deckel des Worker: im schlimmsten Fall rund 1,60 $ am Tag und 15 $ im Monat. Öffentlich wird er
  weiter nicht. Der eigentliche Schutz ist der Deckel, nicht das Limit.
- Abstimmen braucht kein Token (D21). Je Adresse gehen 200 Stimmen in der Stunde, insgesamt 5000, nur im Arbeitsspeicher. Hoch angesetzt, weil ein Hörsaal
  hinter einer Adresse sitzt. Das bremst Skripte, verhindert aber keine Manipulation.
- Der Code wird zum Semesterwechsel gewechselt. Mit dem Hash ändert sich der Schlüssel, alte Tokens gelten dann nicht mehr.

## 11. Datenschutz und Recht

Keine Rechtsberatung. Kein Ersatz für eine Prüfung der fertigen Texte.

### 11.1 Offenlegung

Die Zustimmung steht direkt am Absenden, mit Versionsnummer je Frage. Die Texte stehen in `lib/fragen.js`. Pflicht, Version 1:

> Meine Frage wird nach Prüfung durch die Moderation dauerhaft öffentlich sichtbar. Danach verarbeitet
> ein Sprachmodell von Anthropic (USA) sie, um eine Antwort zu erzeugen. Ich gebe keine Namen,
> Matrikelnummern oder anderen personenbezogenen Daten ein.

Freiwillig, nicht vorbelegt (D20):

> Ich willige ein, dass meine Frage schon vor der Prüfung an Anthropic (USA) geht, damit ich sofort einen Entwurf bekomme. Frage
> und Entwurf sehe bis zur Entscheidung der Moderation nur ich. Ohne Einwilligung bekomme ich die Antwort nach der Freigabe.
> Ich kann die Einwilligung widerrufen, indem ich die Frage unter „Meine Fragen“ lösche; was schon gesendet ist, bleibt davon
> unberührt.

Dazu auf jeder Antwort: Bot-Kennzeichnung (Art. 50 Abs. 1 AI Act gilt seit dem 2. August 2026),
Status und der Satz „Prüfen Sie das Zitat“. Seeds tragen „Beispielfrage“.

### 11.2 Wo der Plan von „Löschfristen umgehen wir“ abweicht

Bestätigt als D13. Für den öffentlichen Bestand gilt D6. Das stimmt aber nur, weil §5 die Verbindung zur Person kappt
und die Moderation Personenbezogenes entfernt. Das Verbot in den Nutzungsbedingungen allein ändert
nichts daran, was tatsächlich eingegeben wird, und die DSGVO hängt an der Verarbeitung, nicht an der
Erlaubnis. Zwischen Eingabe und Moderation können also personenbezogene Daten auf dem Server liegen.

Deshalb drei billige Maßnahmen statt eines Löschkonzepts: `pending.db` kommt nie ins Backup,
abgelehnte Texte werden sofort gelöscht, Unbearbeitetes nach 28 Tagen. Die Zusage auf der Seite lautet
30 Tage; Frist plus täglichem Lauf bleibt darunter (Playbook §3.6). Das kostet einen Timer und einen
Satz. Ein durchgerutschter Name bleibt in Sicherungen von `public.db` bis zu sechs Monate
(`restic_keep`); auch das gehört in die Erklärung.

### 11.3 Was D5 trägt

„Keine eigene Einwilligung für die USA“ hält für freigegebenen Text, den die Moderation gelesen hat. Vor der Freigabe trägt
diese Begründung nicht: Dort können personenbezogene Daten stehen, die erst die Moderation entfernt (§11.2). Deshalb gilt
seit D20 ein zweiter Weg mit eigener Grundlage, der ausdrücklichen Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO, und I1 hält
alles andere draußen. Der Richter läuft weiter erst nach der Freigabe, für ihn gibt es keine Einwilligung.

Was daran hängt und nicht durch Technik zu lösen ist:

- **Freiwilligkeit.** Konrad ist Prüfer der Fragenden. Eine Einwilligung trägt nur, wenn Nein nichts kostet. Darum beantwortet
  auch der Weg ohne Einwilligung jede Frage, und nichts an der Oberfläche drängt zum Ja.
- **Reichweite.** Sie deckt, was die Person selbst eingibt. Ein Dritter, den sie in der Frage nennt, hat nicht eingewilligt.
  Dagegen stehen nur das Verbot, Checker und Hinweis. Ein Rest bleibt, Namen fängt keine Regel (§8).
- **Art. 9.** Gesundheitsangaben bräuchten eine ausdrückliche Einwilligung gerade dafür. Der Text deckt das nicht ab, deshalb
  halten die Wörter aus §8 den Entwurf zurück.
- **Löschen.** Der Widerruf wirkt nur nach vorn: Was bei Anthropic liegt, löscht ein Klick hier nicht. Das steht im Text.

Anthropic nennt für kommerzielle Kunden die Löschung von Ein- und Ausgaben binnen 30 Tagen, mit
Ausnahmen, etwa bis zu 2 Jahren bei markierten Regelverstößen. Vertragspartner, Auftragsverarbeitung, Grundlage der
Übermittlung in die USA und Trainingsausschluss sind vor dem Start aus den Originaldokumenten zu übernehmen `[owner]`; die
Sekundärquellen widersprechen sich. Solange das fehlt, stehen in `site/texte/datenschutz-fragen.md` Platzhalter, und
`site/build.mjs --fragen` bricht daran ab.

**Abstimmen (D21).** Lesen bleibt ohne Cookie und ohne `localStorage`. Beides entsteht nur beim Klick auf einen Pfeil, also auf ausdrücklichen Wunsch; ein
Banner ist dafür nach meinem Verständnis wie in §11.4 nicht nötig. Die Stimmen liegen in `public.db` und damit in den Sicherungen. Das ist vertretbar, weil
der Hash einer zufälligen Kennung zu niemandem führt (I11). Der Absatz dazu steht in `site/texte/datenschutz-stimmen.md`, `--stimmen` nimmt ihn auf.

### 11.4 Prüfliste für die Rechtstexte `[owner]`

- Impressum und Datenschutz je Projekt, Eintrag in `~/files/work/RECHTSTEXTE.md` §2, eigene Adresse.
- Hoster-Absatz „ohne Protokoll“ um Token und Geheimnis im `localStorage` ergänzen. Beides entsteht
  erst nach einer Eingabe, ein Banner ist dafür nach meinem Verständnis nicht nötig.
- Nutzungsbedingungen: Verbot personenbezogener Daten, Freigabe, Nutzungsrechte an Beiträgen.
  Skriptzitate stehen unter CC BY-SA 4.0, das gilt auch für die Zitate im Forum.
- Meldeweg auf jeder Seite für rechtswidrige Inhalte und Löschwünsche (Art. 16 DSA gilt nach meinem
  Verständnis für alle Hosting-Dienste).
- Klar sagen: privates Angebot, nicht der HHU, kein HHU-Logo, Nutzung freiwillig und ohne Einfluss
  auf die Bewertung. Du bist Prüfer der Fragenden; der Kurscode aus ILIAS und ein Link aus dem Skript
  machen die Nähe sichtbar.
- Falls eine Tutorin dazukommt (D15): Sie sieht Rohtexte und handelt auf deine Weisung, das
  schriftlich regeln.

## 12. Seeding

Fragen, die aus dem Skripttext generiert werden, fragen nur, was der Text ohnehin beantwortet; das
war die Kritik an hAInrich. Deshalb Personas über Inhaltsverzeichnis und Glossar, ergänzt um die
Fragerunden der Aufzeichnungen. Dort fehlen die Wortmeldungen, die Antworten lassen aber auf die
Fragen schließen (stark in VL 2, 9, 13, 14, 15 von 2025/26). Aus den Transkripten wandern nur
sinngemäße Fragen, keine Zitate von Personen.

Rund 100 Kandidaten, Richter entdoppelt, 30 gleichmäßig über die Kapitel, Opus 5.5 prüft Sprache und
Inhalt der Fragen und Antworten als Batch, dann gehst du sie durch. Geschätzte Kosten unter 5 $. Die
Fragen dienen zugleich als Testset. Seeds zu Übungen oder Organisatorischem gibt es nicht (D12).

## 13. Anbindung ans Skript

- „Frage zu diesem Abschnitt“: Link aus jeder Skriptseite mit Kapitel und Anker im Parameter. Der
  Kontext geht in die Suche und ins Retrieval ein. Das ist ein kleiner Eingriff im Repo `eidl-skript`,
  gekennzeichnet als externes Angebot.
- Lückenbericht für dich: je Kapitel `kein_beleg`, Votes, abgelehnte Duplikate, korrigierte
  Antworten. Eine Seite in `/mod/`, keine öffentlichen Daten.

## 14. Wiederverwendung aus hAInrich

Übernommen als Kopie, weil Modell und Runtime hier ohnehin abweichen: `modules/model.js`,
`modules/search.js`, `modules/vectors.js`, `worker.js`, `modules/workerInterface.js`, die Smoke-Tests.
Als Vorlage: `tools/faqgen/lib/segment.js`, `lib/verify.js`, `review.mjs`. Nicht übernommen:
`lib/llm.js` (für Claude gilt das offizielle SDK) und der Pipeline-Trigger aus `feedback-project`.
Regeln aus dem Playbook gelten unverändert, §5 ist die Checkliste für den Start.

## 15. Phasen

Jede Phase ist für sich nutzbar. Die Abnahmewerte sind Vorschläge.

**Phase 0: Messung.** Testset auf mindestens 100 Paare ausbauen, Kandidaten aus §6.1 messen, Haiku als
Richter, Latenz auf einem Mittelklasse-Telefon. Abnahme: Modellentscheidung mit Zahlen in §19.
Der kleinste Kandidat gewinnt, der das Duplikat zu 85 % in die Top 5 und das richtige Kapitel zu 90 %
in die Top 3 bringt, bei unter 500 ms je Anfrage.

Stand 2026-11-04: Modell entschieden (§6.1). Kapitel in den Top 3: 92 %, erreicht. Latenz: 89 ms bei
vierfacher und 139 ms bei sechsfacher CPU-Drosselung, erreicht, auf einem echten Telefon noch nicht
geprüft. Duplikat in den Top 5: 74 bis 80 %, **nicht erreicht**, auch nicht von e5-large; deshalb
bekommt der Richter die Top 20 (92 %). Haiku als Richter ist gemessen (§6.4, §19). Damit ist Phase 0
abgeschlossen, bis auf die Latenz auf einem echten Telefon.

**Phase 1: Korpus und Antworten, offline.** Segmentierung, Citations, Prüfschritt, Seeds,
Blindvergleich der Modelle, Opus-Durchgang. Abnahme: 30 von dir geprüfte Antworten mit Zitat, falsche
Ablehnungen benannt, Antwortmodell entschieden.

Stand 2026-11-04: Korpus, Suche, Citations, Richter, 30 Seeds und 90 Antworten stehen, die Review-Seite
läuft (`node tools/review.mjs`). Offen sind dein Blindvergleich, die Modellwahl und danach der
Opus-Durchgang über die Antworten des gewählten Modells. Bisher 3,54 $, Deckel 5 $.

**Phase 2: Öffentliche Lese-Site.** Hostname, Rolle im Server-Repo, Caddy-Block mit CSP, Rechtstexte,
Suche, statische Seiten. Braucht noch keine Schreibpfade. Abnahme: Smoke-Test, Telefonbreite gemessen,
keine fremden Anfragen.

Stand 2026-11-04: Der lokale Teil steht. `site/build.mjs` baut 33 Seiten, die Suche läuft im Browser,
Impressum und Datenschutz liegen als Entwurf vor. Smoke-Test grün unter der geplanten CSP, keine fremden
Anfragen, kein seitliches Scrollen auf allen 33 Seiten bei fünf Breiten. Seit 2026-11-04 steht die Vorschau als
Staging auf `hai.konradvoelkel.com`: Der Name ist nirgends verlinkt, alle Seiten tragen `noindex` und Banner, die
Sitemap ist leer (Entscheidung Konrad, er liest die Rechtstexte dort). Der Smoke-Test ist dort in Chromium grün.
Offen: Rechtstexte lesen `[owner]`, Firefox und Safari, Antwortmodell aus Phase 1, Vorschaukarte für Open Graph.

**Phase 3: Schreibpfad und Moderation.** Token, Zustimmung, Checker, `pending`, `/mod/`, Votes,
eigene Antworten, gelabelte Paare. Noch ohne API, Antworten schreibt die Moderation. Abnahme: alle
Invarianten als Tests grün, ein Durchlauf mit echten Fragen.

Stand 2026-11-05: Die Moderation kommt zuerst, auf Konrads Wunsch, und läuft auf dem Server: Anmelden, Fragen und Antworten bearbeiten,
als geprüft markieren, zurückziehen, Verlauf; `public.db` aus §9 ohne `variants`, `votes`, `pairs`, `usage`. Sitzungen
und Fehlversuche liegen nur im Arbeitsspeicher. Vorgaben, die Konrad umdrehen kann: Die Seeds bleiben sichtbar, und
bearbeitet wird der Bestand von Opus 5.5; der Blindvergleich entscheidet dann nur noch das Modell für neue Antworten. Solange
die Site Vorschau ist, bleibt auch Geprüftes `noindex`. Offen: Ende der Vorschau `[owner]`, neue Vektoren für bearbeitete
Fragen, weiche Treffer des Checkers, alles zu Fragen von außen.

Erste Moderation am 2026-11-05: 28 geprüft, 2 zurückgezogen, 14 bearbeitet. In 13 der 14 hat Konrad den Absatz gestrichen, der
sagt, was offenbleibt, obwohl Prompt-Version 1 genau das verlangt. Prompt-Version 2 lässt das weg (§7.2). Die vorhandenen
Antworten stammen aus Version 1.

Stand 2026-11-05, gebaut, aber nicht ausgespielt: Fragen mit Kurscode, Einwilligung, Entwurf nur für die fragende Person,
„Meine Fragen“, Warteschlange in der Moderation, Fristen (D20). Ohne Kurscode-Hash bleibt der Fragepfad beim Web-Prozess aus, ohne
Schlange gibt es keinen Entwurf, und `--fragen` schaltet Rechtstexte und Technik gemeinsam. Damit steht der Worker aus Phase 4
schon, ohne Richter. Offen: `variants`, `votes`, `pairs`, eigene Antworten, Themen-Hinweis (§8), Kurscode-Scan aus I7.

Stand 2026-11-05, ebenfalls gebaut und nicht ausgespielt: Abstimmen über Fragen (D21), mit eigenem Schalter, denn es hängt weder am
Kurscode noch an Anthropic. Die Summe steht fest in den Seiten, Lesen bleibt statisch und ohne JavaScript; der Web-Prozess schreibt
geänderte Seiten gebündelt alle 15 Sekunden neu. Die Abstimmung selbst braucht JavaScript, weil die CSP Formulare verbietet.

**Phase 4: Worker live.** Richter, Antworten, Budgetdeckel, Skriptstand-Prüfung. Abnahme: Eine Woche
Betrieb mit echten Kosten im `usage`-Bericht.

**Phase 5: Skript-Anbindung.** Abschnitts-Link, Lückenbericht.

## 16. Tests

- Reine Module (Checker, Zustände, Segmentierung, Limits) als Node-Unit-Tests.
- Modell: SHA-256 der ausgelieferten Dateien, Vektor-Parität zwischen Node und Browser. Native
  Runtime und WASM unterscheiden sich bei int8 leicht (Kosinus bis 0,995), die Rangfolge hält das aus.
- API gegen temporäres SQLite, Claude immer als Stub. Kein Test ruft die echte API.
- Je Invariante ein Test. I1 auch strukturell: Der Test startet den Worker unter derselben Unit-Regel.
- Eigenschaftstest: Kein öffentlicher Datensatz trifft eine harte Regel.
- Statischer Scan: keine fremden URLs, kein Kurscode. Smoke-Test: keine Anfrage vor dem ersten Klick.
- Telefonbreite über alle Seiten per `scrollWidth`, Playbook §3.10.

## 17. Offene Punkte `[owner]`

1. ~~Hostname.~~ Entschieden 2026-11-04: `hai.konradvoelkel.com/eidl` (D11). Der MX steht seit 2026-11-04,
   A und AAAA fehlen noch.
2. ~~Remote.~~ Entschieden 2026-11-04: privates GitHub-Repo `konradvoelkel/hainrich2`. Öffentlich erst
   nach dem Audit aus Playbook §5 Punkt 10; die Messskripte enthalten noch lokale Pfade.
3. Antwortmodell nach dem Blindvergleich in Phase 1. Das Budget steht (D14).
4. ~~Moderation.~~ Entschieden 2026-11-04 (D15).
5. Anthropic-Konto: Der Laptop-Key läuft seit 2026-11-04 (`~/.config/hainrich2/anthropic.env`, nicht
   im Repo). Das Limit von 20 $ greift für ihn (Konrad, 2026-11-04).
   Für den VPS kommt ein eigener Service-Account-Key in den Vault.
6. ~~Frist für ungeprüfte Antworten.~~ Entschieden 2026-11-04: keine Frist (D10).
7. ~~Format der Matrikelnummer.~~ Entfällt durch D16.

## 18. Verworfen

| Alternative | Warum nicht |
|---|---|
| GitLab Pages mit Pipeline-Trigger | Kein POST-Ziel für ein Forum, rund 20 s Job je Klick, Votes unmöglich. |
| 4090 als Backend im Betrieb | D1. Für Offline-Arbeit bleibt sie verfügbar, wird aber nicht gebraucht. |
| Schwellwert auf Kosinus | §19: trennt nicht, selbst mit e5-large. Ein falscher Merge zeigt still eine falsche Antwort. |
| `paraphrase-multilingual-MiniLM` | 135 MB, Skript-Suche 69 % statt 92 %, Duplikate schlechter als e5-small. |
| Ungeschnittenes e5-small | Gleiche Qualität bei 135 statt 29,4 MB. |
| WASM-Threads mit COOP und COEP | 11 statt 31 ms, unnötig; zusätzliche Header und Isolationsregeln für nichts. |
| Richter vor der Freigabe | Würde Text ohne Einwilligung in die USA senden, bricht I1. Mit Einwilligung bringt er der fragenden Person nichts, was der Entwurf nicht auch bringt. |
| Stimmen nur mit Kurscode | War der Plan bis D21. Konrad will, dass alle abstimmen. |
| Doppelte Stimmen über einen Hash der IP-Adresse verhindern | Personenbezogen, wäre I11 los, und ein Hörsaal teilt sich eine Adresse. |
| Cookie für Abstimmende | „Wer hier liest, bekommt keine Cookies“ soll stehen bleiben. Die Kennung entsteht erst beim Klick. |
| Eine Kennung je Browser statt je Frage | Der Server könnte alle Stimmen einer Person verbinden. Je Frage kostet das nichts. |
| Summen per `fetch` nachladen | Eine Anfrage je Seitenaufruf, und ohne JavaScript stünde keine Zahl da. |
| Schlange in einer eigenen SQLite-Datei | Läge unter `/srv` und im Backup; Dateien in `/run` brauchen im Worker gar keine Datenbank. |
| Entwurf für alle ohne Einwilligung | Bricht §11.3: Ungeprüfter Text in die USA, ohne Grundlage. |
| Vektoren vom Client übernehmen | Beliebig fälschbar; der Worker rechnet selbst, auch für den Entwurf. |
| JSON für Antworttexte | LaTeX bricht (`\t`, `\b` als Escape), §19. |
| Ganzes Skript im Prompt | Rund 60 ct je Frage ungecacht bei Opus, lohnt erst bei Volumen. |
| E-Mail-Benachrichtigung | Personenbezogenes Datum nur für Komfort. |
| Transkripte an Claude senden | Sie sind privat und könnten Namen enthalten. Die 4090 erschließt die Fragen lokal, nur die sinngemäße Liste geht weiter. |
| ILIAS-Namensliste im Checker | Veröffentlicht die Kursliste. |
| `?corpus=` im alten Repo | Andere UI, Backend und Modell; dort gilt außerdem Pages. |

## 19. Messungen

Details und Skripte: `research/2026-11-04-dedupe/`. Selbst geschriebenes, absichtlich hartes Set,
klein. Die Richtung ist belastbar, die einzelne Zahl nicht.

| | MiniLM int8 | multilingual-e5-large | LLM als Richter |
|---|---|---|---|
| Kosinus echter Duplikate, Median | 0,48 | 0,91 | – |
| Kosinus gleicher Wörter, andere Frage, Median | 0,68 | 0,89 | – |
| AUC | 0,24 | 0,56 | – |
| Duplikate erkannt | nicht trennbar | 21 von 24 | 22–23 von 24 |
| Falsche Zusammenlegungen | nicht trennbar | 16 von 24 | 0 von 24 |
| Gleiche Frage Deutsch/Englisch | 0,19 | 0,92 | 6 von 6 |
| Duplikat in Top 3 / Top 5 von 72 | 42 / 58 % | 79 / 92 % | – |
| Richtiges Kapitel in Top 3 / Top 5 | 75 / 81 % | 94 / 98 % | – |

Richter: `qwen3.6:27b` 22 von 24, `gemma4` 23 von 24, je etwa 0,5 s pro Paar. Antwort-Stichprobe mit
7 Fragen: keine erfundene ID. `qwen3.6:27b` lehnte Klausur, Übungsaufgabe und Prompt-Injection korrekt
ab, MSE gegen Cross-Entropy und RLHF aber zu Unrecht. `gemma4` beantwortete die Übungsfrage mit
Unsinn, belegte eine Antwort mit einer unpassenden Stelle und zerstörte LaTeX im JSON-Modus.

Zweite Messung, Details in `research/2026-11-04-browsermodell/`: 50 Duplikate, 50 Negativpaare, 10
Paare Deutsch/Englisch, 150 Fragen im Bestand, 100 Anfragen an 631 Passagen, alle Kapitel. Bei 50
Paaren ist ein Punkt 2 %, das 95-%-Intervall um 64 % reicht von 50 bis 76 %.

| | MiniLM | paraphrase | e5-small | e5-small, Schnitt | e5-large |
|---|---|---|---|---|---|
| Download | 23 MB | 135 MB | 135 MB | 29,4 MB | zu groß |
| Kapitel in Top 3 | 72 % | 69 % | 92 % | 92 % | 95 % |
| Kapitel in Top 5 | 80 % | 79 % | 98 % | 98 % | 98 % |
| Duplikat in Top 5, Kosinus | 32 % | 48 % | 64 % | 62 % | 70 % |
| Duplikat in Top 5, mit Profil | – | – | 80 % | 80 % | – |
| Duplikat in Top 20, mit Profil | – | – | 92 % | 92 % | – |
| Kosinus gleiche Frage Deutsch/Englisch | 0,31 | 0,83 | 0,91 | 0,91 | 0,93 |

Die Profil-Gewichte sind auf demselben Set gewählt, die 80 % also eher optimistisch. In der Mischung
aus dem Betrieb (Anfrage im Browser, Bestand aus Node) bleibt die Kapitelsuche bei 92/98 %, Duplikate
liegen bei 74 % in den Top 5 und 92 % in den Top 20.

Latenz im Headless-Chromium, WASM, ein Thread, 40 deutsche Fragen: 31 ms im Median, 89 ms bei
vierfacher, 139 ms bei sechsfacher CPU-Drosselung (p95 177 ms). Laden 1,0 bis 2,8 s vom lokalen Server.

Haiku 5.5 als Richter, Aufwand `low`, 110 Paare und 100 Fragen gegen ihre Top 20, Kosten zusammen
2,3 Cent:

| | Ergebnis |
|---|---|
| Einzelpaare: Duplikate erkannt | 37 von 50 |
| Einzelpaare: falsche Zusammenlegungen | 0 von 50 |
| Einzelpaare: gleiche Frage Deutsch/Englisch | 10 von 10 |
| Top 20, nur Liste: klar falsche Zusammenlegungen | 2 (L1/L2, Gradient der Cross-Entropy/„Was ist Cross-Entropy?“) |
| Top 20, Liste plus Bestätigung: klar falsche Zusammenlegungen | 0 |
| Top 20, Liste plus Bestätigung: Duplikate automatisch erkannt | 32 von 50 |

Die 13 verpassten Einzelpaare sind überwiegend solche, bei denen eine Seite nur einen Teil der anderen
fragt, und die Regel im Prompt verlangt genau das. Das Set enthält unbeabsichtigt echte Duplikate unter
den Negativfragen; die Urteile dazu sind von Hand gelesen, nicht automatisch gezählt.

Suche über die 424 Passagen, gleiche 100 Anfragen, Kapitel in Top 3 / Top 5 / Top 12: Vektor 91 / 95 /
99 %, BM25 80 / 87 / 94 %, hybrid mit `k = 60` 90 / 93 / 99 %, mit `k = 10` 94 / 95 / 99 % (2026-11-04,
Skriptstand `09251b0`). Das Set ist absichtlich lexikalisch fern. Für BM25 sprechen exakte Bezeichner: 60
seltene wie `drop_last` als Frage, Treffer in Top 1 / Top 5 / Top 12: Vektor 17 / 34 / 41, `k = 60` 43 / 60 / 60,
`k = 10` 54 / 58 / 60. Den Vektor zusätzlich doppelt zu gewichten gewann bei den Fragen knapp (Top 5 97 %), ließ
die Bezeichner aber auf 46 in den Top 5 fallen und ist deshalb verworfen. Ein Punkt ist eine Anfrage; `k` ist auf
diesem Set gewählt, der Abstand liegt nahe am Rauschen. Anlass war s02: Eine englische Frage verlor die richtigen
Passagen in der Fusion (Vektor Platz 4 und 6, danach 19 und 21), die Modelle meldeten das als offen. s02 und s08
sind seitdem deutsch (D18) und mit s12 neu beantwortet, die übrigen 81 Antworten stammen aus `k = 60`.

Korpus nach dem Umbau des Skripts (2026-11-04 abends, 442 statt 424 Passagen), gleiche Anfragen, Top 3 / Top 5 / Top 12:
Vektor 91 / 94 / 99 %, BM25 80 / 87 / 94 %, hybrid 94 / 95 / 99 %. Von 131 zitierten Passagen war keine inhaltlich
geändert; `tools/move-citations.mjs` zog alle 345 Zitatstellen um, 18 auf die umbenannte Seite, 10 mit neuem Linkziel,
3 in eine größere Passage. Geänderter Wortlaut zieht nicht um und bricht den Build.

Antworten, 30 Seeds mal 3 Modelle, Prompt-Version 1:

| | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|---|
| Antworten mit Zitat | 30 von 30 | 27 von 30 | 30 von 30 |
| Länge im Median, Zeichen | 1694 | 1350 | 1189 |
| Zitate je Antwort | 4,3 | 4,0 | 3,3 |
| Prüfhinweis schwer / leicht / keiner | 10 / 8 / 12 | 7 / 10 / 10 | 12 / 7 / 11 |

Die Prüfhinweise sind eine Lesehilfe, kein Urteil: Der Prüfer sah nur die zitierten Passagen, die Schwere
ordnete Haiku ein. Ob die Antworten gut sind, entscheidet der Blindvergleich.

Lese-Site, gebaut mit `site/build.mjs`: Der erste Klick lädt 24,2 MB Brotli, davon Modell und Runtime
fast alles, die drei Datendateien 0,4 MB. `lib/rank.js` reproduziert `cand2.py` exakt (Top 5 80 %, Top 20
92 %, `rank-parity.mjs`). Vektoren gerundet, 30 Seeds gegen 424 Passagen, gegen ungerundet:

| Dezimalen | Top 5 identisch | Top-12-Menge identisch | JSON |
|---|---|---|---|
| 3 | 21 von 30 | 27 von 30 | 1,04 MB |
| 4 | 30 von 30 | 30 von 30 | 1,20 MB |

e5 packt Treffer eng, deshalb 4 statt der 3 aus hAInrich.

Noch nicht gemessen: Qualität der Antworten durch Menschen, die Latenz auf einem echten Telefon.
