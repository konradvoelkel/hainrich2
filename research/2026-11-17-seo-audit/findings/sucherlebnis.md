# Sucherlebnis (SXO), 17.11.2026

Grundlage: rohes HTML in `seiten/`, `crawl.json`, `auswertung.txt`, `perf.txt`, `bilder/frage-mobil.png` (s09) und `bilder/kapitel-mobil.png`.
Kein Abruf am Host. Sechs allgemeine Websuchen ohne Name, Adresse oder Sätze der Site (wörtlich am Ende). Das Suchwerkzeug liefert nur
Trefferlisten, keine SERP-Features. **SXO-Gap-Score bei Freigabe: 68 von 100** (gestern 60), getrennt von jedem SEO-Score.

## 1. Gegen gestern

| Punkt vom 16.11. | Stand | Beleg |
|---|---|---|
| s09: Titel endet vor dem Kern | behoben | `Log-Odds: Warum linear statt Wahrscheinlichkeit? \| hAInrich2` |
| s09: Beschreibung ersetzt `w·x+b` durch „…“ | behoben | Beschreibung enthält jetzt „w · x + b“ |
| s12: Kern (Effizienz) erst im letzten Absatz | offen | `.text` von s12: fünf Stichpunkte, dann „Der Grund liegt darin …“; Kostenaussage weiter ohne Zahl |
| s12: Beschreibung beginnt mit „- “ | anders | Strich weg, aber weiter „Grundlage ist die Kettenregel. Es gilt …. …“ |
| s23: Beschreibung ohne Formel | offen | „… ist die Ausgabelänge …, pro Dimension.“ |
| s23: Zitat wiederholt die Antwort | anders | Zitat jetzt eingeklappt, kostet am Telefon kaum noch Platz |
| s15: keine Abbildung | offen | nur `logo.svg`; im Zitat steht „Abbildung: …“ als Text ohne Bild |
| s15: Beschreibung unlesbar | behoben | „Ein einzelnes Neuron (Perzeptron) berechnet f(x) = [ w · x + b > 0 ].“ |
| bf8ec: Fehlpassung bei Vergleichssuche | offen, schärfer | Kurztitel „Ist Keras Tensorflow besser als PyTorch?“ verspricht jetzt einen Vergleich, Antwort 88 Wörter |
| Frageseite ist Sackgasse | anders | `nav.weiter` mit Kapitel und Unterforum an allen 31; aber siehe H1 unten |
| Kapitelname im Pfad ist reiner Text | behoben | Pfad und `p.meta` verlinken `../kapitel/<id>/` |
| Kurscode-Wand unerklärt | behoben | `f/neu/`: „Fragen stellen kann nur, wer den Kurscode hat … Lesen können alle.“ |
| Skriptstand nicht sichtbar (Lehrender) | offen | kein Stand, keine Fassung auf s09/s12 |
| Kein Frage-Antwort-Typ im JSON-LD | behoben | `QAPage` an allen 31 (`auswertung.txt`) |
| Kapitelseiten erst ab drei Fragen indexieren | behoben (laut AUFTRAG) | in den Daten nicht prüfbar, alle 99 Seiten tragen `noindex` |
| Kapitelseiten ohne Einleitung | offen | `kapitel-mobil.png`: H1, Knopf, Suche, Liste; 140 bis 188 Wörter |
| Suche lädt 24 MB vor dem ersten Treffer | offen, nicht neu geprüft | Hinweis steht auf Kapitelseite und Startseite |
| Prüfung überschritt das Abruflimit | behoben | heute null Abrufe am Host |

## 2. Neue Befunde

### HOCH: „Alle Fragen zu …“ führt bei 25 von 31 Fragen auf eine Liste mit nur dieser Frage
- Wo: `nav.weiter` unter jeder Frageseite; Ziel `f/kapitel/<id>/`. Laut `crawl.json` verlinken 25 Kapitelseiten genau eine Frageseite,
  drei verlinken zwei, eine keine. Beispiel s12: „Alle Fragen zu „Backpropagation““ zeigt nur s12 (`kapitel-mobil.png`).
- Warum: Für jemanden aus der Suche ist das der einzige Link zu „mehr davon“, und er führt im Kreis. Echte Weiterführung kommt erst
  über das Unterforum (`f/lernen/` hat 10 Fragen), zwei Klicks entfernt.
- Tun: Steht im Kapitel nur diese Frage, den Kapitellink in `nav.weiter` weglassen oder die Zahl nennen, und das Unterforum zuerst und mit
  Zahl verlinken („10 Fragen in Lernen und Training“). Besser noch zwei bis drei Kurztitel aus demselben Unterforum (keine Bewertung
  über Kosinus nötig, Kapitelreihenfolge reicht). Dazu „Kapitel im Skript lesen“ als dritter Link: Für Selbstlernende ist das der
  natürliche nächste Schritt, heute nur über Zitatquellen und den Fuß erreichbar.
