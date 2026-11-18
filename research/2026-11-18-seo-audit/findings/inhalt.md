# Inhalt, E-E-A-T, Titel und Beschreibungen

_Stand 2026-11-18, nur lokal (`seiten/`, `crawl.json`, `lib/site.js`, `site/texte/ueber.md`), kein Abruf des Hosts. Alle 29 Frageseiten:
Antworttext ganz gelesen (KaTeX als TeX), Zitate über Anriss und Quelle; trafilatura 2.3.1 selbst über alle 29 laufen lassen;
`metadata_template.py` über die 35 indexierbaren Paare. Fachliche Urteile aus eigenem Wissen, nicht an Literatur geprüft._

## 1. Gegen gestern

| Befund 17.11. | Heute | Beleg |
|---|---|---|
| H1 Zehn Antworten mit veraltetem Wortlaut | anders, größer | Acht der zehn neu erzeugt und am 17.11. geprüft, s19/s27 gelöscht. Gegen das Skript von heute sind es aber 13 (Auftrag), darunter vier der acht frischen: s17, s20, s21, s26. Befund H1. |
| H2 Titel versprechen, Antwort sagt ab; s06 irreführend | offen | s29 und s06 unverändert (Prüfdatum 05.11. bzw. 10.11.), beide indexierbar. s20 neu, hält den Titel aber weiter nicht (H2). s22 behoben: Erster Satz liefert jetzt die Begründung. |
| M1 Zehn schwache Kurztitel | offen bei 6 | s19/s27 weg, s20/s29 siehe H2. Unverändert schwach: s02, s05, s07, s26, bf8ec38f9c86, 0cfd2b864eda (Wortlaut wie gestern). |
| M2 Beschreibungen, Formellücken | großteils behoben | 0 Formellücken (s03, s12, s21, s23 lesen sich jetzt), 0 unter 70 Zeichen bei Fragen (kürzeste s01 77). Neu: Enden mitten im Gedanken, M2. |
| M3 Zitatcollage | teils | Behoben: s26 Doppelung, s22 „weiter[3]läuft“. Offen: s14 „[es]“, 2× „[...]“; s25 Doppelsatz; s03 „wie oben“; s09 „unten“; s13 „diesen Graphen“; s28 „[die benötigte Komplexität]“. Neu: M3. |
| M4 Wer prüft: Person ohne Kontext | offen | `ueber/#wer-prüft` unverändert: kein Link auf die eigene Seite, kein Lehrbezug; „Prüfen Sie das Zitat.“ an allen 28 Bot-Antworten. |
| M5 Über widerspricht Impressum | anders | Aus „von Studierenden“ wurde „von Nutzern“ (`site/texte/ueber.md:3`). Alle 29 Fragen sind vom Betreiber. Befund M1. |
| N1 Antwort am Anfang | besser | 22 von 29 (gestern 19 von 31). Liste unten in M2. |
| N2 Anriss mit Lücken | offen | s09 [2]: „Wenn …, so ist …, also odds(p) = 1. Wenn …“. |
| N3 Dünne Seiten | offen, anders | Kapitelregel greift (alle 29 `noindex`). bf8ec38f9c86 und `f/praxis/` indexierbar, siehe M4. |
| N4 Rechtstexte | nicht neu geprüft | `noindex`, nicht Teil des heutigen Auftrags. |
| Gestern 7: Zitate überwiegen | gleich | Antwort im Median etwa 220 Wörter, Zitate 565; nur bei 1 von 28 Bot-Antworten mehr Antwort als Zitat. `data-nosnippet` am Zitatblock, trafilatura lässt das `<aside>` weg. |
| Gestern 10: Testfragen | offen | bf8ec38f9c86: weiter „über 80% des Forschungscodes“ ohne Quelle, kein Prüfvermerk, im Auszug 89 Wörter ohne jede Herkunft. |
| Info Metadaten | gleich | 35 Paare: `site_risk` low, `templated_ratio` 0,0, keine `shared_cta_phrases`, keine Doppelungen. |

