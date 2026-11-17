# Inhalt, E-E-A-T, Titel und Beschreibungen

_Stand 2026-11-17, nur lokal (`seiten/`, `crawl.json`, `lib/site.js`), Text ohne doppelten KaTeX-Satz gezählt. Antwort ganz gelesen (Zitate
über Anriss und Quelle): s01, s03, s06, s09, s12, s13, s14, s17, s19, s20, s21, s22, s23, s26, s27, s29, bf8ec38f9c86, 0cfd2b864eda; der
Anfang von s05, s15, s18, s25, s28; für alle 31 eine Textsuche nach Resten._

**Zählung berichtigt, bevor es losgeht.** Der Auftrag nennt 4 Beschreibungen unter 70 Zeichen und 2 mit „…“ in der Mitte. Gezählt sind es
**7** unter 70 (s01 52, s15 69, s19 64, s20 60, s25 54, s27 66, s28 59) und **4** mit Formellücke (s03, s12, s21, s23). Ursache: `auswertung.py:16`
kappt die Liste mit `[:8]` (vier Plätze belegen Formular und Rechtstexte) und sucht nur `' … '` mit Leerzeichen; s12 „Es gilt ….“ fällt durch.

## 1. Gegen gestern

| Befund 16.11. | Heute | Beleg |
|---|---|---|
| 1 Veraltete Zitate | offen, anders | Laut Moderation 10 Antworten (gestern am Host 4 als untere Grenze). `ueber/#wer-prüft` sagt jetzt ehrlich, dass ein Zitat veralten kann. Folge für den Start: Befund H1. |
| 2 „geprüft“ ohne wer und wann | behoben | 30 Bot-Antworten tragen „Geprüft am … von Konrad Völkel, Autor des Skripts“ (22× 05.11., 8× 10.11.), Link auf `ueber/#wer-prüft`, das Ziel `id="wer-prüft"` gibt es. Rest: Befund M4. |
| 3 Kapitelseiten dünn im Index | behoben | `KAPITEL_INDEX_AB = 3` (`lib/site.js:36`). Gezählt: 25 Kapitel mit 1 Frage, 3 mit 2, 1 ohne. Beim Start ist keine indexierbar. Inhalt 140 bis 188 Wörter, wie gehabt. |
| 4 Titel schneiden ab | behoben | 0 von 31 Titeln enden auf „…“, Kurztitel 24 bis 52 Zeichen. Zehn schwache, Befund M1. |
| 5 Beschreibungen | teils | Listenzeichen weg (s12). Offen: 4 Formellücken, 7 unter 70, „[es]“ in s14, s20/s29 beginnen mit dem, was fehlt. Befund M2. |
| 6 Antwortreste | teils | s21 „ortohogonale“ behoben. Offen: s29 „Skriptpassagen … bleibt daher offen“, s09 „unten“, s03 „f wie oben“, s14 „[es]“/„[...]“, s12 und s21 Kernaussage am Ende. Neu dazu: Befund M3. |
| 7 Zitate überwiegen | teils | `data-nosnippet` an allen Zitatblöcken, 133 von 134 Zitaten eingeklappt. Das Verhältnis bleibt: Antwort im Median 257 Wörter, Zitat 620; nur s23 und bf8ec38f9c86 haben mehr Antwort als Zitat. |
| 8 Kein Weg weiter | behoben | Kapitelzeile verlinkt, darunter „Alle Fragen zu …“ und Unterforum. Keine Nachbarfragen, mit Absicht (`lib/site.js:306`). |
| 9 Frische | teils | Prüfdatum sichtbar; `dateModified` nur bei bearbeiteten Antworten; Sitemap ohne `lastmod` (`lib/site.js:509`). |
| 10 Testfragen | offen | bf8ec38f9c86: 88 Wörter, „über 80% des Forschungscodes“ weiter ohne Quelle. 0cfd2b864eda gut, Titel schwach (M1). |
| 11 „Beispielfrage“ ohne Herkunft | anders | Impressum und JSON-LD (`author` = Betreiber) sagen jetzt „vom Betreiber“, `ueber/` sagt weiter „Die Fragen kommen von Studierenden“. Befund M5. |
| Info Metadaten | gleich | `metadata_template.py` über 70 Paare: `site_risk` low, `templated_ratio` 0,0, keine `shared_cta_phrases`. Nur `brand-suffix-in-description` an den drei Rechtstexten (`noindex`). |

