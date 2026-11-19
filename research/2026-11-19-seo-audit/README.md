# SEO-Audit von hai.konradvoelkel.com/eidl/, fünfter Durchgang

_Stand 2026-11-19, gemessen gegen 17 Uhr am ausgespielten Stand: statische Seiten vom 18.11., 10:43, App `21e5d95`, seit heute unter
Node 26. Die Skripte sind die vom 17.11., unverändert: `../2026-11-17-seo-audit/{crawl.py,auswertung.py,perf.mjs,wiederbesuch.mjs,auszug.py}`.
Rohdaten und Bilder liegen außerhalb des Repos unter `work/seo-audit-2026-11-19/`. Die sechs Fachprüfungen der Durchgänge davor liefen
diesmal nicht: Seit dem vierten Durchgang (18.11., 01:20) haben sich an den Frageseiten nur die Umbauten vom selben Morgen geändert,
und die sind dort in Abschnitt 9 schon am Host gemessen. Neue Texte gibt es nur auf vier Rechtsseiten, drei davon `noindex`._

**Ergebnis:** Google hat angefangen. Startseite, Über-Seite und die beiden Stichproben `f/s01/` und `f/s09/` stehen im Index, an beiden
Frageseiten erkennt Google ein gültiges Q&A-Element. Die Site selbst ist so, wie sie nach dem Umbau vom 18.11. sein sollte; nichts hat
sich verschlechtert. Die Einschätzung liegt bei **86 von 100** (18.11.: 85); den Zuwachs bringt der Umbau vom 18.11., den der Bericht
davor noch nicht zählte. Die Zahl ist geschätzt, nicht gemessen. **Neu und vordringlich:** Das Skript ist von hier aus nicht zu
erreichen (Befund 1). Jede Antwort verlinkt es als Beleg, und ohne es lässt sich auch nicht prüfen, wie viele Zitate veraltet sind.

**Grenzen:** Keine Rankings, kein Suchvolumen, keine Backlinks, keine Felddaten. Der Name ging in keinen fremden Dienst außer in die
eigene Search Console des Betreibers, und dort nur lesend: URL-Prüfung ohne Live-Test, keine Indexierung beantragt. Googles
Dokumentation hat niemand nachgeschlagen. Lighthouse ist nicht installiert. Die Moderation hinter der Anmeldung ist nicht Teil des
Crawls. Die Ladezeiten stammen aus drei Läufen in Chromium, diesmal auf einer Maschine fast ohne Last (1,4 bis 3,0).

## 1. Punkte je Bereich

| Bereich | Gewicht | 17.11. | 18.11. | heute | Grund |
|---|---:|---:|---:|---:|---|
| Technik | 22 % | 90 | 92 | 92 | Unverändert: Sitemap und `robots`-Meta decken sich, `robots.txt` und Sitemap gleichen dem 18.11. aufs Zeichen. Google ruft Seiten ab und indexiert sie. |
| Inhalt | 23 % | 77 | 75 | 75 | Unverändert. Die veralteten Zitate sind nicht nachgezogen, die schwachen Texte sind seine. |
| Auf der Seite | 20 % | 84 | 86 | 87 | Seit dem Umbau endet keine Beschreibung mehr auf „?“ oder „:“. |
| Strukturierte Daten | 10 % | 86 | 90 | 91 | Der Bot-Autor trägt `url`. Google erkennt Q&A an zwei indexierten Seiten als gültig, mit unkritischen Hinweisen. |
| Leistung | 10 % | 96 | 95 | 96 | Gewicht und Anfragen wie am 18.11., LCP 0,58 bis 0,71 s gedrosselt, CLS 0. |
| KI-Suche | 10 % | 70 | 75 | 82 | Der Beleg steht wieder im Auszug: Kapitel beim Namen und Adresse des Skripts auf 28 von 28 Seiten, die Herkunft vorn. |
| Bilder | 5 % | 92 | 92 | 92 | Unverändert, nicht neu geprüft. |

## 2. Was aus den Befunden vom 18.11. geworden ist

