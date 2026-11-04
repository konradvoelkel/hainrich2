# hAInrich2: Entwicklungsplan

_Stand 2026-11-04. Das ist ein Plan, gebaut ist nichts. Die Abschnittsnummern bleiben stabil,
Entscheidungen tragen ihr Datum. Was der Eigentümer tun oder entscheiden muss, ist mit `[owner]`
markiert._

## 1. Was das ist

Ein Frage-Antwort-Forum zum Skript „Einführung in Deep Learning“. Studierende fragen, ein klar
gekennzeichneter Bot antwortet aus dem Skript, jede Antwort trägt das wörtliche Originalzitat mit
Link. Wiederholte Fragen bekommen die vorhandene Antwort. Alle können lesen, mit Kurscode kann man
fragen, abstimmen und selbst antworten. Moderation schaltet frei, korrigiert und legt kanonische
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
| D5 | Vor dem Fragen wird klar offengelegt und bestätigt, dass Fragen öffentlich werden. Die Weiterverarbeitung öffentlicher Fragen durch ein Sprachmodell in den USA braucht keine eigene Einwilligung, wird aber transparent gemacht. |
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

## 3. Invarianten

Regeln, die die Technik erzwingt, nicht nur ein Text behauptet (Playbook §3.6). Jede bekommt einen
Test (§16).

| Nr | Invariante | Durchgesetzt durch |
|---|---|---|
| I1 | Unfreigegebener Text erreicht nie die Claude API. | Getrennte Datenbanken; der Worker hat per `InaccessiblePaths` keinen Zugriff auf `pending.db`. |
| I2 | Nichts wird ohne Freigabe öffentlich. | Snapshots entstehen ausschließlich aus `public.db`. |
| I3 | Kein öffentlicher Datensatz führt zu einer fragenden Person. | Beim Freigeben wandert nur der Text; öffentliche Zeitstempel nur auf den Tag genau. |
| I4 | Zitate stammen aus dem Korpus, nie aus Modelltext. | Das Modell verweist auf Passagen, eingesetzt wird der Originaltext. |
| I5 | Der Web-Prozess hat keinen API-Key. | `LoadCredential` nur in der Worker-Unit. |
| I6 | Ausgaben haben zwei harte Deckel. | Budgetzähler im Worker plus Ausgabenlimit des Workspace in der Console. |
| I7 | Der Kurscode steht nie im Repo, in der Memory oder im Client. | Nur ein scrypt-Hash im Ansible-Vault. Zeichenketten-Scan im Build. |
| I8 | Der Bot ist überall als Bot erkennbar. | Fester Teil der Antwort-Vorlage. |
| I9 | Nur `geprüft` ist indexierbar. | `noindex` als Vorgabe, Sitemap nur aus geprüften Antworten. |
| I10 | Jeder Schreibzugriff kommt von einem ausdrücklichen Klick. | Keine stille Telemetrie, kein Zählpixel, kein Zugriffsprotokoll. |

## 4. Architektur

```
                 Caddy
Browser --GET--> statische Seiten, JSON-Snapshots, Modell, WASM
Browser --POST-> /api/* --> hainrich2-web      kein API-Key, liest und schreibt beide Datenbanken
                                 |
                 pending.db  <---+---> public.db
                 kein Backup             Backup per restic
                                           ^
                                           |  nur freigegebene Texte
                            hainrich2-worker  Timer, API-Key, kein Zugriff auf pending.db
                                           |
                                           v
                                       Claude API
```

- **`hainrich2-web`:** Node 24 aus der Rolle `node`, `node:http` und `node:sqlite`, keine
  Framework-Abhängigkeit. Nur Schreibpfade und Moderation. `MemoryMax` eng gesetzt.
- **`hainrich2-worker`:** `systemd`-Timer mit Oneshot-Unit, kein Daemon. Läuft etwa alle fünf
  Minuten, tut nur etwas, wenn Arbeit da ist, und lädt das Embedding-Modell nur dann. Im Leerlauf
  kostet er also keinen Speicher.
- **Lesen:** Jede Änderung am öffentlichen Bestand schreibt Snapshots atomar per `rename`:
  `questions.json`, `vectors.json`, eine statische HTML-Seite je Frage, `sitemap.xml`. Markdown und
  KaTeX werden beim Veröffentlichen gerendert, auch die Mathematik braucht zum Lesen also kein
  JavaScript. Fällt die API aus, bleibt das Forum lesbar.
