# hAInrich2

Frage-Antwort-Forum zum Skript „Einführung in Deep Learning“ auf dem eigenen VPS: statisches Lesen,
Schreiben mit Kurscode, Freigabe durch Moderation, Bot-Antworten über die Claude API mit wörtlichem
Skriptzitat. Verantwortlich ist Konrad Völkel privat, nicht die HHU.

Cross-Projekt-Regeln stehen in `~/files/work/PLAYBOOK.md`. §5 ist die Startliste für dieses Repo.

## Dokumente

| Datei | Aufgabe |
|---|---|
| `DEVELOPMENT_PLAN.md` | Entscheidungen, Invarianten, Architektur, Phasen, Messungen. Stabile Abschnittsnummern. |
| `STATUS.md` | Was existiert, was geprüft ist, was nicht. Gleicher Commit wie die Arbeit. |
| `research/` | Datierte Messungen mit Skripten. |

## Befehle

```bash
npm test
```

```bash
node tools/review.mjs
```

Echte API-Läufe brauchen den Key in einer Subshell und laufen durch `lib/budget.js`:

```bash
( set -a; . ~/.config/hainrich2/anthropic.env; set +a; node tools/try-answers.mjs <arbeitsverzeichnis> claude-opus-5-5 -- "Frage" )
```

Arbeitsdaten liegen unter `/media/konrad/xtraspace/hainrich2/work/phase1/`.

## Was beißt

1. **Der Kurscode steht nirgends in diesem Repo, in keiner Memory und keinem Client-Bundle.** Nur ein
   Hash im Vault des Server-Repos.
2. **Unfreigegebener Text erreicht nie die Claude API.** Jede Abkürzung bricht die Grundlage der
   Datenschutz-Entscheidung (Plan §3 I1, §11.3). Auch der Richter läuft erst nach der Freigabe.
3. **Kosinus entscheidet nichts.** Embeddings liefern Kandidaten; entscheiden dürfen nur ein Klick,
   die Moderation oder der Richter (Plan §19).
4. **Der VPS gehört `~/files/work/server`.** Hier liegen keine Playbooks. DNS, Caddy, Units und jeder
   Deploy brauchen die Zustimmung des Eigentümers; erst DNS, dann Caddy.
5. **Rechtstexte und Technik gehen am selben Tag live.** Autorität ist `~/files/work/RECHTSTEXTE.md`.
6. **Kein Test ruft die echte API.** Echte Aufrufe kosten Geld und brauchen die Zustimmung des
   Eigentümers.
7. **Sciebo:** Das Verzeichnis wird synchronisiert. `node_modules`, Modelle und Datenbanken gehören in
   `.sync-exclude.lst`; große Arbeitsdaten nach `/media/konrad/xtraspace`.
