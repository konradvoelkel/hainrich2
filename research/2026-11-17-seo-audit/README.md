# SEO-Audit von hai.konradvoelkel.com/eidl/, dritter Durchgang

_Stand 2026-11-17, gemessen am ausgespielten Stand `d977182`, gegen 18 Uhr. Skripte: `crawl.py` (wie am 16.11., dazu das rohe HTML je
Seite und die Kopfzeilen der eingebundenen Dateien), `auswertung.py` (Auszählung und Vergleich mit dem Crawl vom 16.11.), `perf.mjs`
(Ladezeiten, erste Suche, Bildschirmfotos), `wiederbesuch.mjs` und `auszug.py` (steht die Frage im extrahierten Text). Sechs Fachprüfungen liefen als Subagenten auf dem lokalen Crawl,
ihre Berichte liegen in `findings/`. Rohdaten und Bilder liegen außerhalb des Repos unter `work/seo-audit-2026-11-17/`._

**Ergebnis:** Die Site ist weiter gewollt unsichtbar: `noindex` auf allen 99 Seiten, leere Sitemap. Die Startbereitschaft liegt bei
**84 von 100** (16.11.: 79, 06.11.: 68). Das ist eine Einschätzung, keine Messung. Von den 17 Befunden des 16.11. sind 13 erledigt
oder entschieden. Was heute bremst, ist kaum noch Gerüst, sondern Inhalt unter dem neuen Prüfvermerk: Zehn geprüfte Antworten zitieren
Wortlaut, den das Skript nicht mehr hat, zwei sagen im ersten Satz ab, was ihr Titel verspricht, und ein Textextraktor findet auf
30 von 31 Frageseiten die Frage nicht.

**Grenzen:** Keine Daten von Google, keine Rankings, kein Suchvolumen, keine Backlinks, keine Felddaten. Der unverlinkte Name ging in
keinen fremden Dienst: kein PageSpeed, kein Rich-Results-Test, kein Online-Validator, keine Marken- oder Backlink-Abfrage. Googles
aktuelle Dokumentation hat niemand nachgeschlagen; was dazu hier steht, ist Erfahrungswissen. Lighthouse ist nicht installiert und
wurde nicht geladen. Die Moderation hinter der Anmeldung ist nicht Teil des Crawls. Ladezeiten stammen aus je einem Lauf in Chromium,
kein echtes Telefon.

## 1. Punkte je Bereich

| Bereich | Gewicht | 06.11. | 16.11. | heute | Grund |
|---|---:|---:|---:|---:|---|
| Technik | 22 % | 85 | 86 | 90 | Regeln für Index und Sitemap decken sich, der Schalter für die Vorschau ist da, Cache-Kopfzeilen sitzen. Offen: `lastmod`. |
| Inhalt | 23 % | 75 | 74 | 77 | Prüfer mit Name, Rolle und Datum an jeder Antwort. Dagegen: zehn veraltete Zitate unter „geprüft“, Absagen im ersten Satz. |
| Auf der Seite | 20 % | 55 | 76 | 84 | Kein Titel endet mehr auf „…“, jede Frage verlinkt ihr Kapitel. Offen: elf schwache Beschreibungen, der Kapitellink führt meist im Kreis. |
| Strukturierte Daten | 10 % | 15 | 70 | 86 | `QAPage` an allen 31 Frageseiten, 31 von 31 stimmen mit dem Sichtbaren überein. Kleine Makel. |
| Leistung | 10 % | 95 | 93 | 96 | LCP 0,58 bis 0,68 s gedrosselt, CLS 0. Die Frageseite ist leichter, ein Wiederbesuch kostet rund 1 KB. |
| KI-Suche | 10 % | 60 | 68 | 70 | Herkunft und Lizenz gut lesbar. Die Frage fehlt weiter im extrahierten Text. |
| Bilder | 5 % | 85 | 92 | 92 | Unverändert: Logo und ein Foto, Maße gesetzt. |

## 2. Was aus den Befunden vom 16.11. geworden ist

