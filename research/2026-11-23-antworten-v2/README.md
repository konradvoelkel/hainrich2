# Prompt-Version 2, Kurztitel und der zweite Anlauf bei Teilantworten

_Gemessen am 2026-11-23, auf Konrads Wort („Ja, so messen“, 5 $ freigegeben; Plan D52, TODO E13 und E14). Kosten 2,09 $._

## Frage

1. **E14:** Hält sich Prompt-Version 2 (`lib/answer.js`) an das, was sie verbietet? Keine Aussagen darüber, was im Skript steht oder
   fehlt, keine Aufzählung des Fehlenden, keine Verweise auf Vorlesung, Sprechstunde oder Literatur. Steht `TEILANTWORT`, wo die Passagen
   nur einen Teil beantworten, und `KEIN_BELEG`, wo sie nichts beantworten? Kein echter Lauf hatte das bisher gezeigt; Version 1 war der
   Grund, warum Konrad am 05.11. in 13 von 14 Bearbeitungen einen Absatz strich.
2. **Kurztitel:** Die Anweisung aus Plan D31 lief bisher nur gegen Attrappen.
3. **E13:** Wird eine Teilantwort vollständiger, wenn Claude die zwei besten ganzen Kapitel bekommt, wie heute schon nach „kein Beleg“?

## Aufbau

- Modell und Einstellungen wie im Worker: `claude-opus-5-5`, `effort: medium`, `max_tokens: 8000`, Prompt-Version 2, der Korpus hinter
  `work/korpus-aktuell` (`korpus-2026-11-15b`). Als Batch zum halben Preis; das Verhalten des Modells ist dasselbe.
- **Fragen:** die 27 Beispielfragen aus `seeds/fragen.json`, jede mit ihrem Soll-Kapitel, und acht Grenzfälle
  ([`grenzfaelle.json`](grenzfaelle.json)): zwei organisatorische, eine fast ohne Grundlage im Skript (Diffusionsmodelle), drei halb im
  Skript (JAX, Lernrate für 7 Milliarden Parameter, Mamba; geprüft: keins der drei Wörter steht im Korpus), eine englische, ein Versuch,
  das Modell umzusteuern. Keine Frage von Studierenden, nichts ging an den Server, keine öffentliche Antwort wurde ersetzt.
- **Stufe 1:** 35 Antworten und 27 Kurztitel, nach „kein Beleg“ der zweite Anlauf wie im Worker. **Stufe 2:** der zweite Anlauf mit
  ganzen Kapiteln für jede Teilantwort und s12 (bekannte Spur: Die nötige Passage lag bei der Suche auf Platz 41), dazu die Kurztitel
  noch einmal mit mehr Raum.
- **Werkzeug:** [`tools/messung-v2.mjs`](../../tools/messung-v2.mjs) mit [`tools/messbatch.mjs`](../../tools/messbatch.mjs). Jeder Batch
  steht mit seinem schlimmsten Fall im Kostenbuch, bevor er hinausgeht (Plan D26); `tools/answer-seeds.mjs` buchte erst danach.
  `test/messbatch.test.mjs` prüft das mit einer Attrappe, auch zwei Batches gleichzeitig. Eigenes Kostenbuch mit Deckel 5 $.
- **Auswertung:** [`auswertung.mjs`](auswertung.mjs), Ausgabe in [`ergebnis.md`](ergebnis.md). Die Suche nach verbotenen Wendungen ist
  ein Hinweis zum Lesen, kein Urteil. Zum Vergleich läuft dieselbe Suche über die Antworten von Opus 5.5 mit Prompt-Version 1 aus Phase 1.

## Ergebnis

### E14: Prompt-Version 2 hält

| | Version 1 (Phase 1) | Version 2 |
|---|---|---|
| Treffer der Suche nach verbotenen Wendungen, Beispielfragen | 14 von 27 | 1 von 27 |
| Antworten / Teilantworten / kein Beleg | 27 / – / 0 | 21 / 6 / 0 |
| Soll-Kapitel zitiert | – | 24 von 27 (nicht s12, s20, s24) |
| `TEILANTWORT` in der letzten Zeile | – | immer |
| längste Antwort | – | 1611 von 8000 Tokens |

