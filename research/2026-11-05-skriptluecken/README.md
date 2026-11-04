# Lücken im Skript: was die Antworten offenlassen

_Stand 2026-11-05. Grundlage: alle 90 Antworten auf die 30 Seeds, der Korpus vom Skriptstand 2026-11-04 abends. Ohne
API-Aufruf: `pruefen.mjs` mit `kandidaten.json` sucht jeden Kandidaten im ganzen Korpus._

**Ergebnis:** In 23 von 30 Fragen sagt mindestens eine Antwort, etwas bleibe offen. Davon sind **11 echte Lücken**, **5 stehen
im Skript**, nur die Suche hat sie nicht geliefert, und **7 sind Fehlalarm**. „Steht nicht in den Passagen“ sagt also wenig
über das Skript: Die Modelle sehen rund 27 von 442 Passagen.

★ = die Frage stammt aus dem Hörsaal (Transkripte). Die übrigen hat ein Modell zum Skript erzeugt, sie wiegen weniger.

**Grenzen:** 30 Fragen sind eine Stichprobe, keine Vollständigkeit. Eine Lücke heißt: Die Textsuche fand nichts, nicht dass es
bewiesen fehlt. Die Einstufung ist mein Urteil; ob etwas ins Skript gehört, entscheidet Konrad. Die Spalte „Vorschlag“ und die
Literatur kommen aus meinem Wissen, nicht aus dem Skript, und sind ungeprüft.

## Echte Lücken

### Zentral

| | Frage | Was fehlt | Was schon da ist | Vorschlag |
|---|---|---|---|---|
| **s12** | Warum rechnet man rückwärts und nicht vorwärts? | Der Vergleich mit der Vorwärtsrichtung. Alle drei Modelle sehen das. | `backpropagation` § Das Muster: „Der Aufwand ist etwa das Doppelte einer Inferenz, unabhängig von der Anzahl der Parameter.“ | Das Matrixprodukt der Kettenregel hat rechts viele Spalten (Parameter) und links eine Zeile (skalarer Loss). Von links geklammert bleibt jedes Zwischenergebnis ein Vektor, von rechts eine Matrix; vorwärts bräuchte einen Durchlauf je Parameter. Stichwort Forward und Reverse Mode. Passt ans Ende von § Das Muster. |
| **s16** | Warum tiefe Netze, wenn eine Schicht reicht? | Warum Tiefe überhaupt hilft. Die Suche nach Tiefe gegen Breite, Komposition und exponentiell vielen Stücken ergab null Treffer. | `universelle-approximation` zeigt, dass eine Schicht reicht; `destillation` sagt nur, große Netze lernten leichter. | Komposition: Die Zahl der linearen Stücke eines ReLU-Netzes wächst mit der Tiefe exponentiell, mit der Breite nur polynomial (Montúfar et al. 2014, Telgarsky 2016). Die Polyeder-Abbildung aus `aktivierungsfunktionen` wäre der Anknüpfungspunkt. |
| **s29** ★ | Warum generalisiert SGD besser als Adam? | Das Thema fehlt ganz. Sonnet lehnte ab, auch im zweiten Anlauf. | `optimierer` sagt nur „klappt Adam oft besser“. `universelle-approximation` nennt die implizite Regularisierung im tiefen Netz. | Wilson et al. 2017 (der Befund), Keskar et al. 2017 (flache und scharfe Minima), AdamW als Korrektur (Loshchilov, Hutter 2019). Ein Absatz in `optimierer` mit Verweis auf die implizite Regularisierung. |
| **s21** ★ | Orthogonale Matrizen lösen doch das Gradientenproblem, warum dann Skip Connections? | Der Zusammenhang kommt nicht vor. Orthogonal erscheint nur bei Muon und in der linearen Algebra. Sonnet lehnte ab. | `rnn` erklärt Residual Connections; `hintergrundwissen-lineare-algebra` zeigt, dass orthogonale Matrizen Längen erhalten. | Die Idee stimmt für ein lineares Netz. Die Aktivierungsfunktion zerstört sie, und das Training hält die Matrix nicht orthogonal; eine Skip Connection gibt der Ableitung dagegen immer einen Summanden 1 (Saxe et al. 2014 zur Initialisierung, He et al. 2016). |

### Lohnend