- **Backups:** `restic_excludes` schließt `/srv/*/data/*.db` aus; gesichert wird nur, was in
  `restic_sqlite_dbs` steht. Dort kommt nur `public.db` hinein. So landet die Warteschlange nie in
  den bis zu sechs Monate alten Sicherungen.
- **Zugriffsprotokoll:** `hainrich2_access_log: false`. Damit gilt die Fassung „ohne Protokoll“ aus
  `~/files/work/RECHTSTEXTE.md` §3. Schalter und Satz gehen am selben Tag live.
- **Server:** Rolle `hainrich2` in `~/files/work/server`, das Projekt-Repo liefert nur Dateien
  (`site/build.sh`, `site/deploy.sh`). Erst DNS, dann Caddy-Block. Beides `[owner]`.
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
   der Client die passenden Skriptstellen.
5. **Moderation.** Freigeben, bearbeiten, einer Frage als Variante zuordnen oder ablehnen.
   Ablehnen löscht den Text sofort; nur der Grund bleibt 7 Tage für die fragende Person sichtbar.
   Fragen zu Übungsaufgaben oder Organisatorischem werden abgelehnt (D12), dafür gibt es einen
   Standardgrund.
6. **Freigabe.** Der Text wandert ohne Geheimnis-Hash nach `public.db`. Ab hier gibt es serverseitig
   keine Verbindung zur Person. „Meine Fragen“ lebt nur im Browser (`localStorage`).
7. **Richter.** Der Worker holt die fünf ähnlichsten Fragen, ein Modell entscheidet über Duplikate
   (§6.4). Bei Duplikat wird die Frage Variante und die vorhandene Antwort gilt.
8. **Antwort.** Sonst entsteht eine Bot-Antwort mit Zitat, sichtbar mit Badge `ungeprüft`, `noindex`.
9. **Kein Beleg.** Nach einem zweiten Anlauf mit ganzen Kapiteln (§7.2) geht die Frage als
   `kein_beleg` an die Moderation und in den Lückenbericht. Öffentlich steht „Dazu habe ich im Skript
   nichts gefunden“, nie „steht nicht im Skript“.
10. **Prüfung.** Moderation setzt `geprüft` oder korrigiert. Erst dann ist die Seite indexierbar.

Wartezeit: Die Freigabe durch Menschen bestimmt die Antwortzeit. Das sagt die Oberfläche offen.
Benachrichtigung gibt es nur als „Meine Fragen“, weil eine E-Mail-Adresse genau das wäre, was wir
nicht speichern wollen.

## 6. Suche im Browser

### 6.1 Was läuft

Gleicher Stack wie hAInrich: transformers.js, ONNX Runtime WASM, Web Worker, Modell selbst
ausgeliefert. Dateigrößen aus der Hugging-Face-API vom 2026-11-04.

