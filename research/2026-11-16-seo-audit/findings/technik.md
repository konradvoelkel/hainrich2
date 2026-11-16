# Technik, Stand 2026-11-16 (Bereitschaft für das Ende der Vorschau)

Score Technik: **86 von 100** (Einschätzung, 2026-11-06: 85). Keine Rückschritte gefunden.

## Was beim Ende der Vorschau passiert (lib/site.js, site/build.mjs, lib/publish.js)
- Schalter 1: `node site/build.mjs --release` (site.vorschau = false, Banner weg, `robots` je Seitentyp, lib/site.js:88,96,373).
- Schalter 2: Die Seiten, die der Server schreibt (Start, Unterforen, Kapitel, Fragen, Sitemap), lesen `vorschau` aus der Tabelle `meta` in public.db (lib/store.js:115, `setSite`; import-public.mjs:36 setzt `true`). Ohne diesen zweiten Schritt bleibt alles Dynamische `noindex`, nur `ueber/` wäre `index,follow`. Beide Schritte am selben Tag, danach neu veröffentlichen.
- Indexierbar nach Freigabe:
  - Frageseite: nur wenn mindestens eine Antwort `geprüft` ist (site.js:189). Sitemap: ja.
  - Unterforum und Kapitelseite: nur wenn sie eine geprüfte Frage enthalten (site.js:230, 260, 297). Leere Kapitelseiten (~135 Wörter) bleiben `noindex` und stehen nicht in der Sitemap (site.js:376). Das ist richtig.
  - Start: nur wenn es irgendeine geprüfte Frage gibt (site.js:230ff). Sitemap: `''` und `ueber/` nur dann (site.js:375).
  - `ueber/`: immer `index,follow` (build.mjs:159).
  - Impressum, Datenschutz, Nutzungsbedingungen, `f/neu/`, alle 29 `f/neu/?kapitel=`, 404: bleiben `noindex` (Standardwert in `shell`). Richtig so, keine Sitemap-Einträge.
- Sitemap enthält keine `lastmod`.

