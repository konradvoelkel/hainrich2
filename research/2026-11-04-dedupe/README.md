# Messung 2026-11-04: Duplikate, Skript-Suche, Antworten mit Zitat

Frage: Reicht ein Vektorvergleich, um Duplikate im Forum zu erkennen, und trägt MiniLM Deutsch?

## Aufbau

- 24 Duplikatpaare, 24 harte Negativpaare (gleiches Vokabular, andere Frage), 6 Paare Deutsch/Englisch,
  alle in `data.py`, von Hand geschrieben und absichtlich schwer.
- 631 Passagen aus `part-*/*.md` des Skripts, im Mittel 532 Zeichen.
- MiniLM: das int8-Modell aus dem hAInrich-Repo über `modules/model.js`, also wie im Browser.
- multilingual-e5-large: aus dem lokalen Cache, nur als Vergleich, 560M Parameter, für den Browser zu
  groß. Lief auf der CPU, weil das Venv kein CUDA hat.
- Richter und Antworten: Ollama 0.24.0, `think: false`, `qwen3.6:27b` und `gemma4:latest` (9,6 GB).

## Ergebnisse

```
== minilm
dupes   median 0.48 min 0.11 max 0.86
hardneg median 0.68 min 0.26 max 0.92
AUC 0.243
EN<->DE same question: median 0.19
Skript search, 48 DE questions, right chapter in top1/3/5: 60% / 75% / 81%
true duplicate in top1/3/5 of 72: 29% / 42% / 58%; unrelated pairs median 0.27, p95 0.43

== e5large
dupes   median 0.91 min 0.76 max 0.98
hardneg median 0.89 min 0.78 max 0.98
AUC 0.562; best-F1 thr 0.86: 21/24 dupes caught, 16/24 wrong merges
EN<->DE same question: median 0.92
Skript search, 48 DE questions, right chapter in top1/3/5: 73% / 94% / 98%
true duplicate in top1/3/5 of 72: 54% / 79% / 92%; unrelated pairs median 0.80, p95 0.85

== Richter, gleiche Paare
qwen3.6:27b   dupes accepted 22/24; wrong merges 0/24; EN-DE accepted 6/6; 0.49 s per pair
gemma4:latest dupes accepted 23/24; wrong merges 0/24; EN-DE accepted 6/6; 0.40 s per pair
```

Die verpassten Duplikate („Was ist ein Berechnungsgraph?“, „Was ist Overfitting und wie erkenne ich
es?“) sind Paare, bei denen eine Seite nur einen Teil der anderen fragt. Ein verpasstes Duplikat kostet
eine Antwort mehr, ein falscher Merge zeigt still eine falsche.

## Antwort-Stichprobe (`answer.py`)

Sieben Fragen, Top 10 Passagen aus e5-large, nur Passagen-IDs statt abgetippter Zitate, rund 2k Tokens
Prompt von 12k möglichen.

- Keine erfundene ID in sechs Antworten mit Beleg.
- `qwen3.6:27b`: korrekt abgelehnt bei Klausur, Übungsaufgabe, Prompt-Injection. Zu Unrecht abgelehnt
  bei MSE gegen Cross-Entropy und RLHF, beides steht im Skript. Antworten meist nur ein Satz.
- `gemma4`: beantwortete die Übungsfrage mit Unsinn, belegte die MSE-Frage mit einer unpassenden Stelle
  und zerstörte LaTeX im JSON-Modus (`\text`, `\bigl` als Tab und Backspace gelesen).

## Grenzen

Klein, von derselben Person geschrieben wie der Richter-Prompt, die Negativpaare sind gezielt gemein.
Die Goldkapitel stammen aus einem Stichwort-Grep. Die Richtung ist belastbar, die einzelne Zahl nicht.
Die Client-Kandidaten aus dem Plan sind hier nicht gemessen.

## Ausführen

Aus diesem Verzeichnis, die Pfade zu Skript und hAInrich stehen fest in den Skripten:

```bash
"$EIDL_VENV/bin/python" data.py
```

```bash
node minilm.mjs
```

```bash
"$EIDL_VENV/bin/python" e5.py
```

```bash
"$EIDL_VENV/bin/python" analyze.py
```

`cand.py` rechnet die Kandidatensuche. `judge.py <modell>` und `answer.py <modell>…` brauchen einen
laufenden Ollama-Server.
