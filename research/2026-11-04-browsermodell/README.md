# Messung 2026-11-04: Welches Modell läuft im Browser?

Frage: Welches Embedding-Modell trägt Deutsch im Browser, möglichst in 30 MB, höchstens 135 MB?

Ergebnis: `multilingual-e5-small`, Vokabular auf 16.384 Tokens geschnitten. 29,4 MB, gleiche Qualität
wie ungeschnitten, 89 ms je Anfrage bei vierfacher CPU-Drosselung.

## Aufbau

- Testset: das Set aus `../2026-11-04-dedupe/` plus `extend.py`, zusammen 50 Duplikatpaare, 50
  Negativpaare, 10 Paare Deutsch/Englisch, alle Teile des Skripts. Von Hand geschrieben, absichtlich
  schwer, mit Goldkapiteln aus einem Stichwort-Grep.
- Bestand: 150 Fragen. Die meisten sind die Negativpaare, also gezielt verwechselbar. Ein echtes Forum
  dürfte freundlicher sein, das ist aber nicht gemessen.
- Skript-Suche: 100 Anfragen gegen 631 Passagen, zählt als Treffer ein Goldkapitel unter den Top k.
- Modelle: int8 über transformers.js wie im Browser, `dtype: 'q8'`. e5-large nur als Vergleich.
- Basismodelle, Hugging-Face-Revisionen: `Xenova/multilingual-e5-small`
  `761b726dd34fb83930e26aab4e9ac3899aa1fa78`, `Xenova/paraphrase-multilingual-MiniLM-L12-v2`
  `2c4055b12046f11709e9df2c122e59ffbdc2f900`.

## Ergebnisse

```
Modell            Dupl.  Neg.   AUC  Dup Top1     Dup Top5 (95%)  Kap Top1     Kap Top3 (95%) Kap Top5  DE/EN cos
MiniLM             0.39  0.64  0.20       14%      32% [21%-46%]       57%      72% [63%-80%]      80%       0.31
paraphrase         0.49  0.63  0.35       22%      48% [35%-61%]       53%      69% [59%-77%]      79%       0.83
e5-small           0.87  0.89  0.36       32%      64% [50%-76%]       80%      92% [85%-96%]      98%       0.91
e5-small, Schnitt  0.87  0.89  0.36       30%      62% [48%-74%]       80%      92% [85%-96%]      98%       0.91
e5-large           0.88  0.90  0.40       32%      70% [56%-81%]       79%      95% [89%-98%]      98%       0.93
```

Kein Modell trennt Duplikate von Negativpaaren per Kosinus (AUC unter 0,5), auch e5-large nicht. Das
bestätigt die erste Messung auf dem doppelten Set.

### Duplikate über das Skript finden (`cand2.py`, e5-small)

Jede Frage bekommt ein Profil aus den 20 ähnlichsten Passagen. Rang aus z-normiertem Kosinus plus
doppelt gewichteter Profilähnlichkeit.

```
nur Kosinus           Top1=32% Top3=54% Top5=64% Top10=70% Top20=80%
Kosinus+2*Profil k=20 Top1=32% Top3=60% Top5=80% Top10=88% Top20=92%
```

Gewicht und k sind auf diesem Set gewählt. Der Gewinn ist über das Raster stabil (Top 5 zwischen 72
und 80 % für k=20), die 80 % sind aber eher optimistisch.

### Der Schnitt (`trim.py`, `parity.py`)

- Tabelle `embeddings.word_embeddings.weight_quantized`, 250.037 × 384, uint8, 96 MB von 118 MB. Sie
  wird im ONNX zeilenweise geschnitten, dazu der Tokenizer. Der Gather läuft auf den int8-Werten, im
  Speicher entsteht also keine fp32-Tabelle.
- Korpus für die Auswahl: Skript, Transkripte 2025/26, ds-skript, eipy-skript, Understanding Deep
  Learning, die hAInrich-Korpora, eine englische Wortliste. Das Testset gehört nicht dazu.
- 16.384 Tokens: 6.734 aus dem Skript, 8.464 aus dem übrigen Korpus, der Rest Spezialtokens und
  Einzelzeichen. Eine deutsche Wortliste lag auf dem Rechner nicht vor.

```
Fragen gleich tokenisiert 93.1%, <unk> in 0, cos Basis/Schnitt min 0.8839 median 1.0000
Passagen gleich tokenisiert 99.8%, cos min 0.9984 median 1.0000
```

Der schlechteste Fall ist „Teacher-Modell“: `Teacher` steht nicht im Skript und zerfällt in Stücke. Ohne
den Vorrang der Skript-Tokens lag der Wert für Passagen bei 40,1 %, die Kennzahlen blieben trotzdem im
Rauschen. 21.000 Tokens brachten keinen messbaren Gewinn und liegen über 30 MB.

Dateien, nicht im Repo: `$HAINRICH2_DATEN/models/trim/e5s-16384/`

```
f37dfa6645b390114197d006274c4f330a71b12c973f55194f64a301aaef20d4  onnx/model_quantized.onnx (28.585.433 Byte, gzip 21.027.577)
a7b955b5cb8d67f95542125b44e791248280deab367f8f4fa7da6eb4866a68f4  tokenizer.json (824.125 Byte, gzip 357.861)
```