| Kandidat | Download (int8 + Tokenizer) | Lizenz | Läuft ohne Umbau | Anmerkung |
|---|---|---|---|---|
| `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | 118 + 17 = 135 MB | Apache 2.0 | ja | auf Paraphrasen trainiert, kein Prefix |
| `Xenova/multilingual-e5-small` | 118 + 17 = 135 MB | MIT | ja | braucht `query:` und `passage:`, auch für Retrieval trainiert |
| `ibm-granite/granite-embedding-97m-multilingual-r2` | 98 + 25 = 123 MB | Apache 2.0 | zu prüfen | Mai 2026, Unterstützung in transformers.js ungeprüft |
| `ferrisS/german-multilingual-e5-small` | ~39 MB (geschätzt, 35,8M Parameter) | MIT | nein, ONNX-Export und Quantisierung fehlen | nur Deutsch, Englisch leidet |
| eigener Schnitt auf Deutsch und Englisch | ~28 MB (geschätzt, 16k Tokens) | wie Basis | nein, Trim und Export nötig | einziger Weg zum 30-MB-Ziel |

Keiner davon ist bisher gemessen. Die Zahlen in §19 gelten für MiniLM und e5-large.

### 6.2 Vorgehen

Erst die beiden ungeschnittenen Modelle messen, dann den Sieger schneiden. Ein Vokabelschnitt ändert
keine Gewichte: Texte, deren Tokens erhalten bleiben, bekommen dasselbe Ergebnis. Die Qualität
entscheidet sich also am Basismodell, der Schnitt muss nur Parität zeigen. Behalten werden die
Tokens eines deutschen und englischen Textkorpus plus alle Tokens des Skripts und des Glossars.

Zum Modell kommen 14 MB WASM-Runtime. Das Modell lädt erst beim ersten Fokus ins Suchfeld, Crawler
und reine Leser zahlen nichts. Bis es da ist, läuft eine lexikalische Suche, die auch als Rückfall
bleibt. Der eigene Host erlaubt erstmals COOP und COEP, also WASM-Threads; das Playbook setzt
`numThreads = 1` nur wegen statischer Fremd-Hosts. Lohnt sich das, wird es gemessen.

### 6.3 Was die Suche leistet

Embeddings liefern Kandidaten, sie entscheiden nichts (§19). Ein Schwellwert kommt nirgends vor. Die
Top 5 erscheinen als Vorschläge, die Entscheidung trifft ein Klick oder der Richter.

### 6.4 Der Richter

Nach der Freigabe entscheidet ein Modell über die Top-5-Kandidaten, die der Worker mit demselben
Embedder neu berechnet; Vektoren vom Client gelten nicht. Lokal erreichten `qwen3.6:27b` und `gemma4`
22 bis 23 von 24 Duplikaten bei null falschen Zusammenlegungen. Für den Betrieb ist `claude-haiku-5-5`
vorgesehen und in Phase 0 mit demselben Set nachzumessen. Die Moderation kann jede Zusammenlegung
trennen, jeder Fall landet im Revisionslog.

## 7. Antworten

### 7.1 Korpus

Quelle ist `https://eidl-skript-131e30.pages.cs.uni-duesseldorf.de/llms-full.txt` (397 KB, mit
`URL:`-Zeile je Kapitel), abgerufen zur Laufzeit mit ETag, keine Kopie im Repo (Playbook §3.11). Der
Worker prüft täglich. Passagen sind ein bis drei Absätze und zerschneiden keine Formeln, Listen oder
Codeblöcke. Überschriften-Anker werden aus dem veröffentlichten HTML gelesen, nicht nachgebaut
(MyST macht aus „Zurück zum Perzeptron“ `zur-ck-zum-perzeptron`). Der Hash je Passage erkennt
Änderungen. Betroffene Antworten bekommen den Status `quelle_geändert` und erscheinen in der
Moderation.

### 7.2 Ablauf

1. Hybride Suche im Worker: Embeddings plus BM25, Top 12 samt Nachbarpassagen, etwa 10k Tokens.
2. Claude antwortet nur aus den Passagen. Die Frage wird als Daten übergeben, nicht als Anweisung.
   Rutscht eine Frage zu Übungen oder Organisatorischem durch, gibt es keine Antwort (D12).
3. Ohne Beleg ein zweiter Anlauf mit den zwei besten ganzen Kapiteln. In der Messung lehnte das
   lokale Modell zu Unrecht ab, obwohl die Inhalte im Skript stehen, das ist die Hauptgefahr.
4. Prüfschritt: Trägt jedes Zitat seine Aussage? Eine gültige Passage kann die falsche sein.
5. Der Worker setzt das Zitat ein: ganze Passage, Kapitel, Link. Der PII-Check läuft auch hier.

### 7.3 Zitate

Claude hat dafür eine fertige Funktion: Citations mit `citations: {enabled: true}` auf
`document`-Blöcken. Mit eigenem Inhalt ist jede Passage ein Block, die Antwort verweist per
`content_block_location` darauf. Das ist genau „Zitat per ID“, ohne eigenes Format. Citations
verträgt sich nicht mit `output_config.format`, also bleibt die Antwort Text. Das passt, denn JSON
zerstörte in der Messung LaTeX. In Phase 1 ist zu prüfen, ob das mit Opus 5.5 so trägt; Rückfall sind
Passagen-IDs in Tags.

Links: Überschriften-Anker plus Text-Fragment (`#anker:~:text=…`), das die Stelle markiert. Die
Anker des Skripts sind stabil, solange die Überschrift bleibt; das prüft der tägliche Lauf. Ob
Text-Fragmente auf den MyST-Seiten funktionieren, ist noch zu testen.

### 7.4 Modell und Kosten