| Befund vom 18.11. | Stand | Beleg |
|---|---|---|
| 1 Mindestens 13 Antworten zitieren veralteten Wortlaut | offen, heute nicht messbar | Der Korpus ist weiter der vom 15.11. (`korpus-aktuell` zeigt auf `korpus-2026-11-15b`). `tools/skriptstand.mjs` bricht ab: „Das Skript war nicht zu erreichen“ (Befund 1 unten). |
| 2 Im Auszug fehlt der Beleg | behoben | `auszug.py` über den Crawl von heute: Kapitel beim Namen 28 von 28, Adresse des Skripts 28 von 28, „Sprachmodell“ in den ersten 400 Zeichen 28 von 28, Frage vorn 29 von 29. |
| 3 Links von außen treffen `noindex` | teils | Alle 29 Kapitelseiten tragen die Einleitung (im Mittel 193 statt 152 Wörter), die Schwelle für `index` ist unverändert. Die geprüfte Kapitelseite kennt Google nicht (Abschnitt 5). |
| 4 s29, s06, s20 halten den Titel nicht | offen | Texte und Titel unverändert; seine Texte. |
| 5 Der nächste Schritt liegt unter den Zitaten | offen, zu entscheiden | Am 18.11. mit Grund nicht gebaut. |
| 6 „Melden“ ohne Mailprogramm | entschieden | Kein weiterer Satz im Impressum (18.11., Abschnitt 9). |
| 7 Sieben Beschreibungen enden mitten im Gedanken | behoben | Fünf Beschreibungen anders als im Crawl vom 18.11., 01:20; keine endet auf „?“ oder „:“, zehn auf „…“. |
| 8 Wer fragt, passt nicht zur Über-Seite | offen | Die Über-Seite sagt weiter „Die Fragen kommen von Nutzern“ und „Wer fragt, bleibt anonym“; 27 Frageseiten zeigen „Frage von Konrad Völkel“, zwei „Anonymer Nutzer“. Sein Text. |
| 9 Hinweise aus dem Live-Test | teils | `url` am Bot-Autor steht. Die übrigen Hinweise (`dateCreated` ohne Uhrzeit, `upvoteCount`, `datePublished`) sind wie am 18.11. zu entscheiden; die URL-Prüfung meldet an s01 und s09 weiter „Non-critical issues“. |
| 10 Schwache erste Sätze | offen | Unverändert; seine Texte oder ein neuer Lauf. |
| niedrig: Landmarken, Entdeckungsdateien, `/eidl/index.html`, Markdown im `Answer.text` | wie am 18.11. | Das `<aside>` mit den Zitaten trägt seit dem Umbau einen Namen; der Rest ist unverändert. |

## 3. Befunde

### Hoch

**1. Das Skript ist nicht zu erreichen.** Um 16:53 und wieder um 17:00 wies `eidl-skript-131e30.pages.cs.uni-duesseldorf.de` jede
Verbindung ab, auf Port 443 wie auf 80, nach rund 40 ms. Dasselbe gilt für `voelkel.pages.cs.uni-duesseldorf.de`: Beide sind
`pages.cs.uni-duesseldorf.de` (134.99.112.37), der Pages-Server der Informatik. Andere Hosts der HHU antworten von hier aus
(`www.hhu.de` 200, `www.cs.uni-duesseldorf.de` 301). Ob der Server für alle ausgefallen ist oder nur für dieses Netz zu, ist von hier
nicht zu unterscheiden. Im Crawl stehen 382 Links ins Skript (31 verschiedene Ziele), auf jeder der 29 Frageseiten 2 bis 20, über die
Zeile „Aus dem Skript … Kapitel …“ und an den Zitaten; dazu 3 Ziele auf der Seite des Autors. Die einzigen Links von außen kommen aus
dem Skript. Wer ein Zitat prüfen
will, wie die Seite es anbietet, kommt gerade nicht hin. _Tun:_ von einem anderen Netz aus öffnen, etwa vom Telefon im
Mobilfunk. Ist er für alle weg, gehört das an die Informatik; an dieser Site ist nichts zu ändern. _Woran man es sieht:_
`node tools/skriptstand.mjs` läuft wieder durch, statt mit „nicht zu erreichen“ abzubrechen.

### Mittel

**2. Die Search Console widerspricht sich bei der Kapitelseite.** Die URL-Prüfung nennt `f/kapitel/was-ist-deep-learning/` als
verweisende Seite der Startseite und von `f/s01/`, Google hat sie also gelesen. Die Prüfung derselben Adresse sagt „URL is unknown to
Google“. Das ist ein Befund über Google, nicht über die Site; die Seite trägt `noindex`, wie es die Schwelle will. Ob die Links aus
dem Skript auf solche Seiten zählen, bleibt offen (Befund 3 vom 18.11.).

**3. Unter „Discovery“ steht zweimal „Temporary processing error“.** An der Startseite und an `f/s01/` steht er bei „Sitemaps“, an
der Über-Seite und an `f/s09/` steht die Sitemap. Die Sitemap selbst hat den Status „Success“ mit 35 Seiten und wurde zuletzt am 17.11.
gelesen. Unschädlich, solange die Seiten über Links gefunden werden; in einer Woche noch einmal ansehen.

## 4. Messwerte

