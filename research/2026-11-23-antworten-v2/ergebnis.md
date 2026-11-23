# Messung Prompt-Version 2, claude-opus-5-5, Korpus korpus-2026-11-15b
Kosten: 2.086 $ in 103 Buchungen, offen 0

## Beispielfragen 27
Ergebnis nach dem Worker (mit zweitem Anlauf bei kein Beleg): {"antwort":21,"teilantwort":6}
zweiter Anlauf nötig: keiner
Teilantworten: s02, s14, s20, s21, s22, s29
Steuerwort nicht in der letzten Zeile: nie
Soll-Kapitel zitiert: 24 von 27 Antworten; nicht bei s12, s20, s24
Treffer der Suche nach Wendungen: s20 (was fehlt)
Zeichen im Median: 1633

## Grenzfälle
- g1: erwartet kein_beleg, bekommen kein_beleg (nach zweitem Anlauf)
- g2: erwartet kein_beleg, bekommen kein_beleg (nach zweitem Anlauf)
- g3: erwartet kein_beleg oder teilantwort, bekommen teilantwort
- g4: erwartet teilantwort, bekommen teilantwort
- g5: erwartet teilantwort, bekommen teilantwort
- g6: erwartet teilantwort, bekommen teilantwort
- g7: erwartet antwort auf Englisch, bekommen antwort
- g8: erwartet kein_beleg, bekommen kein_beleg (nach zweitem Anlauf)

## Zum Vergleich: Opus 5.5 mit Prompt-Version 1 (Phase 1), dieselben Fragen
Treffer der Suche nach Wendungen: 14 von 27: s16 (was fehlt); s18 (über das Skript, was fehlt); s14 (über das Skript, was fehlt); s25 (über das Skript, was fehlt); s02 (über das Skript, was fehlt); s20 (über das Skript, was fehlt); s29 (über das Skript, was fehlt); s13 (über das Skript, was fehlt); s12 (über das Skript, was fehlt); s22 (über das Skript, was fehlt); s04 (was fehlt); s26 (über das Skript, was fehlt); s15 (über das Skript); s21 (über das Skript, was fehlt, Verweis)

