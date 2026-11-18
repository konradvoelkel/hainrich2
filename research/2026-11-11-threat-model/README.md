# Threat Model: Löschen, Sicherheit, Kosten

_Stand 2026-11-11, gelesen am Commit `fe35e9b` und am Server-Repo `4337aca` (Rolle `hainrich2`). Skripte: `race.mjs`
(gleichzeitige Fehlversuche), `render.mjs` (HTML-Ausgabe und Checker), `meine.mjs` (Statusabfrage, Kostenbuch). Alle laufen lokal
gegen `lib/`, ohne Netz und ohne API._

**Ergebnis:** Die Architektur trägt. Lesen ist statisch und überlebt jeden Angriff auf den Web-Prozess, der Key liegt nur beim
Worker, XSS und CSRF sind dicht. Offen sind elf Punkte. Drei davon würde ich vor dem Ende der Alpha schließen: Der zweite
Kostendeckel fehlt (B1), das Kostenbuch sieht gescheiterte Aufrufe nicht (B2), und die Moderation kann Veröffentlichtes nicht
löschen, nur zurückziehen (A2).

**Nachtrag, noch am 2026-11-11:** B2, B3, C1, C3 und C4 sind behoben, getestet und ausgespielt (Plan D26, unten §8). A2 ist gebaut, getestet und ausgespielt (D27).
Die Befunde stehen so da, wie sie am Commit `fe35e9b` waren.

**Grenzen:** Am echten Host nur `GET` auf vier öffentliche Seiten, kein Lasttest, kein Fehlversuch. Den VPS selbst (SSH, Firewall,
die anderen Sites darauf) habe ich nicht geprüft, das gehört ins Server-Repo. Wie stark der Kurscode ist, weiß ich nicht und soll
ich nicht wissen. Ob Anthropic abgebrochene Anfragen berechnet, habe ich nicht nachgeschlagen. Keine Rechtsberatung.

## 1. Was zu schützen ist

| Gut | Wo | Schlimmster Fall |
|---|---|---|
| Fragen vor der Freigabe | `pending.db`, Schlange in `/run` | Unmoderierter Text mit Namen wird gelesen oder öffentlich |
| Geld | API-Key beim Worker | Rechnung über dem Deckel |
| Was öffentlich steht | `public.db`, `live/` | Fremder Text unter Konrads Namen, Links auf fremde Seiten |
| Moderationskonto | Passphrase, Sitzung im Arbeitsspeicher | Alles oben auf einmal |
| Erreichbarkeit | Caddy, ein Node-Prozess, ein Worker | Fragepfad oder Moderation stehen, Lesen bleibt |
| Die Zusagen im Datenschutz | Texte, Caddy ohne `log` | Eine Zusage stimmt nicht mehr |

## 2. Wer angreift

| Wer | Hat | Will |
|---|---|---|
| Fremde im Netz | nichts, beliebig viele IPv6-Adressen | stören, Passphrase raten, Stimmen fälschen |
| Studierende mit Kurscode | den Code, also beliebig viele Tokens | Unfug, Budget leeren, Warteschlange füllen, den Bot zu etwas bringen |
| Fragende aus Versehen | nichts Böses | schreiben einen Namen oder eine Krankheit hinein |
| Dritte, die genannt werden | keinen Zugang | wollen ihren Namen wieder los |
| Wer den Web-Prozess übernimmt | `data/`, `live/`, die Schlange | über die Schlange zum Worker |

## 3. Was trägt, geprüft

- **XSS:** Fragen werden maskiert, Antworten laufen durch markdown-it ohne HTML, KaTeX ohne `trust` (`\href` wird nicht
  ausgeführt). Die Platzhalter für Formeln lassen sich einschleusen, ergeben aber nur das Wort `undefined` oder eine doppelte Formel
  (`render.mjs`). Dahinter steht die CSP ohne `unsafe-inline` für Skripte, am Host nachgesehen.
