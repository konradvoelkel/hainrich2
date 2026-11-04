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
  Kostenbuch mit Deckel, Review-Seite.
- `site/`, `lib/site.js`, `lib/rank.js`, `smoke/`: die Lese-Site, lokal gebaut nach
  `/media/konrad/xtraspace/hainrich2/site/`. 33 Seiten, Suche im Browser, Entwürfe von Impressum und
  Datenschutz. 64 Unit-Tests und 13 Smoke-Tests grün (`npm test`, `npm run smoke`). Sie zeigt vorerst die
  Opus-Antworten als Platzhalter, jede Seite trägt ein Vorschau-Banner.
- `site/deploy.sh`: liefert den fertigen Baum per rsync in den Docroot.
- `https://hai.konradvoelkel.com/eidl/` ist seit 2026-11-04 online, als Staging: der Vorschau-Baum mit den
  Opus-Platzhaltern, Banner und `noindex` auf allen 33 Seiten, leere Sitemap, Entwürfe der Rechtstexte. Das ist
  Konrads Entscheidung, er liest die Rechtstexte dort. Der Name ist nirgends verlinkt, steht aber wie jeder
  Zertifikatsname in den öffentlichen CT-Logs. A und AAAA bei INWX, Rolle `hainrich2`, Wache (Server-Repo
  `1b83e10`, `27a20d6`). Die 13 Smoke-Tests sind auch gegen den echten Host grün (`SMOKE_URL`).
- Die Kontaktadresse `mail@hai.konradvoelkel.com`: MX für `hai`, Fastmail stellt sie als
  `hai+mail@konradvoelkel.com` zu. Mit einer Mail von außen bestätigt (2026-11-04).
- `seeds/fragen.json`: 30 Beispielfragen. Die 90 Antworten liegen in
  `/media/konrad/xtraspace/hainrich2/work/phase1/antworten.json`.

## Was nicht existiert

- Keine Schreibpfade.
- Keine Nutzungsbedingungen, die braucht erst Phase 3. Keine Vorschaukarte (`og:image`).
- Kein Key für den VPS. Der Laptop-Key liegt außerhalb des Repos und ist getestet.

## Nicht geprüft

- Die Qualität der 90 Antworten. Bisher hat sie kein Mensch bewertet.
- Ob der Prüfschritt etwas taugt: 54 von 87 Hinweisen, bei allen Modellen gleich oft.
- Impressum und Datenschutz sind Entwürfe. Der Datenschutztext gilt nur für die Fassung ohne Schreibpfade.
- Die CSP steht doppelt, in der Rolle und in `site/serve.mjs`. Live sind beide gleich, aber kein Test hält sie
  zusammen.
- Smoke-Test nur in Chromium, nicht in Firefox und Safari.
- Latenz auf einem echten Telefon; gemessen ist nur CPU-Drosselung im Headless-Chromium.
- Text-Fragmente nur in Chromium und nur an vier Links geprüft.
- Alle Trefferquoten stammen aus einem kleinen, selbst geschriebenen Set, nicht aus echten Fragen.
- Der Abnahmewert für Duplikate in den Top 5 (85 %) ist nicht erreicht: 74 bis 80 %.

## Nächster Schritt

Der Eigentümer liest die Rechtstexte auf der echten Seite. Jeder weitere Stand geht denselben Weg: bauen,
`npm run smoke`, `DRY_RUN=1 site/deploy.sh`, `site/deploy.sh`, dann `SMOKE_URL=https://hai.konradvoelkel.com npm run smoke`.

Der Blindvergleich hat keine Frist (`node tools/review.mjs`, Port 8770). An ihm hängen Modellwahl,
Opus-Durchgang und die Freigabe der Antworten, nicht der Server.