| Befund vom 16.11. | Heute | Beleg |
|---|---|---|
| 1 Frageseite führt nirgends weiter | behoben, mit Rest | 31 von 31 verlinken Kapitel und Unterforum (Crawl). Rest: Befund 4 unten. |
| 2 „geprüft“ ohne wer und wann | behoben | 30 Antworten mit „Geprüft am … von Konrad Völkel, Autor des Skripts“ und `<time>`; die 31. ist eine Antwort der Moderation. |
| 3 Kapitelseiten dünn im Index | behoben | Schwelle drei geprüfte Fragen. Gezählt: 25 Kapitel mit einer Frage, 3 mit zwei, eins ohne. Beim Start wäre keine indexierbar. |
| 4 Zweiter Schalter fehlt | behoben | Schalter unter `/mod/zahlen/`, Test über beide Zustände. Am Host hat ihn niemand umgelegt. |
| 5 Trainings-Crawler | entschieden | Nicht aussperren (Konrad, 17.11.). `robots.txt` unverändert. |
| 6 Veraltete Zitate | offen, anders | Drei Adressen sind von selbst umgezogen. Die Moderation listet zehn Antworten, deren Wortlaut im Skript fehlt: Befund 1 unten. |
| 7 Titel enden auf „…“ | behoben | 0 von 31. Kurztitel mit 24 bis 52 Zeichen. Rest: Befund 6 unten. |
| 8 Beschädigte Beschreibungen | teils | Das Listenzeichen ist weg. Vier tragen weiter „…“ an der Stelle einer Formel: Befund 5 unten. |
| 9 Frageformular erklärt sich nicht | behoben | Satz mit Kurscode und Link auf den Datenschutz steht im HTML. |
| 10 Zitate überwiegen auf dem Telefon | behoben | s09 bei 412 px: 3502 px hoch (16.11.: 7760 bei 360 px), Zitate 35 % der Höhe. 133 von 134 Zitaten sind eingeklappt. |
| 11 bis 13 Suche, Fokus, breite Formeln | behoben | Aus dem Quelltext gelesen, im Browser-Test der Moderation belegt. |
| 14 Frage fehlt im extrahierten Text | **offen** | trafilatura 2.3.1 auf dem lokalen HTML: Frage in 1 von 31 Auszügen. Der Umbau vom 16.11. hat nichts bewirkt: Befund 2 unten. |
| 15 Mischfall bei der Indexierung | behoben | Indexierbar nur, wenn jede Antwort geprüft ist. |
| 16 `QAPage` | gebaut | 31 Blöcke, alle parsen. |
| 17 Betreiber und Lizenz | behoben | Fuß nennt den Betreiber, Zitate Autor und CC BY-SA 4.0, Fragen CC0, Antworten CC BY-SA 4.0. |
| niedrig: `cache-control` | behoben | Schrift, Logo und Icons einen Tag; CSS, Skripte und Seiten `no-cache` mit ETag. |
| niedrig: 404 mit Canonical, Tippziele, Sprunglink, Namen der Beiträge | behoben | Crawl und Stylesheet. |
| niedrig: Stimmenzähler für Vorleseprogramme, Mischung aus 301 und 308, `/eidl/index.html` | offen | wie am 16.11., alle drei harmlos. |
| niedrig: „Beispielfrage“ gegen die Über-Seite, Testfrage ohne Quelle | offen | Befund 8 unten. |

## 3. Befunde

### Gewollt, kein Fehler

**0. Alles ist `noindex`, die Sitemap ist leer.** Am Tag nach dem Ende der Vorschau wären 37 Adressen indexierbar und in der
Sitemap: Start, Über, 4 Unterforen und 31 Fragen. Seitenregeln und Sitemap decken sich (Quelltext und `test/vorschau.test.mjs`).

### Hoch: vor dem Ende der Vorschau

**1. Zehn geprüfte Antworten belegen mit Wortlaut, den das Skript nicht mehr hat.** s17, s18, s19, s20, s21, s22, s24, s26, s27 und
`0cfd2b864eda` (Liste der Moderation vom 17.11., hinter der Anmeldung gelesen; am Crawl nicht nachprüfbar). Jede trägt jetzt
„Geprüft am … von Konrad Völkel, Autor des Skripts“. Der Vermerk macht das Versprechen stärker und den Schaden größer: Wer auf [n]
klickt, findet im Skript einen anderen Text, unter dem Namen des Autors. Das ist ein Drittel der Fragen.
_Tun:_ die zehn neu belegen und neu prüfen („Claude noch einmal fragen“, je Frage Konrads Klick und Geld). _Zu entscheiden:_ ob eine
Frageseite mit veraltetem Zitat bis dahin `noindex` bleibt. _Woran man es sieht:_ Die Moderation listet null.