## 2. Neue Befunde

### Hoch
**H1. Zehn geprüfte, beim Start indexierbare Antworten belegen mit Wortlaut, den das verlinkte Skript nicht mehr hat.** (s17, s18, s19, s20,
s21, s22, s24, s26, s27, 0cfd2b864eda; Liste der Moderation, an den Dateien nicht nachprüfbar.) Jede trägt jetzt „Geprüft am 05.11.2026 von
Konrad Völkel, Autor des Skripts“. Der Vermerk macht das Versprechen stärker, und den Schaden größer: Wer von der Suche kommt und auf [n]
klickt, findet im Skript anderen Text, unter dem Namen des Autors; den Satz auf `ueber/` liest er nicht. Ein Drittel der Fragen.
_Tun:_ Vor dem Ende der Vorschau die zehn gegen `korpus-aktuell` neu belegen und neu prüfen (das Prüfdatum zieht dann mit). Bis dahin
sollte die Indexierbarkeit an „Zitat passt zum aktuellen Korpus“ hängen, nicht nur an „geprüft“. _Sichtbar:_ Die Moderation listet 0.

**H2. Drei Titel versprechen eine Antwort, die die Seite ausdrücklich nicht gibt, und eine Antwort führt in die Irre.**
- s29 „SGD oder Adam: Was generalisiert besser, und warum?“, erster Satz: „Die Skriptpassagen vergleichen SGD und Adam nicht … bleibt daher
  offen.“ Die Beschreibung ist genau dieser Satz. s20 „word2vec auf Audio: Was sind Wörter und Kontext?“: „behandelt das Skript nicht …
  beantwortet das Skript nicht“. s22 halb („nennt nicht direkt“). Für eine Suchanfrage ist das die schlechteste Seite: Treffer, Klick, Absage.
- s06, erster Satz und Beschreibung: „Das Gerät geben Sie direkt im pipeline-Aufruf an: In den pipeline-Aufrufen von transformers schreibt man
  dafür device=-1“. Im Skript bezieht sich „dafür“ auf die CPU (Zitat [1]), in der Antwort liest es sich als Weg zur GPU. Erst der zweite
  Satz stellt es richtig, das Snippet nicht. Geprüft am 10.11.
_Tun:_ s20, s29 von der Moderation beantworten (Literatur in `research/2026-11-05-skriptluecken`) oder bis dahin `noindex`; s06: „Geben
Sie im pipeline-Aufruf device=0 an (erste GPU); device=-1 heißt CPU.“

### Mittel
**M1. Die 31 Kurztitel** (Zeichen ohne „ | hAInrich2“). **Gut, 21:** Fachwort vorn, so getippt, wie man sucht, die Antwort hält es:
s01 Parameter oder Hyperparameter: Was ist die Lernrate? (52) · s03 Gradient und Richtungsableitung: Vektor oder Zahl? (50) · s04 Ist jedes
neuronale Netz ein MLP? (33) · s06 Hugging-Face-Pipeline: device für die GPU angeben (49) · s08 Softmax mit zwei Klassen: dasselbe wie
Sigmoid? (47) · s09 Log-Odds: Warum linear statt Wahrscheinlichkeit? (48) · s10 Likelihood eines Datensatzes: Produkt wird Summe? (49) ·
s11 SGD: Loss steigt zwischen Mini-Batches. Normal? (47) · s12 Backpropagation: Warum rückwärts statt vorwärts? (48) · s13
optimizer.zero_grad(): Warum vor jedem Schritt? (47) · s14 Tote ReLU-Neuronen erkennen: Hilft Leaky ReLU? (46) · s15 XOR: Warum reicht ein
einzelnes Neuron nicht? (45) · s16 Approximationstheorem: Warum trotzdem tiefe Netze? (50) · s17 Autoencoder: Warum lernt er nicht die
Identität? (48) · s18 VAE: Wozu der Reparametrisierungstrick? (39) · s21 Orthogonale Matrizen oder Skip Connections? (43) · s22 BLEU: Warum
so lange ein so simples Maß? (40) · s23 Conv2d: Ausgabegröße mit Padding und Stride (43) · s24 Temperatur bei Softmax: Logits durch T
teilen? (46) · s25 GAN: Braucht der Generator einen Decoder als Start? (51) · s28 Destillation: Warum weiche statt harter Labels? (47).
(s06, s12, s22: Titel gut, Antwort siehe H2 und N1.) **Schwach, 10:**