- **CSRF:** Jeder `POST` prüft `Sec-Fetch-Site` oder `Origin`, das Cookie ist `__Secure-`, `HttpOnly`, `SameSite=Strict`.
- **Trennung:** Der Web-Prozess hat `IPAddressDeny=any`, der Worker `InaccessiblePaths` auf `data/` und `live/`, Key und
  Kurscode-Hash kommen je Unit per `LoadCredential`. `pending.db` ist von restic ausgenommen und löscht mit `secure_delete`.
- **SQL und Pfade:** nur vorbereitete Anweisungen; Kennungen sind selbst erzeugt oder per Muster geprüft.
- **Deckel-Rechnung:** Die zwei größten Kapitel haben 43 000 Zeichen, die drei größten 63 000. Mit 8000 Tokens Ausgabe bleibt eine
  Anfrage unter rund 30 ct, `WORST_CASE = 0.6` ist also eine echte Obergrenze für das, was im Buch landet.
- **Abhängigkeiten:** vier, exakt gepinnt, `npm audit --omit=dev` meldet heute nichts.

## 4. Befunde

Reihenfolge nach Dringlichkeit. „Nachgestellt“ heißt: Ein Skript hier zeigt es. „Gelesen“ heißt: nur aus Code oder Unit.

### A. Löschen und Melden

**A1. Der Meldeweg steht, aber nicht im Datenschutz.** Jede Seite hat im Fuß „Inhalt melden“ (`lib/site.js:124`), das Impressum
nennt dort E-Mail, Adresse der Seite und Grund für „rechtswidrige Inhalte, falsche Antworten und Löschwünsche“
(`site/texte/impressum.md:13`). Der Datenschutz selbst sagt unter „Ihre Rechte“ nur einen Satz (Art. 15–21) und unter „Nach der
Freigabe“ nur, was „nach dem Löschen“ in den Sicherungen bleibt, nicht, wie man das Löschen bekommt. Wer in einer fremden Frage
genannt wird, findet sich nirgends angesprochen. Am Host nachgesehen.
_Abhilfe:_ zwei Sätze in `datenschutz-fragen.md`, Vorschlag: „Steht in einer veröffentlichten Frage oder Antwort etwas über Sie, ob
Sie sie selbst gestellt haben oder nicht, schreiben Sie an die Adresse im Impressum und nennen die Adresse der Seite. Wir nehmen
sie von der Website und löschen sie aus der Datenbank; in den Sicherungen läuft sie binnen sechs Monaten aus, bei Anthropic binnen
30 Tagen.“ Der Zustimmungstext in `lib/fragen.js` ändert sich dadurch nicht.

**A2. Die Moderation kann nicht löschen.** „Zurückziehen“ nimmt die Seite weg, der Text bleibt in `questions`, `answers` und
`citations` (`lib/store.js:138`). Wer einen Namen aus einer veröffentlichten Frage herausredigiert, legt den alten Wortlaut
in `revisions.vorher` ab, dauerhaft und sichtbar unter „Verlauf“ (`lib/store.js:129`). `public.db` läuft ohne `secure_delete`.
Heute hieße Löschen: SQL von Hand auf dem VPS. Gelesen.
_Abhilfe:_ eine Aktion „Endgültig löschen“ (Frage, Antworten, Zitate, Verlauf, Vorschlag, Stimmen, Seite) und „Verlauf
bereinigen“ für eine Redaktion, dazu `secure_delete` und ein Checkpoint wie in `lib/pending.js`.