- Woran man es sieht: Kein Link von einer Frageseite auf eine Kapitelseite, die nur diese Frage listet; später mehr Seiten je Sitzung
  bei Einstieg auf `f/s…/`.

### HOCH: Drei Kurztitel versprechen mehr, als die Antwort hält
- s29 „SGD oder Adam: Was generalisiert besser, und warum?“ – die Antwort beginnt „… bleibt daher offen“, Beschreibung ebenso. Die Suche
  dazu zeigt Forschungsarbeiten mit mehreren Erklärungen (flache Minima, Update-Richtung, Batch-Größe). Wer klickt, bekommt „das Skript
  sagt es nicht“. Höchstes Risiko für sofortiges Zurückgehen. Tun: Titel ehrlich machen („SGD oder Adam: was das Skript dazu sagt“) oder
  die Seite nicht indexieren.
- bf8ec: H1 fragt „einfacher mit Keras?“, Titel „besser als PyTorch?“. Tun: Titel näher an der H1 („Warum PyTorch statt Keras im Kurs?“).
- s19 „… Warum summieren?“: Antwort sagt, das Skript nenne den Mittelwert und behaupte nicht, Summieren sei besser. Beschreibung
  widerspricht dem Titel. Vertretbar, weil die Frage so gestellt war, aber ein „oder“-Titel wäre ehrlicher („Summieren oder Aneinanderhängen?“).

### MITTEL: Beschreibungen mit Formel-Lücken und mitten im Satz abgeschnitten
- Formel durch „…“ ersetzt: s03, s12, s21, s23. Bei s23 fehlt genau das, was gesucht wird (die Formel); bei s21 bleibt „Eine Matrix … heißt
  orthogonal, wenn … ist.“ Mit „…“ abgeschnitten: s03, s06, s07, s12, s21, s23, bf8ec. Kleinkram: s14 enthält „[es]“, s17 beginnt mit
  „Sie haben recht:“ (ohne Frage im Treffer seltsam), s20/s22/s29 beginnen mit „Das Skript … nicht“.
- Tun: Für Seiten mit Formel im ersten Satz eine Kurzbeschreibung wie den Kurztitel durch die Moderation bestätigen lassen, Formel als
  Klartext („(n + 2p − k) / s + 1, abgerundet“). Woran: kein „…“ in Beschreibungen in `crawl.json`.

### MITTEL: Am Telefon steht vor der Antwort zu viel Rahmen
- Quellreihenfolge s09/s12/s23: Banner, Kopf mit Unterzeile (2 Zeilen), Pfad, Fragekarte mit Abstimmung, Zeile Datum/„Beispielfrage“/Melden/#1,
  H1, Kapitellink (zum zweiten Mal, steht schon im Pfad), „Diese Frage ist gemeinfrei (CC0 1.0)“, Antwortkopf mit Bot, Zeile „geprüft“/Melden/#2,
  Prüfvermerk (2 Zeilen, sagt dasselbe wie „geprüft“). Auf `frage-mobil.png` (s09, 94 Zeichen H1) beginnt die Antwort bei gut 70 % des
  ersten Bildschirms, sichtbar sind rund fünf Zeilen: reicht, der Kern steht da.
- s23 (H1 133 Zeichen) und s12 (117): H1 eine Zeile länger, die Antwort beginnt am unteren Rand (geschätzt, nicht gerendert). s23: Formel
  im ersten Satz, vermutlich knapp im oder knapp unter dem ersten Bildschirm. s12: sichtbar ist „Grundlage ist die Kettenregel“, der Grund
  steht rund zwei Bildschirme tiefer.
- Tun: CC0-Zeile ans Seitenende zur Lizenz der Antworten ziehen (sichtbar bleibt sie), Kapitellink unter der H1 entfällt (Pfad hat ihn),
  Badge „geprüft“ und Prüfvermerk in eine Zeile. Spart geschätzt 4 bis 5 Zeilen. Woran: Bildschirmfoto s23 zeigt die Formel ohne Scrollen.

### NIEDRIG
- „Beispielfrage“ ist für Fremde unerklärt (wirkt wie Attrappe); ein `title` oder Link auf `ueber/` reicht.
- s15: „Abbildung: …“ steht im Zitat als Text ohne Bild; ohne Bild verliert die Seite gegen jede Folie zum XOR.
- Linktext auf Kapitelseiten und Unterforen ist die volle Frage. **Richtig so**: Er gleicht der H1, gibt Kontext, den der Kurztitel weglässt
  (s27, s21, s26), und ist guter Ankertext. Kosten: vier Zeilen je Eintrag am Telefon; erträglich, solange Listen kurz sind.