**2. Die Frage fehlt im extrahierten Text.** Nachgeprüft mit trafilatura 2.3.1 auf dem lokalen HTML: Der Auszug enthält die Frage bei
1 von 31 Seiten (s10), den Prüfvermerk bei 10. Ohne Frage ist „Ja, genau so ist es.“ für eine Antwortmaschine wertlos. Die Prüfung der
KI-Suche hat fünf Umbauten an Kopien ausprobiert; nur einer hilft: `div.faden` wird `<article>`, und die H1 steht als erstes Kind der
Fragekarte, vor `aside` und `header` (`lib/site.js`, `questionPage`). Dann steht die Frage in 27 von 29 Auszügen und der Prüfvermerk in
29. Diesen Umbau habe ich nicht selbst nachgestellt, und andere Extraktoren hat niemand geprüft.
_Woran man es sieht:_ dieselbe Zählung über `seiten/` nach dem Umbau.

**3. Zwei Antworten sagen im ersten Satz ab, was ihr Titel verspricht, und eine führt in die Irre.**
- s29, Titel „SGD oder Adam: Was generalisiert besser, und warum?“. Erster Satz und Beschreibung: „Die Skriptpassagen vergleichen SGD und
  Adam nicht hinsichtlich der Generalisierung. Woran ein solcher Unterschied liegen könnte, bleibt daher offen.“
- s20, Titel „word2vec auf Audio: Was sind Wörter und Kontext?“. Erster Satz: „Eine word2vec-Variante für Audio behandelt das Skript nicht.“
- s06, erster Satz: „… schreibt man dafür device=-1; device=0 meint dort die erste GPU.“ Im Skript meint „dafür“ die CPU, in der
  Antwort liest es sich als Weg zur GPU. Erst der zweite Satz stellt es richtig, die Beschreibung nicht.

Für eine Suchanfrage ist das die schlechteste Folge: Treffer, Klick, Absage. _Tun:_ s29 und s20 beantwortet die Moderation selbst, oder
sie bleiben `noindex`; bei s06 den ersten Satz umstellen. Das ist Konrads Text.

**4. „Alle Fragen zu …“ führt bei 25 von 31 Fragen auf eine Liste mit nur dieser Frage.** Der Link ist für jemanden aus der Suche der
einzige Weg zu „mehr davon“, und er führt im Kreis; mehr Fragen gibt es erst im Unterforum. _Tun:_ Hat das Kapitel nur diese Frage,
entfällt der Kapitellink unter der Antwort; das Unterforum kommt zuerst und mit Zahl („10 Fragen in Lernen und Training“), dazu ein Link
„Kapitel im Skript lesen“. Eine Liste einzelner Nachbarfragen gibt es mit Absicht nicht (sie stünde nach jeder Änderung auf den
Nachbarseiten falsch). _Woran man es sieht:_ Im Crawl verlinkt keine Frageseite eine Kapitelseite, die nur sie selbst listet.

### Mittel

**5. Elf Beschreibungen sind schwach.** Sieben sind kürzer als 70 Zeichen (s01, s15, s19, s20, s25, s27, s28), vier tragen „…“ an der
Stelle einer Formel (s03, s12 „Es gilt ….“, s21, s23, wo die Formel die Antwort ist). Die Ursache ist die Regel in
`questionDescription`: Sie nimmt nur ganze Sätze bis zur ersten Auslassung und zählt auch die Kürzung am Ende als Auslassung. Dazu
fehlen `formulaText` einige Befehle (`\colon`, `\circ`, `\bigl`, `\top`, `\frac`, `\lfloor`). _Tun:_ Schwelle anheben, den nächsten Satz
anhängen, die Befehle ergänzen. _Woran man es sieht:_ `auswertung.py` meldet keine Beschreibung unter 70 und keine mit „…“ vor dem Ende.

**6. Acht Kurztitel sind schwach.** Am deutlichsten s27 („Woher kommen die Labels?“, ohne Thema) und die beiden von Hand geschriebenen:
`0cfd2b864eda` („Nichtlineare Inputs auch okay?“) und `bf8ec38f9c86` („Ist Keras Tensorflow besser als PyTorch?“; die Frage fragt nach
„einfacher“). Dazu s19 (der Titel fragt „Warum summieren?“, die Antwort nennt den Mittelwert), s02, s26, s07 und s05. Vorschläge mit
höchstens 53 Zeichen stehen in `findings/inhalt.md`, M1. Die übrigen 21 tragen das Fachwort vorn und halten, was sie sagen.

