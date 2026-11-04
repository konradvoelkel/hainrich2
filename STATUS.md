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
- `site/deploy.sh`: liefert den fertigen Baum per rsync in den Docroot. Probelauf gegen den Server am
  2026-11-04: 236 Dateien, keine Löschung. Hochgeladen ist nichts.
- `https://hai.konradvoelkel.com/` ist seit 2026-11-04 online, aber ohne Inhalt: A und AAAA bei INWX, Rolle
  `hainrich2` mit Caddy-Block und CSP, Wache (Server-Repo `1b83e10`, `27a20d6`). `/` und `/eidl` leiten auf
  `/eidl/`, dort steht eine 404, weil der Docroot leer ist.
- Die Kontaktadresse `mail@hai.konradvoelkel.com`: MX für `hai`, Fastmail stellt sie als
  `hai+mail@konradvoelkel.com` zu. Mit einer Mail von außen bestätigt (2026-11-04).
- `seeds/fragen.json`: 30 Beispielfragen. Die 90 Antworten liegen in
  `/media/konrad/xtraspace/hainrich2/work/phase1/antworten.json`.

## Was nicht existiert

- Keine Schreibpfade. Keine Inhalte auf dem Server: Der Docroot ist leer, die Lese-Site läuft nur lokal.
- Keine Nutzungsbedingungen, die braucht erst Phase 3. Keine Vorschaukarte (`og:image`).
- Kein Key für den VPS. Der Laptop-Key liegt außerhalb des Repos und ist getestet.

## Nicht geprüft

- Die Qualität der 90 Antworten. Bisher hat sie kein Mensch bewertet.
- Ob der Prüfschritt etwas taugt: 54 von 87 Hinweisen, bei allen Modellen gleich oft.
- Impressum und Datenschutz sind Entwürfe. Der Datenschutztext gilt nur für die Fassung ohne Schreibpfade.
- Der Caddy-Block mit echten Dateien: `precompressed` und die Typen für `.wasm` und `.onnx` zeigen sich erst
  nach dem ersten Deploy. Gemessen sind Zertifikat, Umleitungen über IPv4 und IPv6 und die Kopfzeilen auf der
  404. Die CSP steht doppelt, in der Rolle und in `site/serve.mjs`, und ist live gleich.
- `site/deploy.sh` hat nur den Probelauf gesehen, noch keinen echten Upload.
- Smoke-Test nur in Chromium, nicht in Firefox und Safari.
- Latenz auf einem echten Telefon; gemessen ist nur CPU-Drosselung im Headless-Chromium.
- Text-Fragmente nur in Chromium und nur an vier Links geprüft.
- Alle Trefferquoten stammen aus einem kleinen, selbst geschriebenen Set, nicht aus echten Fragen.
- Der Abnahmewert für Duplikate in den Top 5 (85 %) ist nicht erreicht: 74 bis 80 %.

## Nächster Schritt

Inhalte gehen hoch, sobald der Eigentümer die Rechtstexte gelesen und die Vorschau entschieden hat: bauen,
`npm run smoke`, `DRY_RUN=1 site/deploy.sh`, `site/deploy.sh`, dann Smoke-Test gegen den echten Host.

Der Blindvergleich hat keine Frist (`node tools/review.mjs`, Port 8770). An ihm hängen Modellwahl,
Opus-Durchgang und die Freigabe der Antworten, nicht der Server.
