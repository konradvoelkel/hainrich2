# KI-Suche (GEO), Stand 2026-11-17 (dritter Durchgang)

Grundlage: rohes HTML in `seiten/` (alle 31 Frageseiten maschinell, 12 von Hand gelesen: s01, s03, s05, s09, s10, s12, s15,
s17, s20, s23, s27, s29), `robots.txt`, `crawl.json`, `lib/site.js`, `lib/render.js`, `site/texte/*.md`. Extraktor:
`trafilatura` 2.3.1, schon vorhanden in der venv des SEO-Plugins (`~/.local/share/claude-seo/.venv`), nichts installiert,
nur auf lokale Kopien angewandt. Alle Umbauversuche liefen auf Kopien im Speicher (BeautifulSoup), keine Datei der Site verändert.

## 1. Gegen gestern (Bericht vom 16.11.)

| Nr. | Punkt | Stand | Beleg |
|---|---|---|---|
| 1 | Keine Regel je KI-Crawler | anders | Entschieden: alles bleibt offen. Offen bleibt nur der eine Satz in den Rechtstexten (unten N5) |
| 2 | Extraktor verliert die Frage | **offen** | trafilatura: Frage im Text bei 1 von 29 Seiten (s10), 0 von 2 Testfragen. `div.faden` umschließt beide, ändert aber nichts (unten N1) |
| 3 | Formeln dreifach im Text | anders | `lib/render.js:47` weiter `htmlAndMathml` (s09: 110 `katex-html`). trafilatura 2.3.1 macht im Hauptpfad aus der MathML-Annotation sauberes `\(…\)`-TeX (20 von 29 Seiten); dreifach nur im Ausweichpfad (9 von 29) und bei einfachen `textContent`-Auszügen |
| 4 | Kern der Antwort am Ende | offen | s12 unverändert („Grundlage ist die Kettenregel“, der Grund steht im letzten Satz). Auszählung aller 29 unten (N2) |
| 5 | Betreiber und Lizenz fehlen | behoben | Fuß „Ein privates Angebot von Konrad Völkel“, Lizenzzeile am Zitatblock und unter dem Faden, `license` in Frage und Antwort, `<time datetime>` an Frage und Prüfung, QAPage + Person |
| 5a | `<blockquote cite>` | offen | 14 `<blockquote>` in s09, keins mit `cite`. Der Link steht in der `figcaption`; das reicht in der Praxis, `cite` wäre nur sauberer |
| 6 | „geprüft“ und „Prüfen Sie das Zitat“ widersprechen sich | offen | `lib/site.js:272` hängt den Satz an jede Bot-Antwort, auch neben „Geprüft am … von Konrad Völkel“ (z. B. s23) |
| 7 | Lange Zitate | anders | Jetzt in `<details>` und mit `data-nosnippet`. Bewertung unten (N3) |
| – | `llms.txt` | offen, mit Absicht | Keine Datei; Urteil unten unverändert: lohnt nicht |

## 2. Neue Befunde

### Hoch

**N1. Die Frage fehlt im extrahierten Text weiter, die Ursache ist jetzt eingegrenzt.**
Wo: jede Frageseite, `div.faden > article.frage > aside.autor + div.inhalt > header + h1`.
Gemessen: `trafilatura.extract()` auf allen 29 Seiten s01–s29: Frage drin 1/29; Prüfvermerk drin 9/29; Zitatblock drin 10/29.
trafilatura nimmt zuerst `(.//article)[1]`, das ist die Frage-Karte; nach dem Ausdünnen (Kopfzeile, Linkdichte, `p.meta`)
bleibt nur die H1, die als „Überschrift am Ende“ gestrichen wird. Dann greift die Regel `@class='text'`, also nur der Antworttext.
Versuche an Kopien, je 29 Seiten:

| Umbau | Frage im Text | Prüfvermerk |
|---|---|---|
| heute | 1 | 9 |
| H1 vor `div.faden` gezogen | 1 | – |
| `header` der Frage-Karte zu `div` | 1 | – |
| `div.faden` → `<article>` | 0 | 29 |
| `div.faden` → `<article>`, `header` hinter die H1 | 0 | 29 |
| **`div.faden` → `<article>`, H1 als erstes Kind der Frage-Karte (vor `aside`)** | **27** | **29** |