## 3. Wie sähe der Treffer aus (alle 31)

Titel 36 bis 65 Zeichen; elf liegen über 60, bei allen fällt dann nur ein Teil von „ | hAInrich2“ weg, nie der Kern. Ob Google den
Seitennamen abschneidet oder getrennt zeigt, kann ich nicht nachschlagen. Beschreibungen 52 bis 153 Zeichen, keine über 155.

**Die fünf stärksten** (Titel ist die Suchanfrage, Beschreibung beantwortet sie):
1. s11 „SGD: Loss steigt zwischen Mini-Batches. Normal?“ / „Das ist normal und kein Fehler. …“ – Sorge und Entwarnung im Treffer.
2. s16 „Approximationstheorem: Warum trotzdem tiefe Netze?“ / „Das Theorem beantwortet nur, ob …, nicht, wie man sie effizient …“.
3. s24 „Temperatur bei Softmax: Logits durch T teilen?“ / „Ja, genau: … durch T geteilt, bevor die Softmax angewendet wird.“
4. s02 „Warum normalisiert man Vektoren vor dem Vergleich?“ / „Normalisieren trennt Richtung und Länge. …“
5. s01 „Parameter oder Hyperparameter: Was ist die Lernrate?“ / „Die Lernrate ist ein Hyperparameter, kein Parameter.“ (kurz, aber die Antwort)
Knapp dahinter: s08, s25, s13, s17, s18, s14 (bis auf „[es]“).

**Die fünf schwächsten:**
1. s29 – Titel verspricht „warum“, Beschreibung sagt „bleibt offen“ (siehe H2).
2. s27 „Woher kommen die Labels?“ (36 Zeichen) – ohne E-Mail, Postfach, Vorhersage; Beschreibung „Genau dieses Szenario …“ sagt nichts.
3. s12 – starker Titel, aber Beschreibung „Grundlage ist die Kettenregel. Es gilt …. …“: der wichtigste Kandidat verschenkt seinen Treffer.
4. s23 – starker Titel, Beschreibung ohne die gesuchte Formel.
5. s21 „Orthogonale Matrizen oder Skip Connections?“ – das Problem (verschwindende Gradienten) fehlt im Titel, Beschreibung voller Lücken.
Ebenfalls schwach: s26 (kein Fachbegriff im Titel: Token, Embedding), s20/s22 (Beschreibung „das Skript … nicht“), bf8ec, 0cfd2
(„Nichtlineare Inputs auch okay?“, ohne „Aktivierungsfunktion“).

**Kurztitel gegen H1:** 25 von 31 treffen die H1 genau oder als ehrliche Verdichtung. Anders verspricht: s29, bf8ec, s19 (H2). Verlieren
den Suchbegriff: s27, s21, s26, 0cfd2. s07 ist eine Aussage statt einer Frage und lässt den Haken der H1 weg („nur ein Name für Arrays?“).

## 4. Seitentyp gegen Suchabsicht

Gestern: lange, genaue Warum- und Wie-Fragen auf Deutsch sind dünn besetzt; Begriffe gehen an Lexika und Videos. **Gilt weiter**, mit
zwei Zusätzen aus den sechs Suchen:
- Backprop rückwärts: deutsche Glossare und KI-Blogs (mind-verse, metricgate, llmbase, hyper.ai, zeli.app), englisch der Gundersen-Beitrag.
  Alle nennen das Effizienzargument sofort. s12 hat Chance, aber nur mit dem Grund oben (offen seit gestern).
- Conv2d-Ausgabegröße: d2l.ai, machinelearningmastery, apxml, leyaa.ai, alles Englisch, „keine deutschen Treffer“. s23 hat die beste Chance.
- `zero_grad`: offizielle PyTorch-Doku und Tutorial, dazu leyaa.ai, alles Englisch. Seitentyp passt (Frage mit Code), gegen die Doku aber nur
  bei deutscher Anfrage; s13 sollte im ersten Satz „PyTorch summiert Gradienten auf“ sagen.
- Tote ReLU erkennen: arXiv, deutsche Glossare (ultralytics, seofai), educative. Das Werkzeug fand **keine** Quelle zum Erkennen; genau
  das beantwortet s14. Echte Lücke, gute Chance.
- SGD vs. Adam generalisiert: fast nur arXiv-Arbeiten. Die Absicht ist „Gründe aus der Forschung“; s29 sagt „offen“. Falscher Seitentyp für
  diese Anfrage, keine Chance.