Der eine Treffer ist s20 mit dem ersten Satz „Ganz direkt lässt sich das hier nicht beantworten.“ Das sagt nichts darüber, was im
Skript steht, ist aber eine Einschränkung am Anfang, wie sie das SEO-Audit vom 17.11. an s20 und s29 bemängelte. Teilantworten melden
s02, s14, s20, s21, s22 und s29.

**Grenzfälle, alle acht wie erwartet:** Klausurtermin, Übungsaufgabe und der Umsteuer-Versuch enden auch nach dem zweiten Anlauf mit
„kein Beleg“. Diffusion, JAX, die Lernrate für das große Modell und Mamba ergeben Teilantworten, ohne dass die Antwort sagt, was
fehlt. Die englische Frage bekommt eine englische Antwort.

### Kurztitel: 8 von 27 kamen leer zurück

Opus 5.5 denkt auch bei `effort: low` nach, und das Denken lässt sich bei diesem Modell nicht abschalten (`thinking: {type: "disabled"}`
gibt einen 400). Mit `max_tokens: 200` aus `buildTitleRequest` endeten 8 von 27 Aufrufen mit `stop_reason: max_tokens` und nur einem
Denkblock; parseTitle gibt dann `null`, und die Frage bekommt im Betrieb still keinen Vorschlag. Sieben Titel kamen ohne Nachdenken aus
(22 bis 30 Tokens), zwölf brauchten 120 bis 194.

**Mit `max_tokens: 2000`:** 27 von 27 mit Titel, alle `end_turn`, 22 bis 577 Tokens (Median 179), 39 bis 50 Zeichen, keiner verworfen.
Bezahlt wird nur, was erzeugt wird, im Median rund ein halber Cent synchron. Die Buchung vorab im Worker (`WORST_CASE_TITEL`) deckte
mit 0,05 $ die 2000 Tokens bei Opus 5.5, nicht aber bei den teureren Modellen im Kostenbuch; sie steigt auf 0,06 $, ein Test hält das fest. Die Titel lesen sich wie die vorhandenen aus `seeds/kurztitel.json`,
einige knapper; die Liste steht in `ergebnis.md`.

### E13: Ganze Kapitel machen Teilantworten nicht vollständig

| | erster Anlauf | mit zwei ganzen Kapiteln |
|---|---|---|
| vollständig, von 10 Teilantworten | – | 0 |
| zu „kein Beleg“ geworden | – | 1 (s29) |
| Soll-Kapitel zitiert, von 11 | 8 | 7 |

s12 bleibt in beiden Anläufen ohne das Soll-Kapitel: Auch die Auswahl der ganzen Kapitel richtet sich nach der Suche, die die Passage
nicht findet. Bei den vier Grenzfällen mit Teilantwort erfindet der zweite Anlauf das Fehlende nicht, er bleibt Teilantwort.

## Was daraus folgt

1. **Prompt-Version 2 bleibt.** Eine Version 3 ist nicht nötig; ob Konrad den Einstieg von s20 so stehen lässt, entscheidet er beim Lesen.
2. **Kurztitel: `max_tokens` von 200 auf 2000** in `buildTitleRequest`, die Buchung vorab auf 0,06 $. Gebaut auf Konrads Wort („Ja,
   bauen“), mit Test; am Host erst mit dem nächsten Ausspielen der App. Die Moderation nennt jetzt „rund einen halben Cent“ statt
   „unter einem Cent“: Gemessen sind im Median ein halber, höchstens gut ein Cent.
3. **E13 nicht bauen.** Ein zweiter Anlauf je Teilantwort kostete im Betrieb rund 12 Cent und eine der 50 Anfragen am Tag, ohne dass eine
   Antwort vollständig würde. Die Lücke liegt in der Suche, nicht in der Menge der Passagen.

## Nicht geprüft

- **Die Güte der Antworten durch Menschen.** Zum Lesen für Konrad liegen lokal, nicht im Repo, die Antwort mit Treffer und alle Grenzfälle
  sowie zehn Paare aus Stufe 2 ohne Kennzeichnung; die Zuordnung steht getrennt im Arbeitsverzeichnis.
- **Streuung:** Jede Frage lief einmal. Ob s20 oder die leeren Kurztitel bei einer Wiederholung anders ausfallen, ist nicht gemessen.
- **Der Korpus ist vom 15.11.,** das Skript ist inzwischen weiter (TODO, Skriptstand). Das trifft beide Anläufe gleich.