**A3. Ein Satz verspricht mehr, als der Checker kann.** „Enthält die Frage etwas, das nach Namen oder Gesundheit aussieht, geht
sie trotz Einwilligung nicht an Anthropic“ (`datenschutz-fragen.md:25`). Die weichen Regeln kennen Anrede, Grußformel,
Vorstellung und vier Wortstämme (`lib/checker.js:14`). „Max Mustermann aus meiner Übungsgruppe meint …“ und „… hat ADHS“
schlagen nicht an und gehen mit Einwilligung sofort hinaus. Nachgestellt (`render.mjs`). Die Nutzungsbedingungen sagen es ehrlich
(„Verlassen können Sie sich darauf nicht“), dieser Satz nicht.
_Abhilfe:_ den Satz auf das kürzen, was die Technik tut, etwa „Erkennt der Checker eine Anrede mit Namen, eine Grußformel oder
bestimmte Wörter zu Gesundheit, …“.

**A4. Kein Knopf an der Frage.** Der Plan sieht eine Warteschlange „Meldungen“ vor (§9), gebaut ist sie nicht.
_Abhilfe in zwei Stufen:_ erst ein Link „Melden“ an Frage und Antwort, der auf `impressum/#inhalte-melden` zeigt, ohne neue
Technik. Dann ein echter Knopf: `POST api/meldung` mit Kennung und einem Grund aus fester Liste, ohne Freitext, also ohne neue
personenbezogene Daten; die Moderation sieht die Markierung. Das ist ein neuer Schreibweg ohne Token und braucht eine Bremse und
einen Satz im Datenschutz. Für Löschwünsche bleibt die Mail der Weg, nur dort kann Konrad antworten.

**A5. Widerspruchsrecht.** Fragen und Stimmen stützen sich auf Art. 6 Abs. 1 lit. f. Art. 21 Abs. 4 verlangt den Hinweis auf
den Widerspruch ausdrücklich und getrennt von anderen Informationen; hier steht er in der Sammelnennung „Art. 15–21“. Für
Konrads eigene Prüfung.

### B. Geld

**B1. Der zweite Deckel fehlt.** I6 verspricht Budgetzähler plus Ausgabenlimit des Workspace. Auf dem VPS liegt vorerst der Key
vom Laptop, ohne eigenes Limit (`.claude/TODO.md`, „Key für den VPS“). Solange das so ist, begrenzt nur das Kostenbuch, und das
hat das Loch aus B2. _Abhilfe:_ eigener Workspace, eigener Key, Monatslimit in der Console, jetzt statt nach der Alpha.

**B2. Das Kostenbuch sieht nur Antworten.** Gebucht wird nach der Rückkehr des Aufrufs (`lib/draft.js:26`). Der Client hat
`timeout: 120_000` und `maxRetries: 2` (`server/worker.mjs:23`), das SDK wiederholt auch Timeouts. Eine Anfrage, die länger als
zwei Minuten braucht, geht also bis zu dreimal hinaus, steht nirgends im Buch und zählt nicht gegen die 50 am Tag. Mit dem
Stub nachgestellt (`meine.mjs`): Ergebnis `fehler`, null Einträge. Lange Ausgaben sind mit 8000 Tokens und Denken erreichbar,
eine Frage kann darum bitten.
_Abhilfe:_ vor dem Aufruf den schlimmsten Fall buchen und nach der Antwort durch den echten Wert ersetzen; `maxRetries: 0`
oder jeden Versuch einzeln zählen.

**B3. Der Worker wird nach 15 Minuten abgeschossen.** `TimeoutStartSec=15min` gilt bei `Type=oneshot` für den ganzen Lauf, und
`runJobs` arbeitet, bis die Schlange leer ist (`lib/draft.js:38`). Stellt ein Hörsaal in einer Viertelstunde 20 Fragen mit
Einwilligung, endet der Lauf mitten in einer Anfrage: Sie ist bezahlt, nicht gebucht, und läuft beim nächsten Start noch einmal.
Die Unit steht dann auf `failed`, der Watchdog meldet es. Gelesen, nicht nachgestellt.
_Abhilfe:_ der Worker hört nach einer festen Zahl Aufträge oder zehn Minuten sauber auf, die `.path`-Unit startet ihn wieder.