Mit dem letzten Umbau beginnt der Auszug mit der Frage, die Formeln kommen als TeX, der Prüfvermerk steht drin (das Datum
fällt bei 27 von 29 heraus, trafilatura verwirft den Inhalt von `<time>`). Ohne Frage ist eine Passage wie „Ja, genau so ist es.“
für eine Antwortmaschine wertlos. Warum genau die Stellung der H1 entscheidet, habe ich nicht bis ins Letzte verstanden;
das Ergebnis ist reproduzierbar. Andere Extraktoren (Readability-Varianten, eigene der Anbieter) nicht geprüft.
Tun: in `lib/site.js:320` die H1 an den Anfang von `article.frage` setzen, die Optik per CSS-Grid halten; `div.faden` als
`<article>`. Woran man es sieht: das Skript aus diesem Bericht (trafilatura auf `seiten/`) meldet ≥ 27/29 mit Frage.

### Mittel

**N2. Erster Satz: knapp die Hälfte antwortet für sich allein.** Ausgezählt an allen 29 Antworten (erster Satz im JSON-LD-Text):
- Direkt und für sich wahr (14): s01, s02, s04, s06, s09, s11, s13, s16, s19, s23, s24, s25, s26, s28. Muster: „Die Lernrate ist
  ein Hyperparameter, kein Parameter.“ (s01), „Nein, ein Autoencoder-Decoder ist keine Voraussetzung.“ (s25).
- Antwort da, aber an die Frage gebunden (6): s03 „Ja, genau so …“, s07 „Beides stimmt ein Stück weit.“, s08, s10 „Ja, genau so
  ist es.“, s14, s17 „Sie haben recht: …“. Der zweite Satz trägt jeweils; ein Extraktor ohne Frage (N1) liefert Unsinn.
- Erst Definition oder Voraussetzung, Kern später (5): s05, s12, s15, s18, s21.
- „Das Skript sagt dazu nichts direkt“ (4): s20, s22, s27, s29. Ehrlich und richtig, aber für Antwortmaschinen der schwächste
  Einstieg; s27 beginnt mit „Genau dieses Szenario wird im Skript … behandelt“ und hat danach eine gute Antwort.
Länge: 121 Absätze/Listenpunkte in den Antworten, Median 45 Wörter, längster 117, keiner über 170; 48 unter 40 Wörtern.
Eine Antwort hat 209–584 Wörter und 4–11 Zitatmarken. Für Zitierbarkeit sind das gute Bausteine; der Engpass ist der erste Satz,
nicht die Länge. Tun: wie gestern, eine Zeile im Prompt („erster Satz beantwortet die Frage ohne ‚Ja‘/‚Sie haben recht‘ davor“),
für die 11 Bestandsfälle redaktionell den Kernsatz nach vorn. Prüfen: Auszählung wiederholen, Ziel ≥ 24/29.

**N3. Zitatblock, `data-nosnippet`, `<details>`, Marken, Formeln: was eine Antwortmaschine davon hat.**
- `data-nosnippet` sitzt an `section.zitate` (je Seite genau 1×). Nach meinem Wissen (nicht nachgeschlagen) beachtet Google das
  für Snippets und für KI-Übersichten aus dieser Seite; ob Bing/Copilot es beachten, weiß ich nicht sicher; für OpenAI,
  Perplexity und Anthropic kenne ich keine Zusage. trafilatura ignoriert es (nachgeprüft: im Ausweichpfad und nach dem Umbau aus
  N1 steht der Block im Text). Urteil: **kleiner Gewinn**. Der Wortlaut gehört dem Skript, das selbst offen liegt; bei Google
  konkurriert die Frageseite so nicht mit dem Skript um dieselbe Passage, sondern wird für die Erklärung genommen. Kosten: die
  Lizenzzeile „Aus dem Skript … von Konrad Völkel, CC BY-SA 4.0“ liegt im selben Block und ist damit ebenfalls aus dem Snippet
  genommen; sie steht aber noch unter dem Faden (`p.lizenz` in `main`) und im JSON-LD. Lassen.
- `<details>`: der volle Wortlaut steht im HTML; für Crawler ohne CSS ist er so lesbar wie offen. Kein Verlust.
- Marken `[1]` kleben am Wort („Ableitungen[1], also“). Im JSON-LD-Text sind sie entfernt (gut). Wenig Rauschen, kein Handlungsbedarf.
- Formeln: im JSON-LD als `$…$`-TeX, im trafilatura-Hauptpfad als `\(…\)`-TeX, beides ist das Beste für Sprachmodelle. Der
  HTML-Anteil von KaTeX bleibt Ballast (s09 186 KB), betrifft aber eher Technik als Zitierbarkeit.