## 2. Neue Befunde

### Hoch

**H1. „Wörtliches Zitat“ steht als Versprechen im Suchergebnis, und für 13 von 29 indexierbaren Antworten stimmt es gegen das Skript
von heute nicht.** Das Versprechen steht in der Beschreibung der Startseite („Antworten des Bots tragen das wörtliche Zitat aus dem
Skript mit Link“), auf `ueber/` und im Impressum („Jede Antwort trägt deshalb das wörtliche Zitat … damit Sie sie selbst prüfen
können“). Wer auf [n] klickt, landet im Skript am Abschnitt, der Browser markiert nichts, der Text dort ist ein anderer, und darüber
steht „Geprüft am … von Konrad Völkel, Autor des Skripts“. Für einen Fremden sieht das aus wie ein erfundenes Zitat unter dem Namen
des Autors; den Satz „kann ein Zitat veralten“ auf `ueber/` liest er nicht. Schwerer wiegt: s17, s20, s21, s26 tragen „Geprüft am
17.11.2026“ und sind trotzdem betroffen, weil sie gegen den Korpus vom 15.11. erzeugt wurden. Ein frisches Prüfdatum schützt also
nicht; das Problem kommt mit jeder Änderung am Skript wieder. Die Suche selbst sieht das kaum (das Snippet kommt aus der Beschreibung,
Zitate tragen `data-nosnippet`); Sprachmodelle, die Seiten ganz lesen, übernehmen den alten Wortlaut als „Zitat aus dem Skript“
(Annahme: ob ein LLM-Crawler `data-nosnippet` beachtet, kann ich nicht nachschlagen).
_Am dringendsten, in dieser Reihenfolge:_ (1) Korpus aus dem Skript von heute bauen und die 13 dagegen belegen; wo nur der Wortlaut
einer Passage wanderte, reicht neues Zitat und neue Prüfung, nicht eine neue Antwort. (2) Bis dahin die Aussage wahr machen statt
die Seite zu verstecken: am Zitatblock „Zitiert nach dem Skript vom 15.11.2026“ und bei veralteten Zitaten den Link ohne
`#:~:text=` (er führt sonst ins Leere, ohne es zu sagen). (3) Prozess: Kein Ausspielen des Skripts ohne Lauf von
`tools/skriptstand.mjs`; der Link aus dem Skript ins Forum macht das zu einem Kreislauf. Ob die 13 bis dahin `noindex` werden, ist
offen (Auftrag); die Folge, wenn nicht: Jede Woche Verzug ist eine Woche, in der das Kernversprechen öffentlich nicht stimmt.
_Sichtbar:_ `tools/skriptstand.mjs` meldet 0 Antworten mit fremdem Wortlaut; jeder Zitatblock nennt seinen Skriptstand.

**H2. Drei indexierbare Seiten halten ihren Titel nicht (zwei bekannt, nicht neu gezählt, nur mit Satz).**
- s29 „SGD oder Adam: Was generalisiert besser, und warum?“, erster Satz und Beschreibung: „Die Skriptpassagen vergleichen SGD und Adam
  nicht hinsichtlich der Generalisierung. Woran ein solcher Unterschied liegen könnte, bleibt daher offen.“ Dazu „Skriptpassagen“:
  ein Wort aus der Maschine, nicht aus dem Forum.
- s06 „… device für die GPU angeben“: „… schreibt man dafür device=-1; device=0 meint dort die erste GPU.“ Die Beschreibung bricht
  genau dort ab, wo die Richtigstellung beginnt: „… device=0 meint dort die …“.