| Frage | Zeichen | Kurztitel | Problem, Vorschlag (≤ 53) |
|---|---:|---|---|
| s27 | 24 | Woher kommen die Labels? | gekürzt bis zur Leere: „E-Mail-Antwort vorhersagen: Woher kommen die Labels?“ (52) |
| 0cfd2b864eda | 30 | Nichtlineare Inputs auch okay? | ohne Bezug: „Aktivierungsfunktion: Nichtlineare Eingabe wie x²?“ (50) |
| bf8ec38f9c86 | 40 | Ist Keras Tensorflow besser als PyTorch? | macht aus „einfacher“ „besser“: „Keras/TensorFlow oder PyTorch: Was ist einfacher?“ (49) |
| s19 | 51 | Dokumentvektor aus Token-Vektoren: Warum summieren? | Antwort: „Mittelwert“, Summe nicht besser: „Dokumentvektor: Mitteln, summieren oder verketten?“ (50) |
| s02 | 50 | Warum normalisiert man Vektoren vor dem Vergleich? | Fachwort fehlt: „Kosinus-Ähnlichkeit: Warum Vektoren normalisieren?“ (50) |
| s26 | 50 | Mischung aus Katze und Hund dekodieren: Was kommt? | Fachwort fehlt: „Latenter Raum: Was ergibt 0,5·Katze + 0,5·Hund?“ (47) |
| s07 | 44 | PyTorch-Tensoren und Tensoren der Mathematik | keine Frage: „Tensor in PyTorch: Dasselbe wie in der Mathematik?“ (50) |
| s05 | 50 | Perzeptron-Lernregel: Warum verbessert das Update? | Objekt fehlt: „Perzeptron-Lernregel: Warum hilft jedes Update?“ (47) |
| s29 | 51 | SGD oder Adam: Was generalisiert besser, und warum? | Titel gut, Antwort hält ihn nicht (H2) |
| s20 | 48 | word2vec auf Audio: Was sind Wörter und Kontext? | Titel gut, Antwort hält ihn nicht (H2) |

Die beiden des Eigentümers sind neben s27 die schwächsten. _Sichtbar:_ Jeder Titel enthält ein Fachwort aus der H1.

**M2. Beschreibungen: Die Ursache ist eine Regel, kein Einzelfall.** `questionDescription` (`lib/site.js:92`) nimmt ganze Sätze bis zum ersten
„…“, wenn sie mindestens 50 Zeichen haben, sonst den gekürzten Text mit Lücken. Zwei Folgen: (a) Auch das „…“ der Kürzung auf 158 Zeichen
zählt als Lücke. Ist der zweite Satz lang, bleibt nur der erste: s25 „Nein, ein Autoencoder-Decoder ist keine Voraussetzung.“ (54), obwohl
der Rest lesbar wäre. (b) Ist der erste Satz kürzer als 50, kommt der Text mit Formellücken: s03 „Der Gradient von … an der Stelle a ist der
Vektor …, also …“, s12 „Es gilt ….“, s21 „Eine Matrix … heißt orthogonal, wenn … ist.“, s23 „ist die Ausgabelänge …, pro Dimension“ (die
Formel ist die Antwort). Die Lücken entstehen in `formulaText` (`:58`), weil Befehle fehlen: `\colon` (s03), `\circ`, `\bigl`/`\bigr` (s12),
`\top` und `^{d \times d}` mit Leerzeichen (s21), `\frac`, `\lfloor` (s23).
Brauchbar sind s01, s25 (direkte Antwort, kurz ist da kein Mangel), halb s19, s28. Unbrauchbar: s15 (sagt nichts zu XOR), s20 (Absage), s27
(„Genau dieses Szenario …“ ohne Bezug), s29, s06 (H2) und die vier mit Lücken. Ob Google sie ersetzt, kann ich ohne Doku nicht sagen.
_Tun:_ Schwelle auf etwa 100; darunter den nächsten Satz mit Schluss-„…“ anhängen; fehlende TeX-Befehle ergänzen; `[…]`-Einschübe
entfernen. Robuster: Beschreibung wie den Kurztitel von der Moderation bestätigen lassen. _Sichtbar:_ keine unter 70, kein „…“ vor dem Ende.