**N4. Herkunft: sichtbar reicht es, maschinenlesbar fehlt die Prüfung.**
Sichtbar an jeder Seite (nachgeprüft): Bot als „hAInrich2 · Bot“, Hinweis „Sprachmodell (Claude von Anthropic)“, „Geprüft am
<Datum> von Konrad Völkel, Autor des Skripts“ mit Link auf `ueber/#wer-prüft` (dort: wer, was geprüft wird, gegen welchen
Skriptstand), Lizenz der Frage und der Antwort, Quelle je Zitat als Link mit Textfragment, Betreiber im Fuß. Damit kann eine
Antwortmaschine sauber zuschreiben: „laut hAInrich2, KI-Antwort, vom Skriptautor geprüft, Quelle Skript Kapitel X“.
Im JSON-LD fehlt: Prüfer und Prüfdatum (stehen nur im Autor-Namen als Satz „…, von der Moderation geprüft“, ohne Datum und ohne
Person); `dateCreated` an der Antwort (nur 8 von 31 haben `dateModified`); die Person hat nur `name` und `url` (kein `sameAs`,
keine Rolle); die `citation` hat keinen `author` und keine `license`. Tun (klein): an der `QAPage` `reviewedBy` → `#betreiber`
und `lastReviewed` (beides WebPage-Eigenschaften, QAPage ist eine WebPage); `dateCreated` an `Answer`; an der `citation`
`author` → `#betreiber`. Mit dem Bericht `strukturierte-daten.md` abstimmen, der für die Prüfung `editor`/`contributor` vorschlägt.
Woran man es sieht: der Graph sagt ohne Freitext, wer wann geprüft hat.

**KI-erzeugt, was folgt daraus (Einschätzung).** Nach meinem Wissen bestraft Google KI-Text nicht als solchen; die Grenze ist
massenhaft erzeugter Inhalt ohne Mehrwert („scaled content abuse“). Hier: wenige Seiten, echte Fragen, wörtliche Belege,
menschliche Prüfung, nur Geprüftes indexierbar. Das ist das Gegenteil des Musters. Für ChatGPT Search, Perplexity, Claude kenne ich
keine Regel, die gekennzeichnete KI-Antworten ausschließt. Unsicher bin ich bei: (a) ob Trainingspipelines KI-gekennzeichneten Text
herausfiltern (betrifft Training, nicht Suche); (b) ob Antwortmaschinen bei gleichem Inhalt die Primärquelle vorziehen, also das
Skript statt der Frageseite. (b) halte ich für wahrscheinlich, und das ist hier kein Schaden: Der Eigenwert der Frageseite ist die
Frage im Wortlaut der Studierenden und die Brücke zwischen mehreren Skriptstellen. Genau deshalb zählen N1 und N2.

### Niedrig

**N5. Folge der offenen `robots.txt`.** Nachgeprüft: nur `User-agent: *`, gesperrt `models/ wasm/ daten/ mod/ api/`.
Bis zum Ende der Vorschau hält `noindex` die Seiten aus Google, AI Overviews (folgen Googlebot) und Bing/Copilot; ob
OAI-SearchBot, Claude-SearchBot und PerplexityBot `noindex` achten, ist nicht gemessen. Trainings-Crawler (GPTBot, ClaudeBot,
CCBot, Google-Extended, Applebot-Extended, cohere-ai) dürfen schon heute holen, `noindex` hält sie nicht ab. Danach: volle
Sichtbarkeit in allen Antwortmaschinen, Aufnahme in Trainingsdaten möglich. Das passt zu CC0 für Fragen und CC BY-SA für
Antworten; dass Training die Namensnennung aus BY-SA einhält, sichert die Lizenz praktisch nicht. Offen bleibt nur ein Satz in
`datenschutz-fragen.md` oder den Nutzungsbedingungen („Öffentliche Seiten lesen auch Suchmaschinen und KI-Dienste, auch zum
Training“): heute steht dort nur, dass Anthropic die API-Eingaben nicht zum Training nutzt, was man für die öffentlichen Seiten
missverstehen kann (`datenschutz-fragen.md:25`). Weg über `RECHTSTEXTE.md`.