**7. Etwa die Hälfte der Antworten beginnt mit der Antwort.** Zwei Zählungen mit verschiedenem Maß: 19 von 31 beantworten die Frage
direkt am Anfang (Inhaltsprüfung), bei 14 von 29 stimmt der erste Satz für sich allein, ohne die Frage (KI-Suche). Bei s12 und s21
steht der Kern weiter im letzten Absatz. Dazu Reste aus dem Zusammensetzen von Zitaten: eckige Einschübe im Fließtext (s14 „[es]“ und
„[...]“, s27 „[man]“, „[werden]“, „[gefüttert]“, s28), Bezüge ins Leere (s03 „f wie oben“, s09 „unten“, s13 „diesen Graphen“) und in s22
die Zitatmarke mitten im Wort: „weiter[3]läuft“. Das fällt bei der Prüfung an, also bei Konrad.

**8. Die Über-Seite widerspricht Impressum und Frageseite.** Sie sagt „Die Fragen kommen von Studierenden“, 29 von 31 Fragen tragen
„Beispielfrage“, und das Impressum sagt seit heute „Die Beispielfragen stammen vom Betreiber“. Sie sagt „die Antworten schreibt ein
Sprachmodell“, die Startseite „die meisten“. Unter „Wer prüft“ fehlt, wofür das Skript geschrieben ist, und ein Link auf Konrads eigene
Seite. Unter jeder geprüften Antwort steht weiter „Prüfen Sie das Zitat.“, das liest sich wie Misstrauen gegen den eigenen Prüfer.

**9. `QAPage`: vier kleine Makel.** (a) In 21 von 31 Antworten steht dieselbe Adresse mehrfach unter `citation` (134 Einträge, 97
verschiedene), weil mehrere Zitate aus einem Abschnitt nach dem Abschneiden des Textfragments gleich lauten. (b) Die Prüfung steht
nur als Satz im Namen des Autors; `reviewedBy` und `lastReviewed` an der `QAPage` wären die maschinenlesbare Form. (c) An den 29
Beispielfragen nennt das Markup die Person als Autor, sichtbar steht nur „Frage“. (d) Der Test dazu prüft eine Seite, nicht alle.
Dass `Answer.text` Markdown und LaTeX im Quelltext trägt, ist Absicht; was Google damit macht, weiß hier niemand.

**10. Die Sitemap hat kein `lastmod`.** Seit heute gibt es ein Prüfdatum je Antwort. _Tun:_ das jüngste Prüfdatum der Antworten einer
Frage, nicht die Bauzeit.

**11. „Melden“ weiß nicht, welcher Beitrag gemeint ist.** Jeder Beitrag trägt denselben Link mit demselben Ziel. Ein Vorleseprogramm
hört nur „Melden“, und wer meldet, muss die Adresse selbst nennen. _Tun:_ `aria-label="Beitrag 2 melden"`. Mehr wäre Stufe 2 aus dem
Threat Model, und die ist zurückgestellt.

**12. Auf dem Telefon steht vor der Antwort viel Rahmen.** Banner, Kopf, Pfad, Fragekarte mit Abstimmung, Datum und Abzeichen, H1,
Kapitellink (zum zweiten Mal), Lizenzzeile, Antwortkopf, Abzeichen, Prüfvermerk. Bei s09 beginnt die Antwort im ersten Bildschirm
(Bildschirmfoto), bei den längeren Fragen s12 und s23 nach Schätzung der Prüfung am unteren Rand; gerendert hat das niemand. _Tun:_ die
Lizenzzeile der Frage nach unten zur Lizenz der Antworten, der Kapitellink unter der H1 entfällt, Abzeichen und Prüfvermerk in eine Zeile.

### Niedrig

- **Umleitungen:** `/eidl/index.html` antwortet mit 200 neben `/eidl/` (der Canonical fängt es), 301 und 308 gemischt. Server-Repo.
- **Die 404-Seite** verlinkt nur „Zum Forum“, nicht die Unterforen.
- **`ueber/`** ist nach dem Ende der Vorschau immer indexierbar, in der Sitemap aber nur, wenn es eine geprüfte Frage gibt. Folgenlos.
- **Der Pfad im JSON-LD** zeigt auf Kapitelseiten, die `noindex` bleiben, solange sie unter drei Fragen haben.
- **Stimmenzähler:** heißt weiter nur über `title="Punkte"`.
- **Eingeklapptes Zitat ohne CSS:** „ganzes Zitat“ und „einklappen“ stehen ohne Leerzeichen hintereinander; der Anriss ersetzt
  Formeln durch „…“.