**B4. Mit Kurscode ist der Monat in ein bis zwei Tagen leer.** Der Plan rechnet mit 4 $ am Tag (8 ct je Anfrage). Wer erst
`kein_beleg` auslöst und dann eine lange Antwort, kommt auf bis zu rund 25 ct je Anfrage, bei 50 am Tag also über 10 $. Mehr als
15 $ im Monat werden es nicht, aber danach gibt es bis zum Monatsende für niemanden einen Entwurf und nach einer Freigabe
keine Antwort. Gelesen und gerechnet.
_Abhilfe:_ ein Tagesdeckel in Dollar, und ein eigener Anteil für freigegebene Fragen, den Entwürfe vor der Freigabe nicht
anfassen.

### C. Erreichbarkeit

**C1. Die Bremsen lassen sich überlaufen.** Beide prüfen erst, warten dann auf scrypt und zählen danach (`lib/api.js:31–37`,
`lib/mod.js:65–72`). 300 gleichzeitige Fehlversuche von einer Adresse werden alle 300 geprüft, erlaubt wären 10 und 60 beim
Kurscode, 5 und 30 bei der Anmeldung. Nachgestellt (`race.mjs`). Raten geht damit so schnell, wie scrypt rechnet, auf dem Laptop
rund 50 Versuche je Sekunde. Gegen eine lange Passphrase ist das harmlos, gegen einen kurzen Kurscode nicht.
_Abhilfe:_ den Versuch vor dem `await` zählen und bei Erfolg wieder streichen. Dazu ein Test mit `Promise.all`, den gibt es nicht.

**C2. Die Gesamtgrenzen sind ein Schalter für Fremde.** 30 falsche Anmeldungen in 15 Minuten sperren die Anmeldung für alle,
auch für die richtige Passphrase von einer anderen Adresse. Nachgestellt (`race.mjs`). Zwei Anfragen in der Minute halten die
Moderation dauerhaft draußen, sobald die Sitzung endet, und ein Neustart beendet sie (jeder `deploy-app.sh`). Für den Kurscode
gilt dasselbe mit 60: Dann bekommt niemand ein neues Token.
_Abhilfe:_ `/eidl/mod/` in Caddy hinter eine zweite Schranke legen (Client-Zertifikat oder VPN), dann erreicht kein Fremder die
Anmeldung. Das hilft zugleich gegen C1 und D1.

**C3. `api/meine` kostet nichts und bremst nichts.** Ohne Token, ohne Limit: 1,6 kB hinein, 148 kB heraus, 12 ms Rechenzeit auf
dem Laptop, weil jede der 50 Kennungen eine öffentliche Frage samt Zitaten und Vektor lädt und setzt (`lib/api.js:70–84`).
Nachgestellt (`meine.mjs`). Unter hundert Anfragen je Sekunde stehen Fragepfad und Moderation; Lesen läuft weiter.
_Abhilfe:_ Bremse je Adresse, Liste auf 20 kürzen, für öffentliche Fragen nur die Adresse liefern.

**C4. Jede Grenze je Adresse gilt für eine einzelne IPv6-Adresse.** Der Host hat einen `AAAA`-Eintrag, `clientOf` nimmt die
volle Adresse (`lib/http.js:4`). Ein gewöhnlicher Anschluss hat ein /64. Damit sind 20 Fragen, 30 Tokens und 200 Stimmen je
Stunde keine Grenze; es bleiben 100 offene Fragen und 5000 Stimmen insgesamt. Die 100 Plätze füllt eine Person in Minuten, und
ablehnen kann die Moderation nur einzeln. _Abhilfe:_ IPv6 auf /64 kürzen; „alle ablehnen“ für die Warteschlange.