| | Frage | Was fehlt | Was schon da ist | Vorschlag |
|---|---|---|---|---|
| **s02** | Geht beim Normalisieren nicht Information verloren? | Warum man bei Embeddings die Länge ignoriert und wann sie etwas trägt. Haiku füllte das mit eigenem Wissen. | `hintergrundwissen-lineare-algebra`: Zerlegung in Richtung und Länge, „unabhängig von den Längen“. | Bei word2vec hängt die Länge mit der Häufigkeit des Worts zusammen, die Richtung mit der Bedeutung (Schakel, Wilson 2015). Ein Satz dazu reicht. |
| **s20** ★ | word2vec auf Audio: Was wären die Wörter? | Nichts zu Audio als Token-Folge. | `representation-learning-graphen` nennt das Spektrogramm als Feature Engineering. | wav2vec 2.0 (Baevski et al. 2020): kurze Fenster, quantisiert zu diskreten Einheiten, der Kontext sagt fehlende Stücke voraus. |
| **s13** | Was passiert, wenn man `zero_grad` vergisst? | Die Wirkung aufs Training und die absichtliche Nutzung. Zu Gradient Accumulation null Treffer. | `autograd-berechnungsgraph`: „sonst akkumuliert PyTorch sie“. | Vergessen heißt: Der Schritt läuft auf der Summe aller bisherigen Gradienten, Updates werden immer größer. Absichtlich: mehrere Mini-Batches sammeln, um eine große Batch Size zu simulieren. |
| **s14** | Wie merke ich, dass ReLU-Neuronen gestorben sind? | Die Diagnose. Die Frage heißt „wie merke ich“, das Skript erklärt nur, was passiert. | `aktivierungsfunktionen` § sterbende Neuronen, mit zwei Lösungen. | Den Anteil der Neuronen messen, die über einen ganzen Batch nur 0 liefern, ein Forward Hook genügt. |
| **s22** | Warum verließ man sich so lange auf BLEU? | Schwächen und Alternativen. | `transformer` definiert BLEU sauber. | Keine Synonyme, Korrelation mit Menschen begrenzt (Callison-Burch et al. 2006). Heute COMET oder BERTScore. Zwei Sätze. |
| **s28** ★ | Warum lernt der Schüler besser aus weichen Zielen? | Warum im Loss ein Faktor $T^2$ steht. Er kommt ohne Erklärung. | `destillation` § Dark Knowledge erklärt das Prinzip gut. | Die Gradienten der weichen Ziele skalieren mit $1/T^2$, der Faktor gleicht das aus (Hinton et al. 2015). Ein Satz. |
| **s25** ★ | Muss der Generator auf einem Autoencoder aufbauen? | Wie gut es ohne Vortraining geht. | `gans`: „optionales Pretraining“. | Klar sagen, dass der Standard zufällig startet und Vortraining die Ausnahme ist. |

## Steht im Skript, die Suche hat es nicht geliefert

Hier ist nicht das Skript zu ergänzen, sondern **die Antwort falsch oder unvollständig**. Vier von fünf stammen aus dem Hörsaal.

| | Frage | Antworten sagen | Dabei steht es in | Modell sah es |
|---|---|---|---|---|
| **s19** ★ | Warum Summieren statt Aneinanderhängen? | „offen“, zwei Modelle; „nur teilweise“, eines | `rnn` § Am Rande: Konkatenieren vs. Summe, ein eigener Abschnitt | nein |
| **s10** ★ | Minimiert das Perzeptron implizit einen Loss? | „lassen die Passagen offen“ | `gradientenabstieg` § Zurück zum Perzeptron: Perceptron Loss, „erklärt auch die Perzeptronregel“ | nein |
| **s04** ★ | Ist ein CNN ein MLP? | „offen“, zwei Modelle | `faltung-cnn`: Faltung als „Matrix, nur eine sehr spezielle mit vielen Nullen“; ebenso `glossar` | nein |
| **s05** ★ | Was passiert bei nicht linear trennbaren Daten? | „offen“, zwei Modelle | `glossar`: „sonst terminiert sie nie“; Konvergenzbeweis in `perzeptron-trainieren` | teilweise |
| **s09** | Warum nicht linear und abschneiden? | „offen“, ein Modell | `was-ist-deep-learning`: lineare Regression mit der Klasse als Ziel, teilweise | nein |

Drei Dinge folgen daraus. Die Antworten stehen so auf der Site. In der Moderation lässt sich der Text ändern, ein neues Zitat
aber nicht hinzufügen, das verbietet I4 zu Recht. Und der zweite Anlauf mit ganzen Kapiteln läuft nur bei `kein_beleg`, nicht
bei Teilantworten. Das `glossar` trifft oft, wird aber selten ausgewählt.

## Fehlalarm

Kein Handlungsbedarf: s06 (`device=0` steht im Skript, das Modell sah es), s07 (Tensoren sind ausführlich behandelt), s18 (nur
Zitat „lässt sich nicht ableiten“), s23 (Formel steht in `faltung-cnn`), s24 (Richtung der Temperatur steht da, gefragt war
keine Grenzwertrechnung), s26 (Gleichstand zweier Abstände), s27 (Wahl des LLM, nebensächlich).

## Wiederholen

Nach einem Umbau des Skripts oder neuen Antworten:

```bash
node research/2026-11-05-skriptluecken/pruefen.mjs /media/konrad/xtraspace/hainrich2/work/phase1
```

Die Kandidaten in `kandidaten.json` sind von Hand gesetzt, das Einstufen ist Lesearbeit. Der automatische Lückenbericht aus Plan
D9 kommt mit Phase 5.
