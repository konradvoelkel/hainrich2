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
  `/media/konrad/xtraspace/hainrich2/site/`. 33 Seiten, Suche im Browser, Impressum und
  Datenschutz. 92 Unit-Tests, 13 Smoke-Tests und 7 Browser-Tests der Moderation grün (`npm test`, `npm run smoke`, `npm run smoke:mod`). Sie zeigt vorerst die
  Opus-Antworten als Platzhalter, jede Seite trägt ein Vorschau-Banner.
- `site/deploy.sh`: liefert den fertigen Baum per rsync in den Docroot.
- `https://hai.konradvoelkel.com/eidl/` ist seit 2026-11-04 online, als Staging: der Vorschau-Baum mit den
  Opus-Platzhaltern, Banner und `noindex` auf allen 33 Seiten, leere Sitemap, Impressum und Datenschutz. Das ist
  Konrads Entscheidung. Der Name ist nirgends verlinkt, steht aber wie jeder
  Zertifikatsname in den öffentlichen CT-Logs. A und AAAA bei INWX, Rolle `hainrich2`, Wache (Server-Repo
  `1b83e10`, `27a20d6`). Die 13 Smoke-Tests sind auch gegen den echten Host grün (`SMOKE_URL`).
- Der Korpus ist vom Skriptstand 2026-11-04 abends, 442 Passagen, nach dem Umbau des Skripts. Alle Zitat-Links der 30
  Frageseiten antworten. Ändert sich das Skript wieder, zieht `tools/move-citations.mjs` die Zitate nach Wortlaut um.
- Die Kontaktadresse `mail@hai.konradvoelkel.com`: MX für `hai`, Fastmail stellt sie als
  `hai+mail@konradvoelkel.com` zu. Mit einer Mail von außen bestätigt (2026-11-04).
- `seeds/fragen.json`: 30 Beispielfragen. Die 90 Antworten liegen in
  `/media/konrad/xtraspace/hainrich2/work/phase1/antworten.json`.

- Moderation, lokal fertig, nicht auf dem Server: `lib/store.js` (`public.db`), `lib/auth.js`, `lib/checker.js` (harte
  Regeln), `lib/publish.js`, `lib/mod.js`, `lib/mod-pages.js`, `server/web.mjs`, `tools/import-public.mjs`,
  `tools/mod-account.mjs`, `site/deploy-app.sh`. Anmelden, Fragen und Antworten bearbeiten, prüfen, zurückziehen, Verlauf.
  Die Rolle dafür liegt uncommittet im Arbeitsbaum von `~/files/work/server`.

## Was nicht existiert

- Keine Fragen von außen: kein Kurscode, kein `pending.db`, keine Zustimmung, keine weichen Checker-Treffer.
- Bearbeitete Fragen behalten ihren alten Vektor, bis die Moderation ihn neu rechnen kann. Die Stichwortsuche sieht den
  neuen Text, die semantische Suche den alten.
- Keine Nutzungsbedingungen, die braucht erst Phase 3. Keine Vorschaukarte (`og:image`).
- Kein Key für den VPS. Der Laptop-Key liegt außerhalb des Repos und ist getestet.

## Nicht geprüft

- Die Qualität der 90 Antworten. Bisher hat sie kein Mensch bewertet.
- 81 der 90 Antworten stammen noch aus der Suche mit `k = 60`, nur s02, s08 und s12 sind neu. Bei den übrigen
  wäre die Auswahl heute meist etwas anders; ihre Zitate betrifft das nicht.
- Ob der Prüfschritt etwas taugt: 58 von 87 Hinweisen, bei allen Modellen ähnlich oft.
- Impressum und Datenschutz hat Konrad am 2026-11-05 geprüft, in der Fassung ohne Moderation. Der neue Absatz zur
  Moderation und der geänderte erste Satz sind von ihm noch nicht gelesen. Für Fragen von außen ändert sich der Text wieder.
- Der Caddy-Block mit `handle` und `reverse_proxy`: Lokal gibt es kein Caddy, geprüft wird er erst beim Ausspielen.
- Die CSP steht doppelt, in der Rolle und in `site/serve.mjs`. Live sind beide gleich, aber kein Test hält sie
  zusammen.
- Smoke-Test nur in Chromium, nicht in Firefox und Safari.
- Latenz auf einem echten Telefon; gemessen ist nur CPU-Drosselung im Headless-Chromium.
- Text-Fragmente nur in Chromium und nur an vier Links geprüft.
- Alle Trefferquoten stammen aus einem kleinen, selbst geschriebenen Set, nicht aus echten Fragen.
- Der Abnahmewert für Duplikate in den Top 5 (85 %) ist nicht erreicht: 74 bis 80 %.

## Nächster Schritt

Moderation ausspielen, sobald Konrad den Datenschutzabsatz gelesen und zugestimmt hat (Reihenfolge in `.claude/TODO.md`).
Der Blindvergleich hat keine Frist und entscheidet nur noch das Modell für neue Antworten, nicht die Seeds.