## Befunde
1. **Medium: Zwei Schalter, kein Test, der sie zusammen prüft.** Siehe oben. Fix: ein Skript oder Abschnitt im Plan "Ende der Vorschau" mit beiden Schritten; Test, der `setSite('vorschau', false)` plus `publishAll` auf ein Wegwerf-Verzeichnis anwendet und prüft, dass eine geprüfte Frage `index,follow` trägt und in der Sitemap steht. Prüfen: nach dem Release `curl -s .../f/<id>/ | grep robots` und `curl .../sitemap.xml`.
2. **Medium: Frageseite wird indexiert, sobald eine Antwort geprüft ist, auch wenn weitere Antworten auf derselben Seite `ungeprüft` sind** (site.js:16, 189). Fix: Entscheidung treffen (alle Antworten sichtbar kennzeichnen, was schon geschieht, oder nur Seiten mit allen Antworten geprüft indexieren). Prüfen: Testfall mit gemischten Status.
3. **Low: Statische Assets mit `cache-control: no-cache`** (HEAD: style.css, app.js, bricolage-grotesque.woff2, favicon.ico, logo.svg, og-card.png, OFL.txt). Jede Wiederholung kostet pro Datei eine Rückfrage (ETag, 304). Nur `/eidl/katex/` hat `public, max-age=86400, stale-while-revalidate=604800`. Messung 2026-11-16: 6 bis 13 Anfragen je Seite bei 4G langsam, LCP unter 0,9 s, also wenig Schaden. Fix in Caddy: für Schrift, Logo, Favicons `max-age=86400` oder länger; für CSS/JS erst mit Hash im Dateinamen `immutable`. HTML bleibt `no-cache`. Prüfen: `curl -sI` auf die Dateien.
4. **Low: 404-Seite zeigt auf sich selbst als Canonical** (`/eidl/404.html`, og:url ebenso), hat `noindex`, Status 404, Link "Zum Forum". Hilfreich genug, aber ohne Suche oder Unterforen-Links. Fix: Canonical auf der 404-Seite weglassen, Links zu den Unterforen ergänzen. Prüfen: GET `/eidl/f/gibtsnicht/`.
5. **Low: `/eidl/index.html` liefert 200** neben `/eidl/` (Canonical zeigt auf `/eidl/`, also kein Schaden). Fix: Caddy-Redirect `index.html` nach `./`. Prüfen: HEAD.
6. **Low: 29 `f/neu/?kapitel=…`-Seiten haben gleichen Titel ("Frage stellen | hAInrich2") und `noindex` mit Canonical auf `f/neu/`.** Widersprüchliche, aber harmlose Signale; jeder beliebige Wert (`?kapitel=nope`) liefert 200. Fix: Links auf diese Varianten mit `rel="nofollow"` oder per JS aus der Kapitelseite setzen; Canonical dann egal. Nicht in robots.txt sperren, sonst sieht niemand das `noindex`.
7. **Low: 301 und 308 gemischt** (`/` und `/eidl` nach `/eidl/` mit 301, `/eidl/f/s09` mit 308, http mit 308). Beides wird als dauerhaft behandelt. Fix nur zur Ordnung: einheitlich 308 oder 301.
8. **Low: Keine Paginierung.** Unterforen und Kapitelseiten listen alle Fragen (site.js:248, `threadRows`). Bei 31 Fragen kein Problem; ab einigen hundert wird die Liste lang. Tiefe heute: Start → Unterforum → Frage = 2 Klicks, auch Kapitel (29, je 5 bis 9 eingehende Links) und Fragen (je 6 bis 7) hängen gut an; keine Waisen im Crawl (99 Seiten).
9. **Info: Sitemap `text/xml`** statt `application/xml`, beides gültig. Keine `X-Robots-Tag`-Header auf Nicht-HTML (OFL.txt), unkritisch, OFL.txt ist indexierbar und harmlos.
10. **Info: `/eidl/robots.txt` liefert 404 (die HTML-404-Seite).** Maßgeblich ist `/robots.txt` auf Hostebene: 200, `text/plain`, sperrt models, wasm, daten, mod, api, nennt die Sitemap. Passt. Die Datei, die build.mjs:164 schreibt, wird also nicht unter `/eidl/` ausgeliefert, die Hostdatei im Server-Repo muss bei Pfadänderungen mitgezogen werden.
11. **Info: Vorschau ist gewollt** (`noindex` überall, leere Sitemap). Nicht bewertet.
12. **Info: Strukturierte Daten** auf Frageseiten nur `BreadcrumbList`, kein `QAPage` (Bereich Strukturierte Daten/Inhalt).

## Was gut ist
- Alle Primärinhalte im Roh-HTML (Frageseite ca. 2960 Wörter, Kapitel ca. 135), kein JS zum Lesen nötig (`noscript` nur für das Fragen-Formular). `lang="de"`, `charset`, `viewport` auf jeder Seite.
- Header: CSP streng, HSTS 1 Jahr, nosniff, X-Frame-Options DENY, no-referrer, COOP, Brotli, HTTP/3.
- Canonical selbstbezüglich auf allen 70 echten Seiten; 29 Varianten zeigen auf `f/neu/`.
- Echte 404 mit `noindex`, Groß-/Kleinschreibung (`/f/S09/`) liefert 404, kein Soft-404.
- Seit 2026-11-06 neu und unauffällig: Kapitelseiten, Suche (läuft im Browser, `daten/` gesperrt), Fragenformular, Stimmen.

## Nicht geprüft
Kein Lighthouse, keine Felddaten (CrUX), kein Test in Googlebot oder Bing. Serverseitige Caddyfile und `public.db` nicht gelesen; der Wert von `meta.vorschau` auf dem Server ist nicht geprüft. Kein Redirect-Check für `www` und `http` neu (Angabe aus dem Auftrag). hreflang entfällt (eine Sprache). 14 Anfragen an den Host, nur GET/HEAD.
