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
| `.claude/TODO.md` | Übergabe und offene Punkte in Reihenfolge. Lokal, nicht im Repo. Für neue Sitzungen zuerst. |

## Befehle

```bash
npm test
```

Die Review-Seite des Blindvergleichs auf Port 8770, kein Prüfer: Sie zeigt die Antworten aus Phase 1 ohne Modellnamen, die Bewertungen
landen in `seeds/bewertung.json`:

```bash
node tools/review.mjs
```

Ob sich das veröffentlichte Skript seit dem Korpus geändert hat und welche Antworten Wortlaut zitieren, den es nicht mehr gibt:

```bash
node tools/skriptstand.mjs
```

Den Stand der Beispielfragen vom Server holen (liest nur), die Site daraus bauen, dann gegen den fertigen Baum testen. Was ausgespielt
wird, trägt die drei Schalter `--stimmen --fragen --release`. Die Vorschau ist seit dem 2026-11-17 beendet (Plan D45); ein Bau ohne
`--release` brächte Banner und `noindex` auf die statischen Seiten zurück:

```bash
site/stand-holen.sh
```

```bash
( . ./.env.local; node site/build.mjs --stand "$HAINRICH2_DATEN/work/stand-vom-host.json" --stimmen --fragen --release )
```

Ohne `--stand` nimmt `--modell <id>` die Antworten aus Phase 1, wie das Modell sie schrieb, alle als ungeprüft: Die Prüfung steht nur
in `public.db` auf dem Server. Bricht der Bau ab, bleibt der alte Baum liegen, und der Browser-Test läuft grün gegen ihn: erst die
letzte Zeile des Baus lesen, dann testen.

```bash
npm run smoke
```

Mit `SMOKE_URL=https://hai.konradvoelkel.com` läuft er gegen den echten Host, mit `SMOKE_BROWSER=firefox` oder `webkit` in einem anderen Browser. Die Moderation im echten Browser, gegen eine
Wegwerf-Datenbank:

```bash
npm run smoke:mod
```

Ausliefern braucht die Zustimmung des Eigentümers, zuerst immer der Probelauf:

```bash
DRY_RUN=1 site/deploy.sh
```

```bash
DRY_RUN=1 site/deploy-app.sh
```

Echte API-Läufe brauchen den Key in einer Subshell und laufen durch `lib/budget.js`:

```bash
( . ./.env.local; set -a; . "$ANTHROPIC_ENV"; set +a; node tools/try-answers.mjs <arbeitsverzeichnis> claude-opus-5-5 -- "Frage" )
```

Den Hash zum Kurscode für den Vault macht Konrad selbst, die Eingabe ist verdeckt:

```bash
node tools/kurscode-hash.mjs
```

Die Antworten aus Phase 1 und der Korpus, aus dem sie zitieren, liegen eingefroren unter
`$HAINRICH2_DATEN/work/phase1/`. Der Korpus, der live ist, liegt hinter dem Verweis `work/korpus-aktuell` (Plan D25).
Ein neues Skript zieht so nach: Korpus in ein eigenes Verzeichnis bauen, prüfen, den Verweis umstellen, die Site bauen, beides ausspielen.

```bash
( . ./.env.local; node tools/build-corpus.mjs "$HAINRICH2_DATEN/work/korpus-<datum>" )
```

```bash
( . ./.env.local; ln -sfn korpus-<datum> "$HAINRICH2_DATEN/work/korpus-aktuell" )
```

## Was beißt

1. **Der Kurscode steht nirgends in diesem Repo, in keiner Memory und keinem Client-Bundle.** Nur ein
   Hash im Vault des Server-Repos.
2. **Text ohne Freigabe und ohne Einwilligung erreicht nie die Claude API.** Der einzige Weg vor der Freigabe ist die
   ausdrückliche Einwilligung beim Absenden, ohne Treffer des Checkers (Plan D20, §3 I1, §11.3). Jede andere Abkürzung bricht die
   Grundlage der Datenschutz-Entscheidung. Der Richter läuft erst nach der Freigabe. Auch der Auftrag für einen Kurztitel entsteht erst dann (Plan D31).
3. **Kosinus entscheidet nichts.** Embeddings liefern Kandidaten; entscheiden dürfen nur ein Klick,
   die Moderation oder der Richter (Plan §19).
4. **Der VPS gehört `~/files/work/server`.** Hier liegen keine Playbooks. DNS, Caddy, Units und jeder
   Deploy brauchen die Zustimmung des Eigentümers; erst DNS, dann Caddy.
5. **Rechtstexte und Technik gehen am selben Tag live.** Autorität ist `~/files/work/RECHTSTEXTE.md`.
6. **Kein Test ruft die echte API.** Echte Aufrufe kosten Geld und brauchen die Zustimmung des
   Eigentümers.
7. **Strenge CSP ist Teil des Tests.** `site/serve.mjs` setzt sie, weil die Runtime sonst still über
   `blob:` lädt (`env.useWasmCache = false` in `lib/model.js`). Die gültige CSP gehört ins Server-Repo.
8. **`public.db` auf dem VPS ist die Quelle für alles Öffentliche**, sobald die Moderation läuft. `site/deploy.sh` liefert
   nur noch Assets, Frageseiten kommen aus `live/`. Nie eine lokale `public.db` über die auf dem Server legen.
9. **`site/serve.mjs` muss Caddy nachahmen, auch bei den Kopfzeilen.** `no-referrer` macht `Origin` zu `null`; ohne diese
   Kopfzeile blieb der Browser-Test mit dem Fehler grün.
10. **Die Rechtstexte zum Fragepfad liegen getrennt.** `site/texte/datenschutz.md` ist die freigegebene Fassung, `--fragen` tauscht einen
    Abschnitt gegen `datenschutz-fragen.md`. Wer den Fragepfad ändert, prüft beide; ein neuer Zustimmungstext erhöht
    `ZUSTIMMUNG.version` in `lib/fragen.js`.
11. **Große Daten bleiben draußen.** Modelle, Arbeitsdaten und die gebaute Site liegen unter `$HAINRICH2_DATEN`, nicht im Repo. Wo
   das auf diesem Rechner ist, steht in der gitignorten `.env.local` (Vorlage `.env.example`), ebenso der Ort der Key-Datei;
   `lib/orte.js` und die Skripte unter `site/` lesen sie. Kein Pfad dieses Rechners gehört in eine versionierte Datei.
12. **`phase1` wird nie getauscht.** `site/build.mjs --modell` prüft die Zitate in `antworten.json` gegen den Korpus daneben (I4) und
   bricht sonst ab; mit `--stand` kommen die Antworten vom Server, und nur die der Beispielfragen (was im Docroot liegt, überlebt ein
   Löschen in der Moderation). Die Suche im Browser (`--korpus`), `site/deploy-app.sh` und `tools/skriptstand.mjs` nehmen `work/korpus-aktuell`.
13. **Zwischen Prüfen und Zählen einer Bremse steht kein `await`, und kein API-Aufruf geht hinaus, bevor er im Kostenbuch steht.** Sonst
    kommen gleichzeitige Versuche alle durch, und ein Abbruch kostet Geld, das niemand zählt (Plan D26). Zu jeder neuen Bremse gehört ein Test mit `Promise.all`.