- s20 (neu am 17.11.) „word2vec auf Audio: Was sind Wörter und Kontext?“: „Für Audio lässt sich aber nur sagen, welche Voraussetzungen
  das Verfahren an „Wörter“ und „Kontext“ stellt.“ Besser als gestern (Aufbau klar, Übertragung auf node2vec und Kauflisten), aber
  die Antwort nennt bis zum Schluss keine Audio-Einheit; die eigentliche Aussage („eine Abfolge diskreter Einheiten aus einem festen
  Vokabular“) steht im letzten Satz.
_Tun:_ s06 erster Satz: „Geben Sie im pipeline-Aufruf device=0 an (erste GPU); device=-1 heißt CPU.“ s29 und s20: eine Antwort der
Moderation mit eigener Quelle, oder Titel ehrlich machen („… Was das Skript dazu sagt“). _Sichtbar:_ Jeder erste Satz beantwortet
die H1.

### Mittel

**M1. Wer hier fragt: Die Über-Seite sagt „Nutzer“, die Seiten zeigen den Betreiber.** `ueber/` erster Satz: „Die Fragen kommen von
Nutzern“, dazu „Hier wächst der Bestand aus den Fragen, die wirklich gestellt werden“. Auf den Seiten: 27× „Frage von Konrad Völkel“
mit Badge „Beispielfrage“, darunter „Geprüft … von Konrad Völkel“; zweimal „Anonymer Nutzer“ (bf8ec38f9c86, 0cfd2b864eda), obwohl
es Testfragen des Betreibers sind (`lib/site.js:429`: alles außer `herkunft === 'beispiel'` heißt so). Heute stimmen also 27 Seiten
und die Über-Seite nicht überein, und die zwei „Nutzer“-Fragen sind keine. Kein Täuschungsvorsatz, aber ein Rater, der eine Seite und
`ueber/` liest, sieht ein Forum, in dem der Autor sich selbst fragt und selbst prüft, und eine Selbstbeschreibung, die etwas anderes
sagt. bf8ec38f9c86 hat außerdem eine Antwort der Moderation mit Badge „geprüft“ (sich selbst geprüft) und ohne Zitat, gegen das
Impressum „Jede Antwort trägt … das wörtliche Zitat“.
_Tun:_ `ueber.md:3`: „Die ersten Fragen hat der Betreiber als Beispiele gestellt; neue Fragen kommen von Studierenden mit Kurscode.“
Die zwei Testfragen als Beispielfragen führen. Impressum: „Jede Antwort des Bots …“. _Sichtbar:_ Kein Satz auf `ueber/`, der einer
Frageseite widerspricht.