**C5. Rohe Last.** Caddy hat kein Ratenlimit, davor steht kein CDN. Statische Seiten sind billig, aber der VPS trägt noch
andere Sites. Der Web-Prozess hat 256 MB; läuft er voll, startet er neu, und damit sind Sitzungen und alle Zähler der Bremsen
weg. Gelesen. _Abhilfe:_ hingenommen oder ein Limit in Caddy für `/eidl/api/*` und `/eidl/mod/*`, das ist Sache des Server-Repos.

### D. Vertraulichkeit und Inhalt

**D1. Das Moderationskonto ist der Hauptschlüssel.** Ein Faktor, die Anmeldeseite steht offen im Netz. Wer es hat, liest alle
Fragen vor der Freigabe, veröffentlicht beliebigen Text und löst „noch einmal fragen“ aus. _Abhilfe:_ wie C2.

**D2. Der Bot kann Links setzen.** Antworten sind Markdown, `[Musterlösung](https://…)` wird ein Link, ein Bild wird ein
`<img>` (das die CSP nicht lädt). Nachgestellt (`render.mjs`). Ohne Einwilligung entsteht die Antwort nach der Freigabe und steht
dann ungeprüft öffentlich (`lib/fragen.js:124`). Eine freigegebene Frage, die den Bot zu einem Link überredet, reicht.
_Abhilfe:_ in Bot-Antworten Links und Bilder abschalten oder nur die Adresse des Skripts zulassen.

**D3. Formeln ohne Größengrenze.** `$\rule{4000em}{4000em}$` wird eine Fläche von 4000 em, auch in der Themenliste. Die
Moderation sieht nur den Quelltext. Nachgestellt (`render.mjs`). _Abhilfe:_ `maxSize` in den KaTeX-Optionen (`lib/render.js:21`).

**D4. Der Worker glaubt der Schlange.** Die Kennung wird Dateiname (`lib/spool.js:13`), die Länge des Textes prüft er nicht.
Das zählt nur, wenn der Web-Prozess schon übernommen ist; dann aber reicht es bis ins Kostenbuch und zu Anfragen für mehrere
Dollar. Gelesen. _Abhilfe:_ Kennung per Muster, Text mit Obergrenze, beides im Worker.

## 5. Bewusst hingenommen

Steht so im Plan oder in `SECURITY.md` und bleibt richtig: Alle teilen einen Kurscode. Stimmen lassen sich fälschen. Namen fängt
keine Regel. Ein Widerruf holt nichts von Anthropic zurück. Ohne Zugriffsprotokoll gibt es nach einem Angriff keine Adressen,
nur die Zähler unter `/eidl/mod/zahlen/`. Das Token läuft nicht ab, bis der Code wechselt.

## 6. Notbremsen, die es schon gibt

| Lage | Hebel |
|---|---|
| Kosten laufen | Key in der Console sperren; `systemctl stop hainrich2-worker.path` |
| Fragepfad wird missbraucht | `hainrich2_kurscode_hash` leeren und ausrollen, dann antwortet `closedApi` |
| Code ist herum | neuen Code setzen, alle Tokens verfallen |
| Stimmen werden geflutet | `hainrich2_stimmen: false` |
| Etwas steht öffentlich, das nicht soll | „Zurückziehen“, danach von Hand löschen (A2) |

## 7. Nicht geprüft

SSH, Firewall und Updates des VPS, die anderen Sites darauf, das Fastmail-Postfach hinter der Kontaktadresse, der Laptop als
Quelle jedes Deploys, die Sicherungen bei restic, das Verhalten unter echter Last, und ob eine Frage das Modell tatsächlich zu
einer langen Antwort oder einem Link bringt: Das kostet Geld und braucht Konrads Okay.

## 8. Nachtrag: was am selben Tag behoben ist

Konrad hat „Kosten und Bremsen“ freigegeben (Plan D26) und am selben Tag selbst ausgespielt (`site/deploy-app.sh`). Danach war der Smoke-Test gegen den Host
grün. Am Host ausgelöst habe ich keine Bremse, und einen echten Auftrag hat der Worker mit dem neuen Kostenbuch noch nicht bearbeitet:

