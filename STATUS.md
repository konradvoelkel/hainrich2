# Status

_Stand 2026-11-04._

## Was existiert

- Git-Repo auf `main`, Remote `origin` ist das private `konradvoelkel/hainrich2` auf GitHub.
- `DEVELOPMENT_PLAN.md`, `CLAUDE.md`, dieses Dokument.
- `research/2026-11-04-dedupe/`: Messskripte und Ergebnisse zu Duplikaterkennung, Skript-Suche und
  Antworten mit lokalen Modellen.
- `research/2026-11-04-browsermodell/`: Modellwahl für den Browser. Das geschnittene Modell liegt
  außerhalb des Repos auf `xtraspace`, die Token-IDs im Repo.

- `lib/`, `tools/`, `test/`: Korpus aus dem Skript, hybride Suche, Antworten mit Citations, Richter,
  Kostenbuch mit Deckel, Review-Seite. 44 Tests, alle grün (`npm test`).
- `site/`, `lib/site.js`, `lib/rank.js`, `smoke/`: die Lese-Site, lokal gebaut nach
  `/media/konrad/xtraspace/hainrich2/site/`. 33 Seiten, Suche im Browser, Entwürfe von Impressum und
  Datenschutz. 64 Unit-Tests und 13 Smoke-Tests grün (`npm test`, `npm run smoke`). Sie zeigt vorerst die
  Opus-Antworten als Platzhalter, jede Seite trägt ein Vorschau-Banner.
- Die Kontaktadresse `mail@hai.konradvoelkel.com`: MX für `hai`, Fastmail stellt sie als
  `hai+mail@konradvoelkel.com` zu. Mit einer Mail von außen bestätigt (2026-11-04).
- `seeds/fragen.json`: 30 Beispielfragen. Die 90 Antworten liegen in
  `/media/konrad/xtraspace/hainrich2/work/phase1/antworten.json`.

## Was nicht existiert

- Keine Schreibpfade, keine Rolle im Server-Repo, kein A- oder AAAA-Eintrag für `hai`, kein
  `site/deploy.sh`. Unter `https://hai.konradvoelkel.com/` ist nichts erreichbar.
- Keine Nutzungsbedingungen, die braucht erst Phase 3. Keine Vorschaukarte (`og:image`).
- Kein Key für den VPS. Der Laptop-Key liegt außerhalb des Repos und ist getestet.

## Nicht geprüft

- Ob der Laptop-Key im Workspace `hainrich2` hängt und das Limit von 20 $ greift. Der Key zeigt nur
  eine Workspace-ID, das lässt sich von hier nicht unterscheiden.
- Die Qualität der 90 Antworten. Bisher hat sie kein Mensch bewertet.
- Ob der Prüfschritt etwas taugt: 54 von 87 Hinweisen, bei allen Modellen gleich oft.
- Impressum und Datenschutz sind Entwürfe. Der Datenschutztext gilt nur für die Fassung ohne Schreibpfade.
- Die CSP steht bisher nur in `site/serve.mjs`, Caddy und `precompressed` sind nicht geprüft.
- Smoke-Test nur in Chromium, nicht in Firefox und Safari.
- Latenz auf einem echten Telefon; gemessen ist nur CPU-Drosselung im Headless-Chromium.
- Text-Fragmente nur in Chromium und nur an vier Links geprüft.
- Alle Trefferquoten stammen aus einem kleinen, selbst geschriebenen Set, nicht aus echten Fragen.
- Der Abnahmewert für Duplikate in den Top 5 (85 %) ist nicht erreicht: 74 bis 80 %.

## Nächster Schritt

Blindvergleich durch den Eigentümer in der Review-Seite (`node tools/review.mjs`, Port 8770). Danach
Modellwahl und Opus-Durchgang über die Antworten des gewählten Modells. Parallel möglich, mit seiner
Zustimmung: Rolle, DNS und Caddy-Block für `hai.konradvoelkel.com`.