**M3. Zitatcollage: Zitierte Sätze tragen Bezüge mit, die auf der Seite ins Leere gehen.** Das typische Muster dieser Antworten (und der
Kern von H2/s06): s13 „backward läuft *diesen* Graphen rückwärts ab“ (kein Graph vorher), s03 „f wie oben“, s09 „unten“, s25 „Nach dem
GAN-Training passen die beiden Teile allerdings nicht mehr zusammen: Nach dem GAN-Training des Decoders passen Encoder und Decoder aber nicht
mehr zusammen“, s26 „Bei Bildern ist das anders: Bei Autoencodern für Bilder ist dies anders“. Eckige Einschübe im Fließtext: s14 „[es]“,
2× „[...]“, s27 „[man]“, „[werden] … [gefüttert]“, s28 „[die benötigte Komplexität]“. Marke mitten im Wort: s22 „weiter[3]läuft“. Kein Spam,
aber es liest sich maschinell, unter „geprüft“. _Tun:_ Bezüge auflösen, Doppelungen streichen, Einschübe glätten. _Sichtbar:_ grep nach
`[a-z`, ` oben`, ` unten` in Antworttexten: 0.

**M4. Wer hier spricht: das Gerüst trägt, ein Satz fehlt.** Am Beitrag stehen Bot-Kennzeichen, Modell, Prüfer mit Rolle und Datum,
Lizenzen, „Melden“; im Fuß Betreiber und „nicht der HHU“. Das reicht für Transparenz. Was ein Fremder nicht erfährt: was „das Skript“ ist
(die Vorlesung, zu der es gehört) und wer Konrad Völkel ist. `ueber/#wer-prüft` sagt „der Autor des Skripts“, ohne Link auf
`www.konradvoelkel.com` (steht nur im JSON-LD und an der Karte von bf8ec38f9c86) und ohne Lehrbezug. „Prüfen Sie das Zitat.“ unter jedem
geprüften Vermerk liest sich wie Misstrauen gegen den eigenen Prüfer. _Tun:_ Unter „Wer prüft“ ein Satz, wofür das Skript ist und dass der
Prüfer es lehrt (Wortlaut und HHU-Nähe entscheidet Konrad), Link auf die eigene Seite; bei „geprüft“: „Das Zitat steht unten, zum Nachlesen.“

**M5. Über-Seite widerspricht Impressum und Frageseite.** `ueber/`, erster Absatz: „Die Fragen kommen von Studierenden“. Frageseiten: 29×
„Beispielfrage“; Impressum: „Die Beispielfragen stammen vom Betreiber“; JSON-LD: `author` der Frage = Konrad Völkel, sichtbar steht nur
„Frage“. Dazu „die Antworten schreibt ein Sprachmodell“ gegen „Die meisten“ (Startseite). _Tun:_ Ein Satz auf `ueber/`: Die ersten Fragen sind
Beispielfragen des Betreibers (falls zutreffend: nach Fragen aus der Vorlesung), neue kommen von Studierenden mit Kurscode.

### Niedrig
**N1. Antwort direkt am Anfang:** 19 von 31 ja (z. B. s01, s04, s08, s10, s13, s23, s25, 0cfd2b864eda). Nicht vorn: s12, s21 (Kernaussage
im letzten, unbelegten Absatz von Hand), s15, s18 (Herleitung zuerst), s19 (zur zweiten Teilfrage), s27 („Genau dieses Szenario …“), dazu
s20, s22, s29 (H2). Ohne Beleg: die Schlussabsätze von s12 und s21 (Moderation), bf8ec38f9c86 ganz, „über 80 %“. Legitim, die Moderation
spricht dort selbst, nur sieht man es am Absatz nicht; ein „(Moderation)“ am Absatz würde es zeigen.

