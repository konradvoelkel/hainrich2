# Technik, Stand 2026-11-18 (erster Durchgang nach dem Start)

Gesehen = an `crawl.json`, `sitemap.xml`, `seiten/*.html` oder am Host nachgezählt. Angenommen = Erfahrung, vermerkt. Googles Dokumentation konnte ich nicht nachschlagen. Abrufe am Host: 10 (HEAD, 1,2 s Pause, nichts unter `api/` oder `mod/`).

## 1. Gegen gestern
1. `lastmod` fehlte (M1): **behoben.** 34 von 35 Einträgen haben es, alle gültig (ISO, nicht in der Zukunft). Wert je Frage = `lastReviewed` im JSON-LD der Seite: bei allen 29 Fragen identisch (nachgezählt). Verteilung 05.11. x13, 10.11. x9, 17.11. x12. Plausibel. Nur `ueber/` hat keins (siehe N1).
2. Cache-Aufteilung (M3): **unverändert, richtig.** Assets `public, max-age=86400, swr=604800`; CSS und vier Skripte `no-cache` mit ETag; Seiten `no-cache`.
3. `f/neu/?kapitel=…` (M2): **teils behoben.** Alle 58 Links darauf (29 Kapitelseiten, je zwei) tragen jetzt `rel="nofollow"`. Der Widerspruch Canonical plus `noindex` bleibt (siehe N2).
4. Breadcrumb auf noindex-Kapitel (N4): **offen, gewollt.** Jetzt wichtiger (siehe H1).
5. `ueber/` nicht in der Sitemap (N1): **offen**, jetzt echte Abweichung (siehe N1).
6. 404 ohne Unterforen-Links (N5): nicht neu geprüft; laut Auftrag verlinkt die Fehlerseite jetzt die Unterforen: **behoben (laut Auftrag, nicht nachgesehen).**
7. `/eidl/index.html`: **offen.** HEAD 200.
8. 301/308 gemischt: **offen.** `/eidl` 301, `/eidl/f/s09` 308.
9. Sitemap `text/xml`: **offen**, gültig (HEAD `text/xml; charset=utf-8`).
10. `/eidl/robots.txt`: HEAD 404, wie zu erwarten (maßgeblich ist `/robots.txt`, HEAD 200, Inhalt gleich der lokalen Datei).
11. Testfragen des Betreibers in der Sitemap: **eingetreten**, gewollt (beide stehen drin, Daten 05.11. und 17.11.).
12. Paginierung, N2 (Mod-Link), N3 (Melden): unverändert unkritisch.

## 2. Zahlen (aus den Dateien nachgezählt)
- Crawl: 97 Seiten; 35 `index,follow`, 61 `noindex` (200), `mod/` gesperrt (kein Abruf), `OFL.txt` Datei ohne Meta.
- `sitemap.xml`: 35 Adressen, keine doppelt. Menge der Sitemap = Menge der Seiten mit `index,follow`: **identisch, in beiden Richtungen leer.** Kein `noindex` drin, keine fehlende. Alle 35 haben Selbst-Canonical (gleich der Adresse). Kein Canonical auf eine andere Adresse außer den 29 Varianten.
- Alle 29 Varianten `f/neu/?kapitel=…`: `noindex`, Canonical `f/neu/`, gleicher Titel. Alle 29 Kapitel exakt `<meta name="robots" content="noindex">`.
- `lastmod`-Werte siehe oben; Start 17.11. = Maximum, Unterforum `lernen` 10.11.: stimmig. Dass Start und Foren das Maximum ihrer Fragen sind, habe ich nur an Start und `lernen` gegengeprüft, nicht an allen vier.

## 3. Neue Befunde

### Hoch
**H1. Alle externen Links zeigen auf `noindex`-Seiten, und das Tag lautet nur `noindex`.** Gesehen: `eidl__f__kapitel__tensoren.html` trägt `content="noindex"`, nicht `noindex,follow`. Technisch: `follow` ist der Standard, also gleichbedeutend; ein Crawler folgt den Links der Kapitelseite weiter zu den Fragen (Annahme aus Erfahrung: bei dauerhaftem `noindex` behandelt Google die Seite nach einiger Zeit wie `noindex,nofollow` und gibt Links dann nicht mehr sicher weiter; Dokumentation nicht nachgeschlagen, deshalb keine feste Aussage). Ein ausdrückliches `follow` ändert daran nichts. Folge: Die ersten Links von außen (Skript, 29 Stück) landen auf Seiten, die nicht in den Index kommen; ihr Wert geht nur über den internen Link zu den Fragen weiter, und Kapitelseiten verlinken zugleich nur 1 bis 2 Fragen. Zu tun, eines von zwei: (a) Kapitelseiten indexierbar machen (Entscheidung zu „drei Fragen“ neu, mit 1 bis 2 Fragen ist die Seite dünn, daher gewollt), oder (b) im Skript direkt auf die Frageseiten oder das Unterforum verlinken, wo es eine Frage gibt. Kein Eingriff in Tags nötig. Erfolgskontrolle: Suchkonsole, Seiten „Ausgeschlossen durch noindex“ = 29 Kapitel; die Fragen erscheinen unter „Verweisende Seiten“. Nicht prüfbar ohne Dienst.

### Mittel
Keine.