Listenpreise laut mitgelieferter Claude-API-Doku, Stand 2026-10-06, vor dem Start prüfen. Annahme je
Antwort: 10k Tokens rein, 2k raus samt Denken.

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
prüft `stop_reason` auf `refusal`.

## 8. PII-Checker

Ein reines Modul, gleich in Browser und Server (Playbook §3.4). Der Browser gibt nur sofort Rückmeldung,
durchgesetzt wird auf dem Server.

**Harte Sperre** (Absenden geht nicht, die Stelle wird markiert): E-Mail-Adressen, Telefonnummern,
IBANs, jede Zahl mit 6 bis 12 Ziffern (D16), Wörter wie „Matrikelnummer“ mit Zahl. Fehlalarme sind
vertretbar, „1 Mio.“ statt „1000000“ ist zumutbar.

**Weiche Treffer** (Absenden geht, Moderation muss sie ausdrücklich abhaken, bevor sie freigeben
kann): „ich heiße“, „mein Name“, „Herr“, „Frau“, „Prof.“ mit Eigenname, Grußformeln, Treffer in einer
öffentlichen Vornamenliste, Paare großgeschriebener Wörter außerhalb des Skriptvokabulars,
Gesundheitswörter wie „Attest“, „krank“, „Nachteilsausgleich“ (Art. 9 DSGVO).

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
ungeprüfter Antworten nach Votes; `kein_beleg`; `quelle_geändert`; Meldungen.

**`public.db`:** `questions` (kanonischer Text, Status, Kapitel, Herkunft, Tag), `variants`,
`answers` (Art `bot`, `moderation`, `nutzer`; Status; Modell; Prompt-Version; Skript-Stand),
`citations` (Passage, Hash, Zitat, Link), `revisions` (vorher, nachher, Rolle, Zeit; jede Bearbeitung
bleibt nachvollziehbar), `votes` (nur HMAC aus Token und Eintrag), `pairs`, `usage`, `moderators`.
Eine Spalte `corpus` steht überall, damit später weitere Skripte ohne Umbau passen.

**`pending.db`:** `pending` (Text, Art, Geheimnis-Hash, Treffer, Zeit). Mehr nicht.

Eigene Antworten durchlaufen dieselbe Freigabe wie Fragen.

## 10. Kurscode, Token, Limits

- `POST /api/token` prüft den Kurscode gegen den Hash und gibt ein signiertes, zufälliges Token aus,
  das im `localStorage` liegt. Der Server speichert dazu nichts. Es gibt keine Nutzerkonten.
- Fehlversuche und Ausgabe werden je IP begrenzt, nur im Arbeitsspeicher.
- Grenzen als Vorgabe: 2 neue Fragen pro Stunde je Token, höchstens 100 offene Fragen insgesamt,
  20 Antworten am Tag im Worker. Was über dem Tagesdeckel liegt, wartet, sortiert nach Votes.
- Die Grenze je Nutzer ist weich: Alle teilen einen Code, wer ihn neu eingibt, bekommt ein neues
  Token. Das ist vertretbar, weil Missbrauch nur in der Moderationsschlange landet. Er wird weder
  öffentlich noch kostet er API-Geld. Das ist der eigentliche Schutz, nicht das Limit.
- Der Code wird zum Semesterwechsel gewechselt, alte Tokens laufen über eine Epochenzahl aus.

## 11. Datenschutz und Recht

Keine Rechtsberatung. Kein Ersatz für eine Prüfung der fertigen Texte.

### 11.1 Offenlegung

Die Zustimmung steht direkt am Absenden, mit Versionsnummer je Frage. Entwurf:

> Meine Frage wird nach Prüfung durch die Moderation dauerhaft öffentlich sichtbar. Danach verarbeitet
> ein Sprachmodell von Anthropic (USA) sie, um eine Antwort zu erzeugen. Ich gebe keine Namen,
> Matrikelnummern oder anderen personenbezogenen Daten ein.

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

„Keine eigene Einwilligung für die USA“ hält, solange nur freigegebener Text die API erreicht. Das ist
I1, und deshalb darf vor der Freigabe auch kein Claude-Aufruf laufen, nicht einmal der Richter.