## Kurztitel
verworfen (zu lang oder leer): s02 (0 Zeichen), s03 (0 Zeichen), s04 (0 Zeichen), s06 (0 Zeichen), s07 (0 Zeichen), s11 (0 Zeichen), s14 (0 Zeichen), s28 (0 Zeichen) von 27
Länge: 39 bis 50 Zeichen, Median 44
- s01: Lernrate: Parameter oder Hyperparameter?  |  heute: Parameter oder Hyperparameter: Was ist die Lernrate?
- s02: (verworfen: )  |  heute: Warum normalisiert man Vektoren vor dem Vergleich?
- s03: (verworfen: )  |  heute: Gradient und Richtungsableitung: Vektor oder Zahl?
- s04: (verworfen: )  |  heute: Ist jedes neuronale Netz ein MLP?
- s05: Perzeptron-Lernregel: Warum verbessert das Update?  |  heute: Perzeptron-Lernregel: Warum verbessert das Update?
- s06: (verworfen: )  |  heute: Hugging-Face-Pipeline: device für die GPU angeben
- s07: (verworfen: )  |  heute: PyTorch-Tensoren und Tensoren der Mathematik
- s08: Softmax mit zwei Klassen gleich Sigmoid?  |  heute: Softmax mit zwei Klassen: dasselbe wie Sigmoid?
- s09: Logit: Warum Log-Odds statt Wahrscheinlichkeit?  |  heute: Log-Odds: Warum linear statt Wahrscheinlichkeit?
- s10: Likelihood über Datensatz: Summe der Losses?  |  heute: Likelihood eines Datensatzes: Produkt wird Summe?
- s11: (verworfen: )  |  heute: SGD: Loss steigt zwischen Mini-Batches. Normal?
- s12: Backpropagation: Warum rückwärts statt vorwärts?  |  heute: Backpropagation: Warum rückwärts statt vorwärts?
- s13: zero_grad: Warum nötig, was wenn vergessen?  |  heute: optimizer.zero_grad(): Warum vor jedem Schritt?
- s14: (verworfen: )  |  heute: Tote ReLU-Neuronen erkennen: Hilft Leaky ReLU?
- s15: XOR: warum nicht mit einem einzelnen Neuron?  |  heute: XOR: Warum reicht ein einzelnes Neuron nicht?
- s16: Approximationstheorem: Warum dann tiefe Netze?  |  heute: Approximationstheorem: Warum trotzdem tiefe Netze?
- s17: Autoencoder: Warum nicht einfach Identität?  |  heute: Autoencoder: Warum lernt er nicht die Identität?
- s18: Reparametrisierungstrick beim VAE: wozu  |  heute: VAE: Wozu der Reparametrisierungstrick?
- s20: word2vec für Audio: Was sind Wörter, Kontext?  |  heute: word2vec auf Audio: Was sind Wörter und Kontext?
- s21: Skip Connections statt orthogonaler Matrizen?  |  heute: Orthogonale Matrizen oder Skip Connections?
- s22: BLEU: Warum so lange so ein simples Maß?  |  heute: BLEU: Warum so lange ein so simples Maß?
- s23: Conv2d: Ausgabegröße mit Padding und Stride?  |  heute: Conv2d: Ausgabegröße mit Padding und Stride
- s24: Softmax-Temperatur: Logits durch T teilen?  |  heute: Temperatur bei Softmax: Logits durch T teilen?
- s25: GAN-Generator: Autoencoder-Decoder nötig?  |  heute: GAN: Braucht der Generator einen Decoder als Start?
- s26: Token für 0,5·Katze + 0,5·Hund dekodieren?  |  heute: Mischung aus Katze und Hund dekodieren: Was kommt?
- s28: (verworfen: )  |  heute: Destillation: Warum weiche statt harter Labels?
- s29: SGD vs. Adam: Warum generalisiert SGD besser?  |  heute: SGD oder Adam: Was generalisiert besser, und warum?