- **Suche:** lädt das Modell schon beim Fokus, der Text sagt „beim ersten Klick“; ohne JavaScript fehlt sie ohne Hinweis.
- **Fokus:** `.melden`, `.nummer` und `.marke-zitat` haben keine eigene Regel für den Tastaturfokus.
- **Unterforen-Titel** wie „Grundlagen | hAInrich2“ nennen kein Thema.
- **Testfrage `bf8ec38f9c86`:** „über 80 % des Forschungscodes“ weiter ohne Quelle; für eine Suche nach Keras oder PyTorch zu dünn.
- **Rechtstexte, nur Verständlichkeit:** Dass Löschen hier Kopien anderswo nicht zurückholt, steht nirgends ausdrücklich; ob eine
  Frage einen Satz aus dem Skript zitieren darf, bleibt offen.
- **Ein Satz im Datenschutz** dazu, dass öffentliche Seiten auch von Suchmaschinen und KI-Diensten gelesen werden, fehlt.

## 4. Messwerte

| Seite | Anfragen | Übertragen | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|
| Startseite | 7 (7) | 58 KB (57) | 0,63 s (0,64) | 0 | 0 ms |
| Frage s09 | 11 (13) | 137 KB (158) | 0,68 s (0,82) | 0 | 33 ms (187) |
| Über | 6 (6) | 57 KB (56) | 0,58 s (0,58) | 0 | 0 ms |
| Unterforum | 9 (9) | 101 KB (100) | 0,60 s (0,63) | 0 | 0 ms |
| Kapitelseite | 7 (7) | 59 KB (57) | 0,60 s (0,62) | 0 | 0 ms |
| Frageformular | 8 (7) | 61 KB (59) | 0,63 s (0,62) | 0 | 0 ms |

In Klammern die Werte vom 16.11., Bedingungen wie damals: Pixel 7, 1,6 MBit/s, 150 ms Latenz, CPU vierfach gedrosselt. Die Frageseite
lädt drei Formelschriften weniger, weil die Zitate eingeklappt sind. Beim Tippen in die Suche mit Modell-Download gab es keine lange
Aufgabe.

**Wiederbesuch** (`wiederbesuch.mjs`, ungedrosselt): Startseite 0,9 KB, Frage s09 1,2 KB. Schrift, Formel-Stylesheet, Logo und Muster
kommen ohne Netz aus dem Cache; `style.css` und die Skripte fragen mit ETag nach und bekommen 304. Am 16.11. fragte jede Datei nach.

**Crawl:** 99 Seiten, alle 200, alle `noindex`, `lang="de"`, je eine H1. Canonical auf sich selbst bei den 70 echten Seiten, die 29
Varianten `f/neu/?kapitel=…` zeigen auf `f/neu/`. Kein Titel über 65 Zeichen, keiner doppelt. Keine verwaiste Seite, kein toter interner
Link; `mod/` ist verlinkt (`nofollow`) und in `robots.txt` gesperrt. 56 fremde Linkziele, davon 31 ins Skript. Sicherheitskopfzeilen
auf allen Seiten gleich.

## 5. Wo die Site in der Suche eine Chance hat

Sechs allgemeine Suchanfragen ohne den Namen der Site (wörtlich in `findings/sucherlebnis.md`). Das Bild vom 16.11. hält: Lange, genaue
Warum- und Wie-Fragen auf Deutsch sind dünn besetzt, Begriffe gehen an Lexika, Dokumentation und Videos. Die besten Aussichten haben
s23 (Ausgabegröße einer Faltung: nur englische Treffer), s14 (tote ReLU-Neuronen erkennen: die Suche fand dazu keine Quelle) und s12
(warum rückwärts), sobald der Grund oben steht. Für s29 erscheinen fast nur Forschungsarbeiten; eine Seite, die „bleibt offen“ sagt, ist
dafür der falsche Typ. Kapitelseiten bleiben Navigation. Suchvolumen ist ungemessen.

## 6. Reihenfolge

Keiner dieser Schritte wirkt in der Suche, solange die Vorschau läuft.