| Befund | Was jetzt gilt | Beleg |
|---|---|---|
| C1 | Der Versuch zählt, bevor scrypt rechnet, und wird bei Erfolg gestrichen. Abstimmen liest erst und prüft und zählt dann in einem Zug. | `race.mjs` nach der Änderung: von 300 gleichzeitigen Versuchen werden 10 geprüft (Kurscode) und 5 (Anmeldung), der Rest bekommt 429. Die richtige Passphrase von einer anderen Adresse kommt danach durch. |
| C4 | `clientOf` liefert bei IPv6 das /64. | Test „Adressen aus demselben /64 teilen sich die Grenze“. |
| C3 | 600 Anfragen in der Minute je Adresse für `meine` und `loeschen`; öffentliche Fragen kommen mit einer Abfrage statt mit Antworten, Zitaten und Vektor. | Test mit 605 Anfragen. Die Rechenzeit je Anfrage ist dadurch nicht messbar gesunken, sie steckt im Setzen der Formeln; begrenzt ist jetzt die Zahl. |
| B2 | Jede Anfrage steht mit 60 ct im Buch, bevor sie hinausgeht. Eine Antwort ersetzt die Buchung, eine Absage mit Status streicht sie, ein Abbruch lässt sie stehen. `maxRetries: 0`, bei Überlast wiederholt der Worker selbst bis zu zweimal. | `meine.mjs` nach der Änderung: ein Eintrag im Buch, gezählt für den Tag. `/eidl/mod/zahlen/` nennt Buchungen ohne Antwort eigens. |
| B3 | Nach acht Minuten fängt der Worker keinen Auftrag mehr an. Stirbt er trotzdem, steht die laufende Anfrage schon im Buch. | Test „nach der Frist …“. Am Host nie gesehen. |

Als Gegenprobe liefen die neuen Tests gegen den alten Code: Die Tests zu Anmeldung, Kostenbuch und Worker scheitern dort an ihren
Zusicherungen, die zum Kurscode schon am fehlenden Export; für den Kurscode ist `race.mjs` vorher und nachher der Beleg.

Was das kostet: Ein Timeout bucht 60 ct, auch wenn Anthropic weniger oder nichts berechnet. Bei einer Störung dort kann das Buch den
Monat auf dem Papier leeren; dann zeigt die Admin-Seite, wie viel davon ohne Antwort gebucht ist, und die Einträge mit `offen` lassen
sich nach einem Blick in die Console aus `kosten-<monat>.json` nehmen. Angenommen ist, dass eine Absage mit Status nichts kostet.
Und wer zehn Codes gleichzeitig von einer Adresse prüfen lässt, belegt für die Dauer der Prüfung alle zehn Plätze, auch mit dem
richtigen Code: Der elfte gleichzeitige wartet.

**A2, Plan D27, gebaut, getestet und am 2026-11-11 von Konrad ausgespielt:** Unter jeder Frage steht für die Rolle admin ein Abschnitt „Löschen“ mit einem Haken und zwei Knöpfen.
„Frage und Antwort endgültig löschen“ nimmt Frage, Antworten, Zitate, Verlauf, Vorschlag, Stimmen und die Seite weg und einen wartenden Auftrag aus der Schlange.
„Alte Fassungen aus dem Verlauf entfernen“ leert nach einer Redaktion die Texte im Verlauf; wer wann was geändert hat, bleibt stehen. `public.db` läuft mit
`secure_delete`, und `VACUUM` baut die Datei nach jedem Löschen neu. Die Tests lesen dazu Datenbank, WAL und alle veröffentlichten Dateien roh und suchen die
gelöschte Zeichenfolge. Gegenprobe: ohne `VACUUM` scheitert der Test auf Reste aus der Zeit vor `secure_delete`, ohne beides scheitern drei.