**M2. Beschreibungen: Lücken weg, jetzt enden sieben mitten im Gedanken.** Gezählt aus `crawl.json`: 29 Frageseiten, 77 bis 151
Zeichen (Median 133), keine doppelt, keine über 160, 11 enden auf „…“ (bf8ec38f9c86, s01, s03, s06, s07, s12, s15, s20, s25, s26,
s28). Das „…“ am Ende ist harmlos, wenn davor schon die Antwort steht (s03, s07, s12, s25, s26, s28). Schwach sind:
- s01 „… kein Parameter. In der Perzeptronregel …“ (Rest ohne Inhalt), s06 (H2), s15 sagt nichts zu XOR: „… eine Hyperebene H in ℝ^n (in …“
- s11 endet auf „Warum?“ (Zwischenüberschrift der Antwort als Satz übernommen), s24 auf eine Definition: „Ja, genau: Bei Temperature
  Scaling: Seien s_i := -d(v, code(t_i)) die Logits …“, s22 auf ein englisches Zitat ohne schließendes Anführungszeichen, s05
  verspricht nur („lässt sich das direkt nachrechnen.“), s14 trägt „[es]“, s20/s29 sagen ab.
Ursache in `questionDescription` (`lib/site.js:117`): Sätze werden genommen, wie sie kommen; ein Fragesatz oder ein Satz, der auf „:“
endet, zählt wie jeder andere. _Tun:_ Vor einem Satz, der auf „?“ oder „:“ endet, aufhören; eckige Einschübe tilgen; die Beschreibung
wie den Kurztitel von der Moderation bestätigen lassen. _Sichtbar:_ Keine Beschreibung endet auf „?“, „:“ oder einem Satzanfang.
_Erster Satz gegen H1, alle 29:_ beantwortet bei 22; teils bei s15 (erst Satz 3; AND aus der H1 kommt in der Antwort gar nicht vor),
s17 („Sie haben recht: … wäre trivial“, das Warum erst in Absatz 2), bf8ec38f9c86 („Keras 3 lässt sich auch mit PyTorch kombinieren“
zu „Wäre es einfacher?“); nicht bei s06, s12 (Kernaussage im letzten Absatz), s20, s29.

**M3. Die acht neuen Antworten: vier besser, vier gleich, keine schlechter, eine fachlich zu glätten.**
- Besser: s21 (gestern Kernaussage am Ende, heute Satz 1: „würden nur einen Teil des Problems lösen“), s22 (gestern halbe Absage),
  s26 (Doppelung weg), s18 (gestern Herleitung zuerst, heute Grund in Satz 1).
- Gleich: s17, s24, 0cfd2b864eda, s20 (H2). Neue Collage-Reste: s18 „Da ε nicht von den Gewichten abhängt, ganz normal mit der
  Kettenregel[2]:“ (Satz ohne Verb); s24 „Ja, genau: Bei Temperature Scaling: Seien …“; 0cfd2b864eda „Ja, und die Passagen zeigen …“
  (wer sind „die Passagen“?); s17 „… wäre das Problem trivial. Das Skript sagt dazu: Das allein wäre trivial“.
- s21 fachlich: „(und mit der transponierten Gewichtsmatrix[1].“ Klammer nicht geschlossen; „summiert sich auf etwa 4^-10“ ist ein
  Produkt; das Argument hängt an σ (Ableitung ≤ 1/4), in der Praxis läuft man mit ReLU. s26: „der latente Raum … beim Dekodieren
  diskret“ meint das Vokabular, nicht den Raum. s22: Die tragende Papineni-Stelle hat keine Marke [n] und steht nicht unter den
  Zitaten, obwohl sie im Korpus steht; ausgerechnet die Antwort auf die Frage ist nicht nachprüfbar.
_Tun:_ Diese Stellen bei der Neubelegung (H1) mitglätten. _Sichtbar:_ grep nach `Passage`, `[a-z`, ` oben`, ` unten`: 0.

**M4. Dünne Seiten unter den 35 indexierbaren: zwei, beide mit Grund.** `f/praxis/` hat 137 Wörter und zwei Fragen, also weniger als
jede Kapitelseite, die wegen genau dieser Dünne `noindex` trägt; die Regel gilt für Kapitel, nicht für Unterforen. bf8ec38f9c86 hat
201 Wörter (trafilatura: 89), Meinung der Moderation ohne Beleg. Die übrigen: Startseite 176 Wörter als Knoten in Ordnung, die drei
anderen Unterforen 327 bis 350, `ueber/` 608, Fragen 701 bis 3208 (mit Zitaten). Doppelungen: keine (Titel und Beschreibungen
verschieden; Unterforen teilen nur den Nachsatz „Fragen zum Skript …“, Werkzeug: kein Muster). Kapitelseiten `noindex`: richtig. Sie
haben 130 bis 189 Wörter, 1 bis 2 Fragen, der Rest ist Suchfeld und Fuß. Dass die ersten Links von außen dort landen, ist für Menschen
gut (Fragen und Suche zum Kapitel) und für die Suche unschädlich, solange `follow` gilt und die Fragen in der Sitemap stehen; ob Google
lange `noindex`-Seiten irgendwann wie `nofollow` behandelt, weiß ich nur aus Erfahrung, nicht aus der aktuellen Doku.
_Tun:_ bf8ec38f9c86 belegen (Quelle für „80 %“) oder `noindex`; `f/praxis/` vorerst hinnehmen oder dieselbe Schwelle wie für Kapitel.

**M5. Im Auszug für Maschinen steht der Prüfer vor der Antwort, der Bot dahinter.** trafilatura liefert bei allen 28 Bot-Antworten:
Frage, „Geprüft am … von Konrad Völkel, Autor des Skripts.“, Antwort, ganz am Ende „Diese Antwort hat ein Sprachmodell erzeugt“. Das
Wort „Bot“ und der Name hAInrich2 fehlen. Wer nur den Auszug liest, schreibt die Antwort leicht dem Autor zu. _Tun:_ Den Vermerk
selbst vollständig machen: „Antwort des Sprachmodells Claude, geprüft am … von Konrad Völkel, Autor des Skripts.“ _Sichtbar:_ Im
Auszug steht vor der Antwort „Sprachmodell“.

### Niedrig

**N1. Kurztitel.** 29 Titel, 30 bis 52 Zeichen ohne „ | hAInrich2“, keiner abgeschnitten, keiner doppelt. Die sechs schwachen aus
M1 von gestern stehen unverändert; Vorschläge dort gelten weiter. bf8ec38f9c86 macht aus „einfacher“ weiter „besser“.

**N2. KaTeX in der H1.** `crawl.json` liest die H1 von 0cfd2b864eda als „… etwas lineares in xxx gesteckt … wie z.B. x2x^2x2?“
(MathML, TeX und HTML hintereinander). Das JSON-LD (`name`) ist sauber. Wie Google den Text zieht, kann ich nicht nachschlagen;
Formeln in Titel und H1 sparsam halten.

**N3. „Prüfen Sie das Zitat.“** Heute passend, weil 13 Zitate veraltet sind; aber es lädt zu einer Prüfung ein, die bei diesen 13
scheitert. Mit H1 (2) wird der Satz wieder ehrlich.

## 3. Punkte (Einschätzung, keine Messung)

| Teil | 17.11. | 18.11. | Grund |
|---|---:|---:|---|
| Erfahrung (20 %) | 58 | 57 | Fragen sichtbar vom Betreiber selbst, Lehrerfahrung weiter unsichtbar. |
| Fachwissen (25 %) | 82 | 83 | Acht Antworten neu, vier klar besser; s06, s21-Details, Collage. |
| Autorität (25 %) | 60 | 62 | Links aus dem Skript, öffentlicher Quelltext; Person weiter nicht verlinkt. |
| Vertrauen (30 %) | 84 | 76 | 13 veraltete Zitate unter „wörtlich“ und „geprüft“, jetzt öffentlich; Über widerspricht den Seiten. |
| E-E-A-T gewichtet | 72 | 70 | Gewichte sind ein internes Modell, Google veröffentlicht keine. |
| Zitierbarkeit für KI-Suche | 74 | 77 | 22/29 vorn, Formeln in Beschreibungen lesbar; Bot erst am Ende des Auszugs. |
| **Inhalt gesamt** | **77** | **75** | Text besser als gestern, aber die zwei Befunde, die vor dem Start weg sein sollten, sind jetzt live; mit H1 erledigt etwa 85. |

## 4. Nicht geprüft

- Die 13 veralteten Zitate: Liste aus dem Auftrag, nicht neu gezählt, nicht gegen das Skript verglichen. Ob die Papineni-Stelle im
  Korpus wörtlich so steht, nur per Textsuche bestätigt.
- Fachliches aus eigenem Wissen, ohne Literatur. Googles Umgang mit `data-nosnippet` bei LLM-Crawlern, mit langem `noindex`, mit
  KaTeX und kurzen Beschreibungen: aus Erfahrung, nicht nachgeschlagen (kein Netz).
- Rechtstexte, `perf.txt`, `bilder/` nicht genutzt; keine Skripte der Site ausgeführt.