**`daten/` sperren kostet nichts.** Jede Frage steht im Wortlaut im HTML ihrer Seite, mit eigener URL, Antwort und Quelle. Eine
Antwortmaschine braucht die URL zum Zitieren; `fragen.json` hat keine Antwort und ist mit Vektoren Ballast. Die Sperre ist ein
Hinweis, kein Schutz: Die Datei bleibt per URL abrufbar.

**N6. `llms.txt`: lohnt nicht.** Kein großer Anbieter hat nach meinem Stand zugesagt, sie zu lesen; die Seiten sind fertiges HTML
ohne JS, die Kapitelseiten sind schon die Linkliste. Wenn doch, dann vom Build erzeugt, zehn Zeilen: was die Site ist, Lizenzen,
Hinweis „Antworten von Claude, vom Skriptautor geprüft“, Link auf die Kapitelseiten und auf die `llms-full.txt` des Skripts (deren
Existenz habe ich nicht geprüft). Nicht von Hand pflegen. Gewicht weit unter N1 und N2.

**N7. Prüfvermerk ohne Datum im Auszug.** trafilatura verwirft `<time>`; nach dem Umbau aus N1 steht „Geprüft am von Konrad
Völkel“. Falls N1 umgesetzt wird: Datum zusätzlich als reinen Text neben das `datetime`, oder es hinnehmen (im JSON-LD steht es nach N4).

**Marke, der erste Schritt am Tag nach der Vorschau.** Die stärkste Verbindung, die es geben kann, ist schon in eigener Hand:
von jedem Kapitel des Skripts ein Link „Fragen zu diesem Kapitel“ auf die passende Kapitelseite des Forums (sobald sie
indexierbar ist), dazu ein Link von konradvoelkel.com. Das Skript ist die Primärquelle, die Antwortmaschinen ohnehin finden; der
Link bindet Name, Autor und Forum an sie. Dann `sameAs` an der Person (eigene Site, ggf. ORCID, GitHub). Reddit, YouTube,
Wikipedia sind für ein Kursforum nicht das Maß; ein Blogeintrag zum Start genügt. Das deckt sich mit dem gespeicherten Plan
(Skript-Links und Blog-Link nach der ersten Studierendenfrage).

## 3. Punkte (Einschätzung, keine Messung)

| Teil | Gewicht | 16.11. | 17.11. | Grund |
|---|---|---|---|---|
| Zitierbarkeit | 25 % | 65 | 70 | Kurztitel, sauberer JSON-LD-Text; erster Satz bei 14/29 stark, sonst unverändert |
| Struktur | 20 % | 70 | 70 | Gemeinsames Element da, Frage fehlt im Auszug aber weiter (1/29) |
| Multimodal | 15 % | 45 | 45 | Unverändert, für den Inhalt kaum relevant |
| Autorität (auf der Seite) | 20 % | 60 | 82 | Prüfer mit Name, Rolle, Datum; Lizenzen; Betreiber; QAPage; nur die Prüfung fehlt im Graph |
| Technischer Zugang | 20 % | 75 | 78 | Alles im rohen HTML, `<time>` da, TeX für moderne Extraktoren |

**Gesamt: gestern 62, heute 70.** Herkunft und Lizenz sind jetzt vorbildlich; was fehlt, ist die Frage im Auszug (N1) und ein
direkter erster Satz bei 15 von 29 Antworten (N2). Mit N1 läge der Bereich bei etwa 76, mit N1 und N2 über 80.

## 4. Nicht geprüft

- Andere Extraktoren als trafilatura 2.3.1 (Readability, die eigenen der Anbieter); kein Abruf am Host, keine Bot-Protokolle.
- Ob OAI-SearchBot, Claude-SearchBot, PerplexityBot `noindex` und `data-nosnippet` achten; Googles und Bings aktuelle Doku zu
  `data-nosnippet` in KI-Antworten: nur aus Wissen, nicht nachgeschlagen.
- Marken- und Erwähnungssignale außerhalb der Site (Wikipedia, Reddit, YouTube, LinkedIn, ChatGPT-Sichtbarkeit): Name und Host
  gingen an keinen Dienst. Ob es die `llms-full.txt` des Skripts gibt, ebenfalls nicht geprüft.
- Ob der Umbau aus N1 die Optik oder den Zugänglichkeitsbaum ändert; nur am Extraktor gemessen.
- Die zwei Testfragen nur maschinell (beide ohne Frage im Auszug; `bf8ec38f9c86` hat eine Moderationsantwort ohne Zitat).