`keep-ids-16384.txt` enthält die behaltenen Token-IDs des Basismodells, damit der Schnitt ohne die
privaten Korpustexte wiederholbar ist. Lizenz: MIT wie das Basismodell, der Hinweis gehört in die
Herkunftsdatei des Projekts.

### Latenz (`latency.mjs`, Headless-Chromium, WASM, Modell im Hauptthread)

```
Modell                         Threads Drossel  Laden  Median  p95  Passage
Xenova/all-MiniLM-L6-v2              1      1x    856      17   25       53
Xenova/all-MiniLM-L6-v2              1      4x   2482      67   92      227
e5s-16384                            1      1x   1012      31   41       73
e5s-16384                            1      4x   2665      89  112      211
e5s-16384                            1      6x   2828     139  177      322
e5s-16384                            4      1x    567      11   13       24
Xenova/multilingual-e5-small         1      1x   1306      17   23       41
Xenova/multilingual-e5-small         1      4x   4925      85  105      197
```

Millisekunden, 40 deutsche Fragen, lokaler Server, also ohne Netz. Die CPU-Drosselung per CDP ist nur
eine Näherung für ein Telefon. Die Unterschiede zwischen den Läufen ohne Drosselung sind Rauschen,
ein geschnittenes Modell rechnet nicht langsamer. Am ehesten spart der Schnitt Ladezeit.

### Browser gegen Node (`dump.mjs`, `mixed.py`)

Native Runtime und WASM rechnen int8 leicht anders: Kosinus Fragen im Median 0,9999, minimal 0,9952,
Passagen im Median 0,9986. Weil e5 die Treffer eng zusammenlegt, ist das die Mischung aus dem Betrieb:

```
alles Node                    Kapitel Top3 92% Top5 98% | Duplikat Kosinus Top5 62% | mit Profil Top5 80% Top10 88% Top20 92%
Anfrage Browser, Bestand Node Kapitel Top3 92% Top5 98% | Duplikat Kosinus Top5 60% | mit Profil Top5 74% Top10 88% Top20 92%
alles Browser                 Kapitel Top3 93% Top5 98% | Duplikat Kosinus Top5 60% | mit Profil Top5 76% Top10 84% Top20 92%
```

### Haiku als Richter (`cases.py`, `judge_claude.mjs`, `judge_confirm.mjs`)

`claude-haiku-5-5`, Aufwand `low`, strukturierte Ausgabe, SDK 1.4.0. 210 Aufrufe plus 25 Bestätigungen,
2,3 Cent, rund 230 ms je Aufruf bei sechs parallelen. Kandidaten aus den Node-Vektoren des Schnitts,
das echte Duplikat ist bei 46 von 50 Fragen unter den Top 20.

```
Einzelpaare: Duplikate 37/50, falsche Zusammenlegungen 0/50, DE/EN 10/10
Top 20, Liste: das erwartete Duplikat 32/50, nichts gewählt 14, anderes gewählt 4
Top 20, Liste, Negativfragen: 17/50 mit Treffer
Bestätigung als Einzelpaar: 28 der 32 erwarteten Treffer bleiben
```

Von den 4 „anderes gewählt“ sind alle echte Duplikate, die das Set unbeabsichtigt enthält. Die 17
Treffer bei Negativfragen, von Hand gelesen:

- 2 klar falsch: L1- mit L2-Regularisierung, „Wie berechne ich den Gradienten der Cross-Entropy?“ mit
  „Was ist Cross-Entropy?“. Beide lehnt die Bestätigung ab.
- 3 strittig: ReLU gegen Sigmoid, Self-Attention, Student-Modell. Alle drei lehnt die Bestätigung ab.
- 12 echte oder sehr nahe Duplikate; davon lehnt die Bestätigung 2 ab (GNN, GPU).

Ergebnis: Liste plus Bestätigung erkennt 32 von 50 Duplikaten automatisch (28 erwartete und 4 andere
echte), ohne klar falsche Zusammenlegung. Die Einordnung stammt von mir, nicht von einer zweiten Person.

Abnahmewerte aus Phase 0: Kapitel in den Top 3 erreicht, Latenz erreicht, Duplikat in den Top 5 (85 %)
nicht erreicht.

## Grenzen

Kleines, selbst geschriebenes Set, 50 Paare, ein Punkt sind 2 %. Kein echtes Telefon, keine echte
Studierendenfrage. Der Bestand ist gezielt verwechselbar. Die Kapitel-Treffer zählen das Kapitel, nicht
die Passage.

## Ausführen

Arbeitsverzeichnis `$HAINRICH2_DATEN/work`, Modelle unter `../models`. Reihenfolge:
`data.py` aus der ersten Messung, `extend.py set.json set2.json`, `embed.mjs` je Modell, `analyze2.py`,
`cand2.py`, `trim.py`, `parity.py`, dann aus `hainrich/tools` heraus `latency.mjs` und `dump.mjs` mit
`mixed.py`.