## Kurztitel mit max_tokens 2000
Ergebnis: 27 von 27 mit Titel; Abbruch: {"end_turn":27} ; verworfen: keiner
Länge: 39 bis 50 Zeichen; Ausgabe-Tokens 22 bis 577 , Median 179
- s01: Hyperparameter vs. Parameter: Lernrate?  |  heute: Parameter oder Hyperparameter: Was ist die Lernrate?
- s02: Vektoren normalisieren – Länge verloren?  |  heute: Warum normalisiert man Vektoren vor dem Vergleich?
- s03: Gradient vs. Richtungsableitung: Unterschied?  |  heute: Gradient und Richtungsableitung: Vektor oder Zahl?
- s04: MLP gleich neuronales Netz oder nur ein Typ?  |  heute: Ist jedes neuronale Netz ein MLP?
- s05: Perzeptron-Lernregel: Warum verbessert das Update?  |  heute: Perzeptron-Lernregel: Warum verbessert das Update?
- s06: device in Hugging-Face-Pipeline angeben?  |  heute: Hugging-Face-Pipeline: device für die GPU angeben
- s07: Tensoren in PyTorch: echt mathematisch?  |  heute: PyTorch-Tensoren und Tensoren der Mathematik
- s08: Softmax mit zwei Klassen gleich Sigmoid?  |  heute: Softmax mit zwei Klassen: dasselbe wie Sigmoid?
- s09: Logarithmus der Odds statt Wahrscheinlichkeit  |  heute: Log-Odds: Warum linear statt Wahrscheinlichkeit?
- s10: Likelihoods im Datensatz: Summe der Losses?  |  heute: Likelihood eines Datensatzes: Produkt wird Summe?
- s11: SGD: Loss steigt pro Mini-Batch, normal?  |  heute: SGD: Loss steigt zwischen Mini-Batches. Normal?
- s12: Ableitungen: warum rückwärts statt vorwärts?  |  heute: Backpropagation: Warum rückwärts statt vorwärts?
- s13: zero_grad: Warum nötig, was wenn vergessen?  |  heute: optimizer.zero_grad(): Warum vor jedem Schritt?
- s14: ReLU-Neuronen tot erkennen, hilft Leaky ReLU?  |  heute: Tote ReLU-Neuronen erkennen: Hilft Leaky ReLU?
- s15: XOR: Warum nicht mit einem einzelnen Neuron?  |  heute: XOR: Warum reicht ein einzelnes Neuron nicht?
- s16: Approximationstheorem: wozu tiefe Netze?  |  heute: Approximationstheorem: Warum trotzdem tiefe Netze?
- s17: Autoencoder: Warum nicht einfach Identität?  |  heute: Autoencoder: Warum lernt er nicht die Identität?
- s18: Reparametrisierungstrick beim VAE: wozu?  |  heute: VAE: Wozu der Reparametrisierungstrick?
- s20: word2vec auf Audio: Was sind Wörter und Kontext  |  heute: word2vec auf Audio: Was sind Wörter und Kontext?
- s21: Skip Connections statt orthogonaler Matrizen?  |  heute: Orthogonale Matrizen oder Skip Connections?
- s22: BLEU nur n-Gramme: warum so lange genutzt?  |  heute: BLEU: Warum so lange ein so simples Maß?
- s23: Conv2d: Ausgabegröße mit Padding und Stride?  |  heute: Conv2d: Ausgabegröße mit Padding und Stride
- s24: Softmax-Temperatur: Logits durch T teilen?  |  heute: Temperatur bei Softmax: Logits durch T teilen?
- s25: GAN-Generator: Decoder nötig oder zufällig?  |  heute: GAN: Braucht der Generator einen Decoder als Start?
- s26: Token für Mischung 0,5·Katze + 0,5·Hund?  |  heute: Mischung aus Katze und Hund dekodieren: Was kommt?
- s28: Destillation: weiche statt harte Labels?  |  heute: Destillation: Warum weiche statt harter Labels?
- s29: SGD vs. Adam: Warum generalisiert SGD besser?  |  heute: SGD oder Adam: Was generalisiert besser, und warum?

## Stufe 2: zweiter Anlauf mit ganzen Kapiteln
- s02: erst teilantwort; dann teilantwort; 1055 → 1381 Zeichen, 4 → 4 Zitate
- s12: erst antwort, Soll-Kapitel fehlt; dann antwort, Soll-Kapitel fehlt; 1693 → 1843 Zeichen, 3 → 3 Zitate
- s14: erst teilantwort; dann teilantwort; 1465 → 1249 Zeichen, 4 → 2 Zitate
- s20: erst teilantwort, Soll-Kapitel fehlt; dann teilantwort, Soll-Kapitel fehlt; 1739 → 1511 Zeichen, 7 → 6 Zitate
- s21: erst teilantwort; dann teilantwort; 1420 → 1600 Zeichen, 3 → 5 Zitate
- s22: erst teilantwort; dann teilantwort; 1731 → 1526 Zeichen, 4 → 4 Zitate
- s29: erst teilantwort; dann kein_beleg, Soll-Kapitel fehlt; 992 → 0 Zeichen, 3 → 0 Zitate
- g3: erst teilantwort; dann teilantwort; 1172 → 948 Zeichen, 4 → 2 Zitate
- g4: erst teilantwort; dann teilantwort; 1433 → 1235 Zeichen, 4 → 3 Zitate
- g5: erst teilantwort; dann teilantwort; 1570 → 1691 Zeichen, 3 → 3 Zitate
- g6: erst teilantwort; dann teilantwort; 1478 → 1346 Zeichen, 5 → 4 Zitate
vollständig im zweiten Anlauf: 1 von 11
Soll-Kapitel zitiert, erst / dann: 8 / 7