Anthropic nennt für kommerzielle Kunden die Löschung von Ein- und Ausgaben binnen 30 Tagen, mit
Ausnahmen, etwa bis zu 2 Jahren bei markierten Regelverstößen. Vertragspartner, Auftragsverarbeitung
und Trainingsausschluss sind vor dem Start aus den Originaldokumenten zu übernehmen `[owner]`; die
Sekundärquellen widersprechen sich.

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

**Phase 1: Korpus und Antworten, offline.** Segmentierung, Citations, Prüfschritt, Seeds,
Blindvergleich der Modelle, Opus-Durchgang. Abnahme: 30 von dir geprüfte Antworten mit Zitat, falsche
Ablehnungen benannt, Antwortmodell entschieden.

**Phase 2: Öffentliche Lese-Site.** Hostname, Rolle im Server-Repo, Caddy-Block mit CSP, Rechtstexte,
Suche, statische Seiten. Braucht noch keine Schreibpfade. Abnahme: Smoke-Test, Telefonbreite gemessen,
keine fremden Anfragen.

**Phase 3: Schreibpfad und Moderation.** Token, Zustimmung, Checker, `pending`, `/mod/`, Votes,
eigene Antworten, gelabelte Paare. Noch ohne API, Antworten schreibt die Moderation. Abnahme: alle
Invarianten als Tests grün, ein Durchlauf mit echten Fragen.

**Phase 4: Worker live.** Richter, Antworten, Budgetdeckel, Skriptstand-Prüfung. Abnahme: Eine Woche
Betrieb mit echten Kosten im `usage`-Bericht.

**Phase 5: Skript-Anbindung.** Abschnitts-Link, Lückenbericht.

## 16. Tests

- Reine Module (Checker, Zustände, Segmentierung, Limits) als Node-Unit-Tests.
- API gegen temporäres SQLite, Claude immer als Stub. Kein Test ruft die echte API.
- Je Invariante ein Test. I1 auch strukturell: Der Test startet den Worker unter derselben Unit-Regel.
- Eigenschaftstest: Kein öffentlicher Datensatz trifft eine harte Regel.
- Statischer Scan: keine fremden URLs, kein Kurscode. Smoke-Test: keine Anfrage vor dem ersten Klick.
- Telefonbreite über alle Seiten per `scrollWidth`, Playbook §3.10.

## 17. Offene Punkte `[owner]`

1. ~~Hostname.~~ Entschieden 2026-11-04: `hai.konradvoelkel.com/eidl` (D11). DNS-Eintrag steht noch aus.
2. ~~Remote.~~ Entschieden 2026-11-04: privates GitHub-Repo `konradvoelkel/hainrich2`. Öffentlich erst
   nach dem Audit aus Playbook §5 Punkt 10; die Messskripte enthalten noch lokale Pfade.
3. Antwortmodell nach dem Blindvergleich in Phase 1. Das Budget steht (D14).
4. ~~Moderation.~~ Entschieden 2026-11-04 (D15).
5. Anthropic-Konto: Workspace, Key, Ausgabenlimit anlegen; Key in den Vault.
6. ~~Frist für ungeprüfte Antworten.~~ Entschieden 2026-11-04: keine Frist (D10).
7. ~~Format der Matrikelnummer.~~ Entfällt durch D16.

## 18. Verworfen

| Alternative | Warum nicht |
|---|---|
| GitLab Pages mit Pipeline-Trigger | Kein POST-Ziel für ein Forum, rund 20 s Job je Klick, Votes unmöglich. |
| 4090 als Backend im Betrieb | D1. Für Offline-Arbeit bleibt sie verfügbar, wird aber nicht gebraucht. |
| Schwellwert auf Kosinus | §19: trennt nicht, selbst mit e5-large. Ein falscher Merge zeigt still eine falsche Antwort. |
| Richter vor der Freigabe | Würde ungeprüften Text in die USA senden, bricht I1. |
| Vektoren vom Client übernehmen | Beliebig fälschbar; der Worker rechnet selbst. |
| JSON für Antworttexte | LaTeX bricht (`\t`, `\b` als Escape), §19. |
| Ganzes Skript im Prompt | Rund 60 ct je Frage ungecacht bei Opus, lohnt erst bei Volumen. |
| E-Mail-Benachrichtigung | Personenbezogenes Datum nur für Komfort. |
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

Noch nicht gemessen: alle Kandidaten aus §6.1, Claude als Richter und als Antwortgeber.