**N2. Eingeklappte Zitate: ein Gewinn, mit einem Schönheitsfehler.** Die Quelle bleibt sichtbar, [n] öffnet das Zitat (`site/zitate.js:8`),
der Wortlaut steht im HTML. Versteckt ist nichts. Aber der Anriss ist bei Formeln Lückentext: s09 [2] „Wenn …, so ist …, also
odds(p) = 1. Wenn …“. Dort nur Quelle und „ganzes Zitat“ zeigen.

**N3. Dünne Seiten: die Regel reicht.** Formular und 29 Varianten bleiben `noindex` (Standard in `shell`, Canonical auf `f/neu/`),
richtig so. Kapitelseiten: Beim Start keine über der Schwelle. Erreicht eine drei Fragen, ist sie noch immer nur eine Liste mit demselben
Beschreibungssatz wie alle 29. Vorschlag: Indexierbar erst mit drei Fragen *und* zwei Sätzen „Worum es im Kapitel geht“. Unterforen (164 bis
346 Wörter) sind als Knoten in Ordnung, ihre Titel aber themenlos („Grundlagen | hAInrich2“): „Grundlagen des Deep Learning: Fragen“. bf8ec38f9c86 (195 Wörter, eine Meinung ohne Quelle) eher `noindex` lassen oder belegen.

**N4. Rechtstexte, nur Verständlichkeit.** Klar und kurz (grob Amstad 58 für den Zustimmungstext, 69 für „Rechte an Ihrem Text“, Sätze
um 10 bis 11 Wörter). „Ich gebe meine Frage gemeinfrei“ ist ungewohnt, wird aber im selben Satz erklärt. Drei Stellen zum Hängenbleiben: (1) „lässt sich nicht zurücknehmen“ neben „Löschen lassen können Sie die Frage hier trotzdem“: Dass
Löschen hier Kopien anderswo nicht zurückholt, steht nirgends ausdrücklich. (2) „nur Fragen, die Sie selbst formuliert haben“: Darf
die Frage einen Satz aus dem Skript zitieren? Offen. (3) Der Pflicht-Haken bündelt vier Aussagen (öffentlich, Anthropic/USA, CC0, keine
Personendaten); CC0 steht an dritter Stelle, der Hinweis darunter wiederholt es, das hilft.

## 3. Punkte (Einschätzung, keine Messung)

| Teil | 16.11. | 17.11. | Grund |
|---|---:|---:|---|
| Erfahrung (20 %) | 55 | 58 | Herkunft der Fragen weiter unklar, Lehrerfahrung unsichtbar. |
| Fachwissen (25 %) | 75 | 82 | Prüfer mit Rolle an jeder Antwort; Abzug s06, Zitatcollage. |
| Autorität (25 %) | 55 | 60 | „Autor des Skripts“ sichtbar, Person nicht verlinkt, keine Verweise von außen. |
| Vertrauen (30 %) | 85 | 84 | Vermerk, Lizenzen, Melden; dagegen 10 veraltete Zitate unter „geprüft“, Widerspruch auf `ueber/`. |
| E-E-A-T gewichtet | 69 | 72 | Gewichte sind ein internes Modell, Google veröffentlicht keine. |
| Zitierbarkeit für KI-Suche | 70 | 74 | 19/31 Antworten vorn, `data-nosnippet` lenkt auf die Antwort; Beschreibungen und s12/s21 bremsen. |
| **Inhalt gesamt** | **72** | **77** | Titel, Prüfvermerk und Kapitelregel sind echte Fortschritte; H1 und H2 vor dem Start erledigt, wären es um 85. |

## 4. Nicht geprüft

- Die zehn veralteten Zitate: Liste der Moderation, nicht gegen `korpus-aktuell` verglichen. `questionDescription` am Code nachvollzogen,
  nicht ausgeführt (keine Skripte der Site).
- s02, s04, s07, s08, s10, s11, s16, s24 nur per Textsuche; fachlich am Skript und eigenem Wissen geprüft, nicht an Literatur.
- `datenschutz/`, `perf.txt`, `bilder/` nicht genutzt. Googles Umgang mit `<details>`, kurzen Beschreibungen, KaTeX: aus Erfahrung, nicht
  nachgeschlagen. Amstad mit grober Silbenzählung.