1. **Am Code, ohne Entscheidung:** Befund 2 (Frage im extrahierten Text), 4 (Kapitellink), 5 (Beschreibungen), 9a und 9d (`citation`
   ohne Doppelte, Test über alle Seiten), 10 (`lastmod`), 11 (`aria-label`), 12 (Rahmen auf dem Telefon). Befund 2 zuerst: Er ändert die
   Reihenfolge in der Fragekarte, 12 baut darauf auf.
2. **Konrads Text oder Klick:** Befund 1 (zehn Antworten neu belegen), 3 (s29, s20, s06), 6 (Kurztitel), 7 (Kern nach vorn, Reste), 8
   (Über-Seite).
3. **Zu entscheiden:** ob eine Frageseite mit veraltetem Zitat oder mit einer Absage im ersten Satz `noindex` bleibt (Befund 1 und 3);
   ob die Prüfung ins Markup kommt und ob an Beispielfragen sichtbar steht, von wem sie sind (9b, 9c).
4. **Nach dem Ende der Vorschau:** Search Console einrichten, nach vier Wochen ansehen, welche Fragen Eindrücke bekommen; als erstes
   Signal von außen je Kapitel ein Link aus dem Skript auf die Kapitelseite.

## 7. Wie gemessen wurde

- **Crawl:** `python3 research/2026-11-17-seo-audit/crawl.py <ausgabe.json> <verzeichnis>`, nur GET und HEAD, 99 Seiten in 25 Sekunden.
- **Auszählung:** `python3 research/2026-11-17-seo-audit/auswertung.py <crawl.json> <crawl vom 16.11.>`.
- **Ladezeiten:** `node research/2026-11-17-seo-audit/perf.mjs <bildverzeichnis>` und `node research/2026-11-17-seo-audit/wiederbesuch.mjs`.
- **Fachprüfungen:** sechs Subagenten des Plugins `claude-seo` 2.4.2 (Technik, Inhalt, strukturierte Daten, KI-Suche,
  Agenten-Tauglichkeit, Sucherlebnis), alle auf dem lokalen HTML statt am Host. Ausnahmen: Die Technik hat 17 Abrufe am Host gemacht
  (erlaubt waren 20, nur GET und HEAD, nie `api/` oder `mod/`), das Sucherlebnis sechs allgemeine Websuchen ohne Namen. Sitemap,
  Titel, Bilder, Ladezeiten und Darstellung sind ohne Subagent ausgewertet.
- **Nachgeprüft vor der Übernahme:** die Zahl der Kapitel je Fragenzahl, die doppelten `citation`-Adressen, die ersten Sätze von s29,
  s20 und s06, die Marke in s22, die eckigen Einschübe, die Auszüge mit trafilatura über alle 31 Frageseiten, der Fokus als Auslöser der
  Suche.
- **Eine Berichtigung an mir:** `auswertung.py` kappte die Liste der kurzen Beschreibungen nach acht Einträgen und suchte die
  Auslassung nur mit Leerzeichen davor und danach. Es meldete vier kurze und zwei mit Lücke; richtig sind sieben und vier. Gefunden hat
  das die Inhaltsprüfung, das Skript ist berichtigt.
- **Ein Zusammenstoß:** Zwei Fachprüfungen haben im selben Arbeitsverzeichnis eine Datei gleichen Namens geschrieben. Die Zahlen, die
  davon abhängen konnten, sind oben nachgezählt und stimmen.
- **Werkzeuge:** trafilatura 2.3.1 lag schon in der Umgebung des Plugins, installiert wurde nichts.

## 8. Nicht geprüft

- Der Umbau zu Befund 2 und die Schätzung zu Befund 12: von der Fachprüfung an Kopien probiert oder geschätzt, von mir nicht nachgestellt.
- Die zehn veralteten Zitate gegen den Korpus: übernommen aus der Liste der Moderation.
- Die fachliche Richtigkeit der Antworten über 18 ganz gelesene Seiten hinaus.
- Kontraste der neuen Elemente (aus den Farbwerten geschätzt, nicht gemessen), der Zugänglichkeitsbaum im Browser, ein Vorleseprogramm.
- Wie Google eingeklappte Inhalte, kurze Beschreibungen, Markdown in `Answer.text` und `QAPage` ohne Antworten von Lesern behandelt.
- Andere Extraktoren als trafilatura, ein echtes Telefon, Firefox und WebKit bei den Ladezeiten.