- VAE Reparametrisierungstrick: englische Kurse und Blogs, ein deutscher Kursanbieter (codefinity). s18 passt im Typ, Konkurrenz mäßig.

**Echte Chance (Einschätzung, kein Suchvolumen bekannt):** s23, s14, s12 (nach Umbau), s11, s13, s09, s18, s17, s16, s05, s24, s10, s08,
s28, s15 (mit Bild). **Kaum:** s01 und s04 (Begriffsabgrenzung, Glossare), s06 (Hugging-Face-Doku), s07, s29, s20, s22 (Antwort sagt „das
Skript behandelt das nicht“), s26, s27, s19, bf8ec, 0cfd2. Diese schaden nicht, sollten aber nicht als Suchziele zählen.

## 5. Kapitelseiten und Unterforen als Landeseiten

Kapitelseiten: reine Navigation (H1, „Frage stellen“, Suche mit 24-MB-Hinweis, Liste mit meist einer Frage). Als Landeseite für „<Kapitel>
Fragen“ taugen sie nicht; dass sie erst ab drei geprüften Fragen indexierbar werden, ist richtig und heute für keine erfüllt. Für den Tag,
an dem eine drei Fragen hat, fehlt weiter die Einleitung (zwei Sätze vom Kapitelanfang im Skript, mit Link). Unterforen: brauchbare
Verteiler (10, 9, 9, 3 Fragen), als Suchziel zu allgemein. Volle Frage als Linktext: richtig (siehe Befund NIEDRIG).

## 6. Personen: was jeder auf der Frageseite fehlt

| Person | Fehlt |
|---|---|
| Studentin kurz vor der Klausur (Handy, aus ILIAS) | Weitere Fragen zum selben Stoff ohne Umweg (Kapitelliste hat meist nur diese); bei s12 der Kern oben; ein Link „Kapitel im Skript“ neben Kapitel und Unterforum. |
| Selbstlerner von außen (aus der Suche) | Was „das Skript“ ist und wo es liegt, steht oben nur als Text im Kopf; „Beispielfrage“ unerklärt; bei s15 das Bild; nach der Antwort ein Weg zu mehr als dieser einen Frage; bei s29 überhaupt eine Antwort. |
| Lehrender, der die Site prüft | Skriptstand bzw. Datum der zitierten Fassung; welches Modell (Version) geantwortet hat. Prüfvermerk mit Namen und Link auf `ueber/#wer-prüft` und der Hinweis „bearbeitet“ reichen sonst. |

## 7. Punkte

| Dimension | 16.11. | 17.11. | Warum |
|---|---|---|---|
| Seitentyp | 12/15 | 12/15 | unverändert; s29 und bf8ec jetzt mit Titeln, die die Fehlpassung verstärken |
| Inhaltstiefe | 11/15 | 11/15 | Antworten gleich, s12 unverändert |
| Nutzerführung | 7/15 | 9/15 | Kapitel-, Unterforum- und Kurscode-Hinweis da; Kapitellink führt meist im Kreis |
| Strukturierte Daten | 6/15 | 10/15 | `QAPage` und Person; Rich Result laut Entscheidung unwahrscheinlich |
| Medien | 7/15 | 7/15 | keine Abbildung, Formeln weiter nicht im Treffer |
| Vertrauen | 10/15 | 12/15 | Prüfvermerk mit Datum, Lizenzen sichtbar, Betreiber im Fuß |
| Aktualität | 7/10 | 7/10 | Daten an Frage und Prüfung, Skriptstand fehlt |
| **Summe** | **60** | **68** | Treffer und Rahmen besser, der Weg nach der Antwort und drei Versprechen nicht. |

## 8. Nicht geprüft

- Nichts gerendert, kein Abruf. Höhen am Telefon für s12 und s23 sind aus Zeichenzahl der H1 und dem Foto von s09 geschätzt.
- SERP-Features (KI-Übersicht, Featured Snippet, „Ähnliche Fragen“), Ort Deutschland, Suchvolumen: das Werkzeug liefert sie nicht.
- Ob Google den Kurztitel übernimmt oder umschreibt und wie es „ | hAInrich2“ behandelt: Doku nicht nachschlagbar.
- Die Suche im Browser und alles nach dem Feld „Kurscode“.

Suchen (6 von 6), wörtlich: „Backpropagation warum Ableitung rückwärts berechnen statt vorwärts“; „Conv2d Ausgabegröße berechnen Formel
Padding Stride“; „zero_grad PyTorch wozu Gradienten zurücksetzen vergessen“; „dying ReLU erkennen tote Neuronen Leaky ReLU hilft“; „SGD
generalisiert besser als Adam Gründe“; „Variational Autoencoder Reparametrisierungstrick wozu“.