| Was | 18.11., 01:20 | heute |
|---|---|---|
| Seiten im Crawl | 97, keine kaputt | 97, dieselben, keine kaputt, kein Link ins Leere |
| `index,follow` / `noindex` | 35 / 62 | 35 / 62 |
| Sitemap, `robots.txt` | 35 Adressen, 34 mit `lastmod` | gleich, aufs Zeichen |
| Titel | längster 65, keiner doppelt, keiner mit „…“ | unverändert |
| Beschreibungen der Fragen | 77 bis 151 Zeichen, 11 enden auf „…“ | 52 bis 151 Zeichen (s01 ist jetzt der ganze erste Satz), 10 enden auf „…“ |
| Wörter im Mittel: Kapitelseite / Textseite / Formular | 152 / 678 / 298 | 193 / 732 / 304 (Einleitung, Rechtstexte vom 18.11., Satz zum Alter) |
| Auszug: Frage vorn / Herkunft vorn / Kapitel beim Namen / Adresse des Skripts | 29 / 0 / 1 / 0 | 29 von 29 / 28 von 28 / 28 von 28 / 28 von 28 |
| Gewicht Startseite / Frageseite s09 | 59 KB / 138 KB, 7 und 11 Anfragen | gleich |
| LCP gedrosselt, sechs Seiten, bester von drei Läufen | 0,62 bis 0,73 s, unter Last | 0,58 bis 0,71 s, ohne Last; die drei Läufe liegen höchstens 0,16 s auseinander |
| CLS | 0 | 0 |
| Wiederbesuch | 0,9 KB | 0,9 KB, CSS und Skripte mit 304 |

## 5. Was Google bisher sagt

Aus der Search Console des Betreibers, am 19.11. gegen 17 Uhr, nur lesend:

| Adresse | Stand | Zuletzt abgerufen | Erkannt |
|---|---|---|---|
| `/eidl/` | im Index | 18.11., 03:36 | |
| `/eidl/ueber/` | im Index | 18.11., 13:24, also nach den Rechtstexten vom selben Vormittag | |
| `/eidl/f/s01/` | im Index | 19.11., 02:44 | Breadcrumbs gültig, Q&A gültig mit unkritischen Hinweisen |
| `/eidl/f/s09/` | im Index | 19.11., 12:09 | Breadcrumbs gültig, Q&A gültig mit unkritischen Hinweisen |
| `/eidl/f/kapitel/was-ist-deep-learning/` | „URL is unknown to Google“ | | |

Alle vier im Index als „Googlebot smartphone“, der eigene Kanonische ist übernommen. Die Übersicht hinkt hinterher: „0 indexed pages,
1 not indexed“ (ausgeschlossen durch `noindex`), keine Erweiterungen, 0 Klicks seit dem 17.11. Am 18.11. stand `f/s09/` noch auf
„Discovered – currently not indexed“. Wie viele der 35 Seiten im Index sind, sagt erst der Bericht zur Indexierung, wenn er nachzieht;
vier von vier Stichproben sind es.

## 6. Reihenfolge

1. **Das Skript von einem anderen Netz aus öffnen (Befund 1).** Ist es für alle weg, die Informatik fragen.
2. **Korpus nachziehen und die veralteten Zitate neu belegen** (Befund 1 vom 18.11.), sobald das Skript erreichbar ist und er den
   Zeitpunkt wählt. Kostet je Antwort Geld.
3. **Seine Texte:** s29, s06, s20, erste Sätze, Über-Seite gegen „Frage von Konrad Völkel“ (Befunde 4, 8 und 10 vom 18.11.).
4. **Zu entscheiden:** `nav.weiter` vor die Zitate (5 vom 18.11.), die Schwelle für Kapitelseiten (3 vom 18.11.).
5. **Um den 25.11.:** Search Console lesen: Bericht zur Indexierung, Q&A unter „Enhancements“, die Kapitelseiten, „Temporary
   processing error“.

## 7. Wie gemessen wurde

- Crawl mit `crawl.py` (nur GET, 97 Seiten, rohes HTML je Seite gesichert), Auszählung mit `auswertung.py` gegen den Crawl vom 18.11.,
  01:20, also vor dem Umbau desselben Morgens. `robots.txt` und Sitemap mit `curl` geholt und mit dem 18.11. verglichen.
- `auszug.py` über die 29 Frageseiten des Crawls, trafilatura 2.3.1.
- `perf.mjs` dreimal (Pixel 7, CPU vierfach gebremst, langsames 4G), `wiederbesuch.mjs` einmal.
- `tools/skriptstand.mjs`: brach ab, das Skript war nicht zu erreichen. Danach `curl` gegen das Skript, die Seite des Autors und zwei
  andere Hosts der HHU, um 16:53 und 17:00.
- Search Console: Übersicht, Sitemaps, Indexierung und die URL-Prüfung für fünf Adressen, im Browser, ohne Live-Test.
- Gezählt aus dem gesicherten HTML: `robots`-Meta der vier Textseiten, die Sätze zu den Fragenden auf der Über-Seite, wer auf den
  Frageseiten als fragend genannt ist.

## 8. Nicht geprüft

Die sechs Fachprüfungen (Inhalt, Technik, strukturierte Daten, Sucherlebnis, KI-Suche, Agenten) liefen nicht neu. Skript gegen Korpus,
weil das Skript nicht zu erreichen war. Ob das Skript für alle ausgefallen ist. Rankings, Suchvolumen, Backlinks, Felddaten. Wie viele
der 35 Seiten im Index sind; geprüft sind vier und eine Kapitelseite. Googles Live-Test, diesmal nicht gefahren. Andere Extraktoren
als trafilatura. Der Zugänglichkeitsbaum im Browser. Ladezeiten auf einem echten Telefon. Bilder. Alles hinter Kurscode und Anmeldung.