## 9. Umgesetzt am 2026-11-17

Nach dem Audit umgebaut, auf Konrads Wort („umbauen, was sich ohne Entscheidung umbauen lässt“), committet als `7ca0c6e` und am
selben Abend gegen 19 Uhr ausgespielt. Was am Host gemessen ist, steht unter der Tabelle; die Tabelle nennt die Prüfung vor dem Ausspielen.

| Befund | Stand | Wie geprüft |
|---|---|---|
| 2 Frage im extrahierten Text | Der Faden ist ein `<article>`, die H1 steht als Erstes in der Fragekarte; das Stylesheet hält die alte Ordnung fürs Auge | `auszug.py` über den lokalen Bau: vorher 1 von 29, nachher 27 von 29, bei allen 27 beginnt der Auszug mit der Frage. s09 und s11 fehlen weiter (mit `favor_recall` sind sie drin). Im Bild bei 375 px und am Desktop angesehen |
| 4 Kapitellink im Kreis | Unter der Antwort stehen „Mehr Fragen im Unterforum …“ und „Kapitel … im Skript lesen“; das Kapitel bleibt im Pfad oben | Unit-Test, Browser-Test in drei Browsern |
| 5 Beschreibungen | ganze Sätze, bis sie nicht mehr passen; unter 70 Zeichen kommt der Anfang des nächsten Satzes dazu; vor einer unlesbaren Formel ist Schluss. `formulaText` kennt Brüche, `\colon`, `\circ`, `\top`, `\lfloor`, `\bigl` | an den 31 Antworttexten vom Host gerechnet: keine unter 70, keine mit „…“ vor dem Ende, keine über 155 (vorher 7 und 4). s23 trägt jetzt die Formel. Dieselbe Funktion macht die Suchausschnitte: 42 von 466 lesen sich anders, keiner ist leer |
| 9a, 9d `QAPage` | jede Stelle des Skripts steht einmal unter `citation`; ein Browser-Test geht über alle Frageseiten | Unit-Test; der Browser-Test läuft lokal und gegen den Host |
| 10 `lastmod` | Tag der letzten Prüfung, bei Listen der jüngste ihrer Fragen; ohne Prüfdatum keiner | Unit-Test |
| 11 „Melden“ | `aria-label="Beitrag 2 melden"` | Unit-Test |
| 12 Rahmen auf dem Telefon | die Lizenz der Frage steht unten bei der Lizenz der Antworten, der zweite Kapitellink ist weg | s23 bei 375 × 812 px im lokalen Bau: Der Antworttext beginnt bei 567 px, die Formel steht ohne Scrollen da |
| niedrig | Leerzeichen zwischen „ganzes Zitat“ und „einklappen“; Unterforen heißen „Deep Learning: …“; die Fehlerseite verlinkt die Unterforen; der Stimmenzähler heißt für Vorleseprogramme „n Punkte“; die Links auf `f/neu/?kapitel=…` tragen `nofollow` | Unit-Tests, Fehlerseite im Bild |

Tests danach: `npm test` 286 von 286, `npm run smoke` 22 von 22 in Chromium, Firefox und WebKit, `npm run smoke:mod` 26 von 26 in
Chromium und Firefox, alles gegen den lokalen Bau.

**Nicht umgebaut, mit Grund:**
- **Abzeichen und Prüfvermerk in einer Zeile (aus Befund 12):** Der Vermerk steht als Absatz im Inhalt, damit ein Extraktor ihn mitnimmt;
  in der Kopfzeile ginge er dort verloren. Die Antwort beginnt auch so im ersten Bildschirm.
- **„Beim ersten Klick“ an der Suche:** Derselbe Satz steht im Datenschutz. Den ändere ich nicht ohne Konrad.
- **Eigene Fokus-Regeln** für `.melden`, `.nummer`, `.marke-zitat`: Der Rahmen des Browsers gilt dort, entfernt hat ihn niemand.
- **Befund 1, 3, 6, 7, 8** sind Konrads Text oder Klick, **9b und 9c** seine Entscheidung. Die Umleitungen gehören ins Server-Repo.

**Am Host nachgemessen, nach dem Ausspielen** (neuer Crawl, 99 Seiten, alle mit Status 200, Rohdaten unter
`work/seo-audit-2026-11-17/nach-umbau/`):