Was das Löschen nicht erreicht: die Sicherungen (sechs Monate), Anthropic (30 Tage), Kopien bei Dritten, und den Vektor einer redigierten Frage. Der ist
weiter aus dem alten Wortlaut gerechnet und steht in `daten/fragen.json`; wer das nicht will, löscht die Frage ganz und stellt sie neu ein.

**A1, als Entwurf, nicht freigegeben und nicht live:** ein Absatz „Löschen nach der Freigabe“ in `site/texte/datenschutz-fragen.md` und ein Satz unter „Ihre
Rechte“ in `site/texte/datenschutz.md`. Der Wortlaut weicht vom Vorschlag oben ab: Er sagt „entfernt die Angabe aus dem Text oder löscht die ganze Frage“, weil
beides vorkommt, und verweist für Anthropic auf die Fristen im nächsten Abschnitt, statt eine Zahl zu wiederholen.

**A1** ist seit dem 2026-11-11 freigegeben und live, der Absatz darüber gibt den Stand vor der Freigabe wieder.

**A3, A4 (Stufe 1), D2, D3 und D4, Plan D28, gebaut, getestet und am 2026-11-17 ausgespielt.** A3: Der Satz in
`site/texte/datenschutz-fragen.md` nennt jetzt, was der Checker erkennt (Anrede mit Namen, Vorstellung, Grußformel, Wörter zu
Gesundheit), und sagt, dass man sich auf ihn nicht verlassen kann. A4: An Frage und Antwort steht ein Link „Melden“ auf
`impressum/#inhalte-melden`; den eigenen Schreibweg (Stufe 2) gibt es nicht. D2: Eine Antwort des Bots, die niemand geprüft hat, und
jeder Entwurf verlinken nur noch ins Skript, ein Bild wird sein Ersatztext; nach der Prüfung bleiben Links stehen, dann hat sie ein
Mensch gesehen. D3: `maxSize` begrenzt jede Länge in einer Formel auf 20 em, in Antworten, Fragen und Listen. D4: Der Worker verwirft
einen Auftrag ohne gültige Kennung und beendet einen mit fehlendem oder zu langem Text als Fehler, beides ohne Anfrage; `lib/spool.js`
legt unter keiner anderen Kennung eine Datei an.

Offen blieben danach A4 Stufe 2, A5, B1, B4, C2, C5 und D1.

**Konrads Entscheidungen vom Abend des 2026-11-17 dazu (Plan D41 bis D44). Gebaut, getestet und am selben Abend um 23:04 ausgespielt (Commit `06fe244`):**

| Befund | Entscheidung | Was gebaut ist |
|---|---|---|
| C2 | Ein Gerät, das sich schon einmal richtig angemeldet hat, soll nicht ausgesperrt werden können. Mehr nicht jetzt. | Geräte-Cookie nach gelungener Anmeldung, 180 Tage, signiert mit einem Schlüssel aus dem Hash der Passphrase. Ein Gerät damit zählt gegen seine eigene Grenze (fünf in 15 Minuten) statt gegen die für alle. Tests: Nach 30 fremden Fehlversuchen kommt das bekannte Gerät mit der richtigen Passphrase hinein, ein fremdes und ein gefälschtes Cookie nicht; von 40 gleichzeitigen Fehlversuchen mit Cookie werden fünf geprüft, und keiner zählt gegen die Grenze für alle. |
| A4, Stufe 2 | Kein eigener Schreibweg, nur eine vorformulierte E-Mail, wie im Schwesterprojekt. | „Melden“ ist ein `mailto:` mit Betreff, Adresse des Beitrags und einer Liste von Gründen. Kein Request, kein Skript. |
| A5 | Umsetzen. | Eigener Abschnitt „Widerspruchsrecht“ im Datenschutz, Verweise aus jedem Abschnitt mit Art. 6 Abs. 1 lit. f und am Frageformular, Stolperdraht im Bau. |
| B1 | Verschoben, frühestens Februar bis April 2027. | nichts |
| B4 | Hingenommen; beobachten, dann Grenzen anpassen oder ein billigeres Modell. | nichts |
| C5 | Hingenommen; `CPUQuota` an der Unit im Server-Repo. | an die Sitzung dort gemeldet |
| D1 | Bleibt. | nichts |

