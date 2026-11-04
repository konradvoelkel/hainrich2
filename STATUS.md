# Status

_Stand 2026-11-04._

## Was existiert

- Git-Repo auf `main`, Remote `origin` ist das private `konradvoelkel/hainrich2` auf GitHub.
- `DEVELOPMENT_PLAN.md`, `CLAUDE.md`, dieses Dokument.
- `research/2026-11-04-dedupe/`: Messskripte und Ergebnisse zu Duplikaterkennung, Skript-Suche und
  Antworten mit lokalen Modellen.

## Was nicht existiert

- Kein Anwendungscode, keine Rolle im Server-Repo, kein Hostname, keine Rechtstexte.

## Nicht geprüft

- Alle Client-Kandidaten aus Plan §6.1. Gemessen sind bisher nur MiniLM und multilingual-e5-large.
- Claude als Richter und als Antwortgeber, Citations mit Opus 5.5.
- Text-Fragmente auf den MyST-Seiten.
- Die Größenangaben für geschnittene Modelle sind Schätzungen.

## Nächster Schritt

Phase 0 aus dem Plan. Sie braucht rund 270 MB Modell-Downloads von Hugging Face (zwei int8-Modelle
samt Tokenizer), für den Vokabelschnitt des Siegers weitere 470 MB und für den Richter einen API-Key.