### Niedrig
**N1. `ueber/` ohne `lastmod`.** Sie ist indexierbar und in der Sitemap, aber ohne Datum (site.js, ohne Quelldatum). Gestern empfohlen so; ein ehrliches Weglassen ist besser als ein Bauzeit-Datum. Kein Handlungsbedarf.

**N2. Varianten `f/neu/?kapitel=…`: sauber, keine Crawl-Verschwendung.** 58 Links, alle `nofollow`; `noindex`; nicht in `robots.txt` gesperrt (richtig, sonst sähe Google das `noindex` nicht); Sitemap nennt sie nicht. Alle 29 Kapitelseiten und nur sie verlinken sie. Restwiderspruch Canonical plus `noindex`: Erfahrung sagt, Google nimmt `noindex`; Schaden keiner. Weiter bleibt `?utm=x` an jeder Seite 200 mit sauberem Canonical (HEAD `f/s09/?utm=x` 200). Bei 97 Seiten spielt Crawl-Budget keine Rolle.

**N3. Gelöschte Fragen: 404 reicht.** HEAD `f/s19/` und `f/s27/`: 404, HTML, `no-cache`, in beiden Fällen kein Weiterleiten, keine Datei im Crawl. Sie waren nie indexierbar (bis 17.11. `noindex`, nie in der Sitemap), also gibt es nichts zu entfernen; 410 hätte keinen Vorteil. Falls später eine indexierte Frage gelöscht wird: 410 beschleunigt das Entfernen etwas (Annahme), 404 funktioniert aber auch. Beide nicht mehr in der Sitemap oder in Links (Crawl: keine toten Links, `broken` leer).

**N4. `robots.txt` sperrt nichts Rendernötiges.** Gesperrt: `models/`, `wasm/`, `daten/`, `mod/`, `api/`. Gesehen: `such-worker.js` lädt `daten/fragen.json`, `passagen.json`, `vektoren.json`, `models/`, `wasm/` – nur die Suche auf der Startseite (`app.js`) und das Formular (`fragen.js`), nicht der Seiteninhalt. Der Text jeder Seite steht im HTML (Frage, Antwort, Zitate), CSS, Schrift, `zitate.js`, `stimmen.js` sind frei. Eine Seite sieht gerendert so aus wie roh. Der Fuß-Link `mod/` mit `nofollow` auf gesperrtes Ziel: wie gestern, vernachlässigbar (`mod/` nicht abgerufen, Inhalt nicht gesehen). Sitemap-Verweis in `robots.txt` stimmt.

**N5. `index.html` und Umleitungscodes** (gestern N6, N7): weiterhin 200 neben `/eidl/`, Canonical sauber. Zu tun: Redirect `index.html` nach `./` im Webserver. Folgen klein. 301/308 gemischt (`/eidl` 301, `/eidl/f/s09` 308): beides dauerhaft, kein Befund.

## 4. Kopfzeilen (Crawl, 96 Antworten + Assets)
- Seiten: `cache-control: no-cache`, ETag und `last-modified` gesetzt (304 möglich), CSP identisch streng wie gestern, `referrer-policy: no-referrer`, `nosniff`, `x-frame-options: DENY`, HSTS `max-age=31536000`. Kein Befund. `no-cache` heißt Revalidierung, nicht „nicht speichern“; für Besucher und Crawler günstig (Seiten ändern sich beim Prüfen).
- `last-modified` einer Seite (s09: 17.11. 23:07) ist der Bauzeitpunkt und weicht vom `lastmod` der Sitemap (05.11.) ab. Das ist keine Fehlerquelle (Google nutzt `lastmod`; Annahme), aber wer bei Fragen Bauzeit-`last-modified` mit `lastmod` vergleicht, sieht verschiedene Werte. Kein Handlungsbedarf.
- Kompression: Assets (`js`, `css`, `svg`) `br`; im Crawl tragen die HTML-Antworten kein `content-encoding` (Crawler schickt vermutlich kein `Accept-Encoding`); gestern gemessen: br, zstd, gzip alle da. Heute nicht neu nachgeprüft.
- Bilder und Schrift (`woff2`, `jpg`, `png`) ohne Kompression, richtig.

## 5. Punkte (Einschätzung, keine Messung)
- 2026-11-17: **90.**
- 2026-11-18: **92.** Sitemap und `robots`-Meta decken sich genau, `lastmod` stimmt mit dem Prüfdatum, Kopfzeilen lückenlos, 404 sauber; Abzug für `index.html` 200, gemischte Umleitungscodes und das Linkproblem H1 (Strategie, kein Fehler).

## 6. Nicht geprüft
- `/eidl/mod/` (verboten), Caddy-Konfiguration, `public.db`.
- Verhalten von Googlebot und Search Console, Indexierung: nicht ohne fremden Dienst möglich. Googles Dokumentation zu `noindex` und Linkweitergabe, `lastmod`, 404 und 410: nicht nachgeschlagen.
- Kompression der HTML-Seiten heute: nicht abgerufen (Zahl der Abrufe gespart).
- 404-Seite mit Unterforen-Links: nicht abgerufen, nur laut Auftrag.
- Unterforen-`lastmod` an drei von vier Foren nicht gegen die enthaltenen Fragen gerechnet.