Was für C2 weiter gilt: Für ein Gerät **ohne** das Cookie ist die Grenze für alle ein gleitendes Fenster von 15 Minuten. 30 falsche
Versuche sperren unbekannte Geräte so lange aus, bis der älteste aus dem Fenster fällt, und wer zwei Versuche in der Minute nachlegt,
hält es geschlossen. Die Sperre dauert also nicht Sekunden und wächst nicht; sie trifft nur noch, wer sich von einem neuen Gerät
anmelden will oder die Browserdaten gelöscht hat. Ein gestohlenes Geräte-Cookie gibt fünf Versuche je Viertelstunde an der Grenze
für alle vorbei, keinen Zugang.

Am Host nach dem Ausspielen: Die Anmeldung gelingt in Konrads Browser, „Melden“ ist auf jeder Frageseite eine vorbereitete E-Mail,
und der Datenschutz trägt die neuen Abschnitte. Das Geräte-Cookie selbst habe ich dort nicht gesehen (`HttpOnly`), und eine Sperre
habe ich am Host nicht ausgelöst.

**Konrads Entscheidung vom 2026-11-18 zu C2 und D1 (Plan D50): eine zweite Schranke vor `/eidl/mod/`.** Gebaut im Server-Repo (Rolle
`hainrich2`), dort in einer VM geprobt und am selben Tag ausgespielt. Der Webserver verlangt für `/eidl/mod` und alles darunter
Basic Auth, bevor eine Anfrage die App erreicht; `/eidl/api/` bleibt offen. Die Anmeldung der App mit Passphrase, Sitzungs- und
Geräte-Cookie bleibt dahinter bestehen, und das Passwort der Schranke reicht der Webserver nicht an die App weiter. Ein Rechtstext
ändert sich nicht: Basic Auth setzt kein Cookie.

| Befund | Was jetzt gilt |
|---|---|
| C2 | Ohne den Zugang der Schranke erreicht niemand die Anmeldung der Moderation, also auch nicht ihre Grenze für alle. Für den Kurscode gilt C2 weiter: 60 falsche Versuche in der Minute, dann bekommt niemand ein neues Token. |
| D1 | Vor der Passphrase steht ein zweites Geheimnis. Beides sind Geheimnisse; ein zweiter Faktor im strengen Sinn ist das nicht. |

Von außen gemessen am 2026-11-18, nur mit `GET` und ohne Zugangsdaten: 401 mit `WWW-Authenticate` für `/eidl/mod/`, `/eidl/mod`,
`/eidl/mod/zahlen/` und `/eidl/mod/tasten.js`, auch in anderer Schreibweise des Pfads. `/eidl/api/token` und `/eidl/api/stimme`
antworten auf `GET` mit 405 von der App, ohne `WWW-Authenticate`; Startseite, eine Frageseite, das Frageformular und der Datenschutz
mit 200. Der Smoke-Test gegen den Host: 22 von 22. Den Weg mit Zugangsdaten habe ich nicht geprüft, ich kenne sie nicht; ihn hat die
Sitzung im Server-Repo in der VM gemessen, ebenso `POST` auf den Fragepfad. Ob eine abgewiesene Anfrage eine Zeile mit Adresse ins
Journal schreibt, prüft Konrad am Host; in der VM schrieb sie keine. `site/serve.mjs` ahmt die Schranke nicht nach, die Browser-Tests
der Moderation laufen ohne sie.

Offen bleiben danach B1 (verschoben) und B4 (hingenommen); C5 ist hingenommen.