| Was | vor dem Umbau | danach |
|---|---|---|
| Frage im Auszug von trafilatura (`auszug.py`) | 1 von 31 | 28 von 31, bei allen 28 beginnt der Auszug mit der Frage |
| Prüfvermerk im Auszug | | 30 von 31 |
| Anfang der Antwort im Auszug | | 29 von 31 |
| Beschreibungen unter 70 Zeichen | 7 | 0 |
| Beschreibungen mit „…“ vor dem Ende | 4 | 0 |
| Beschreibungen über 155 Zeichen | 0 | 0 |
| `npm run smoke` gegen den Host | 21 von 21 | 22 von 22 in Chromium, Firefox und WebKit |

Bei s09, s11 und s15 fehlt die Frage weiter im Auszug; der beginnt dort mit dem Prüfvermerk. Mit `favor_recall` steht sie bei allen
dreien vorn. Den Grund kenne ich nicht: s15 ist im lokalen Bau dabei und unterscheidet sich am Host nur durch die Knöpfe zum Abstimmen
und den Kurztitel. Zwölf Beschreibungen enden auf „…“, das ist die Regel für den angefangenen nächsten Satz. Nicht gemessen sind
Ladezeiten nach dem Umbau und alles hinter dem Kurscode.

**Beim Nachsehen aufgefallen, älter als dieser Umbau:** Ein Suchausschnitt trägt „{math}“, eine Direktive aus dem Skript, die der Schnitt
des Korpus stehen lässt.

## 10. Nachtrag am späten 2026-11-17: warum s09, s11 und s15 fehlten

Gebaut, nicht ausgespielt. Ein Subagent hat die Stufen von trafilatura 2.3.1 verfolgt, ich habe das Ergebnis am lokalen Bau
nachgemessen (der zeigt seit diesem Abend die Beispielfragen so, wie sie am Server stehen).

- **Ursache:** Die eigene Extraktion von trafilatura liefert auf allen 31 Seiten die Frage vorn. Danach vergleicht es die Länge
  seines Auszugs mit dem Text der ganzen Seite (`core.py`, Stufe „recall“): unter 3000 Zeichen und unter einem Fünftel wechselt es
  das Verfahren, und der Ersatz (jusText) verwirft die kurze Überschrift. Die zwei Maße sind verschieden gereinigt: Der Auszug
  enthält nie ein `<figure>`, der Seitentext zählt sie mit, und die Zitate aus dem Skript sind `<figure>` und machen 57 bis 78 %
  dieses Texts aus. Zahlen (Auszug / Seitentext / ein Fünftel): s09 2217 / 11637 / 2327, s11 1657 / 9296 / 1859, s15 1494 / 7478 /
  1496. Bei s15 fehlten zwei Zeichen; die knappsten guten Seiten lagen nur gut 100 Zeichen darüber. Deshalb half am 17.11. jede
  kleine Änderung bei s15 und keine bei den anderen.
- **Umbau:** Die Zitate stehen in einem `<aside>` innerhalb von `section.zitate`; ein `<aside>` zählt in keinem der zwei Maße.
  Überschrift und Lizenzzeile des Abschnitts bleiben außerhalb und damit im Auszug.
- **Nebenbefund:** trafilatura streicht `<time>` samt Inhalt, im Auszug stand „Geprüft am von Konrad Völkel“. Das Prüfdatum ist jetzt
  Text; maschinenlesbar steht es als `lastReviewed` im `QAPage` (Befund 9b, zusammen mit `reviewedBy`).
- **Gemessen** am lokalen Bau mit `auszug.py`: Frage im Auszug 29 von 29, Auszug beginnt mit der Frage 29 von 29, Prüfvermerk 29 von
  29 und mit Datum. Der Subagent kam mit derselben Änderung auf Kopien der 31 Seiten vom Host auf 31 von 31. „Anfang der Antwort“ 27
  von 29 ist ein Fehler des Zählskripts: Steht unter den ersten vier Wörtern eine Formel, vergleicht es an ihr vorbei.
- **Nicht geprüft:** andere Extraktoren und Suchmaschinen; die Schwellen gelten für diese Fassung von trafilatura; am Host gemessen
  ist nichts davon.
- **Befund 9c:** Neben „Frage“ steht an einer Beispielfrage „von Konrad Völkel“. Im Abzeichen der Kopfzeile brach die Zeile bei
  375 px um (385 px Inhalt auf 307 px) und schob die Antwort eine Zeile tiefer.
