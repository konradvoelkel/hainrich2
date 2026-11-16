# Inhalt und E-E-A-T

_Stand 2026-11-16, gemessen am Host. `noindex`, Banner und leere Sitemap sind gewollt und hier kein Befund. Die Frage ist: Wie gut ist
der Inhalt an dem Tag, an dem die Vorschau endet, und was hat sich seit dem Audit vom 2026-11-06 geändert?_

**Ergebnis: Inhalt 72 von 100** (Startbereitschaft, eine Einschätzung, keine Messung). Am 2026-11-06 stand „Inhalt“ bei 75. Die Antworten
sind besser geworden, aber dazu kamen 29 dünne Kapitelseiten, 18 Antworten mit veraltetem Zitat und Titel, die bei der Hälfte das Thema
abschneiden.

| Teil | Punkte | Grund |
|---|---:|---|
| Erfahrung (20 %) | 55 | Echte Fragen aus dem Hörsaal, aber als „Beispielfrage“ markiert, ohne Herkunft. Keine Lehrerfahrung sichtbar. |
| Fachwissen (25 %) | 75 | Mathematisch sauber, belegt mit dem Skript. Dass der Prüfer der Autor des Skripts ist, steht nirgends, wo man landet. |
| Autorität (25 %) | 55 | Privates Angebot, keine HHU, keine Verweise von außen. Der Autor ist nur über das Impressum zu erschließen. |
| Vertrauen (30 %) | 85 | Bot klar gekennzeichnet, Zitat mit Link, Impressum, „Inhalt melden“, kein Tracking. Abzug: „geprüft“ ohne wer und wann, veraltete Zitate. |
| **E-E-A-T gewichtet** | **69** | Gewichte sind ein internes Modell, Google veröffentlicht keine. |
| Zitierbarkeit für KI-Suche | 70 | Direkte Aussagen, Formeln als MathML, Quellen pro Satz. Dagegen: Antwort steht oft am Ende (s12, s21), Zitate überwiegen. |
| Lesbarkeit | gut | Amstad 53 bis 75 bei 9 bis 15 Wörtern je Satz (Formeln ausgenommen), für Mathematik-Text angemessen. |

## Was ich gelesen habe

Am Host, je ein GET, 18 Anfragen: Fragen s09, s12, s20, s29, s14, s21, s19, s10, 0cfd2b864eda, bf8ec38f9c86, `ueber/`, `impressum/`,
Kapitel `adversarial-attacks-polysemie` und `logistische-regression`. s03 und s23 lagen schon von einem parallelen Abruf im
Arbeitsverzeichnis. Alle 99 Seiten zusätzlich über `crawl.json`. Dazu `lib/site.js`, `lib/forum.js`, `site/texte/ueber.md`,
`impressum.md`, `research/2026-11-05-skriptluecken/README.md` und `phase1/antworten.json` (nur lesen).

## Was gut ist

- **Transparenz am Beitrag.** Jede Bot-Antwort trägt „hAInrich2 · Bot“, den Hinweis „Diese Antwort hat ein Sprachmodell erzeugt (Claude
  von Anthropic)“ und, wenn bearbeitet, „die Moderation hat sie bearbeitet“ (s12, s21, s29). Das ist genau, was das QRG bei KI-Text
  verlangt: offen, belegt, geprüft.
- **Belege pro Satz.** Marken [1] bis [7] führen zum wörtlichen Zitat, die Bildunterschrift nennt Kapitel und Abschnitt und verlinkt das Skript.
- **Gute Antworten, wenn die Frage praktisch ist.** s23 (Conv2d) nennt die Formel im ersten Satz, rechnet ein MNIST-Beispiel durch und
  erklärt die Abrundung. s10 beginnt mit „Ja, genau so ist es.“ und leitet dann Likelihood → Log-Likelihood → BCE her. s03 und
  0cfd2b864eda sind ebenso direkt und korrekt.
- **Die Moderation hat seit dem 2026-11-06 nachgearbeitet.** s19, s10 und s09 behaupten keine falsche Lücke mehr. s12 und s21 haben einen
  von Hand geschriebenen Schlussabsatz mit der eigentlichen Erklärung.
- **Startseite (Befund 8 von damals):** H1 nennt jetzt das Skript, ein Satz erklärt Bot und Moderation, Link auf „Über“.
- **Metadaten nicht als Vorlage erzeugt:** `metadata_template.py` über 70 Paare: `site_risk` low, `templated_ratio` 0,0, keine
  gemeinsame CTA. Einzige Meldung: Markenname in der Beschreibung bei Impressum, Datenschutz, Nutzungsbedingungen (`noindex`, egal).

## Befunde

### Hoch

**1. 18 Antworten zitieren Wortlaut, den das Skript nicht mehr hat.** Der Bau prüft die Zitate gegen den eingefrorenen Korpus
vom 2026-11-04 (Regel 12), der Link führt aber ins heutige Skript. Wer klickt, findet einen anderen Text. Beispiel s12: Die
eigentliche Antwort („effizienter, um eine Funktion ℝⁿ → ℝ abzuleiten“) steht im letzten Absatz ohne Beleg, obwohl das Skript seit
dem 2026-11-06 einen Abschnitt „Warum rückwärts?“ hat (skriptluecken, Nachtrag). Für Vertrauen ist das der wichtigste Punkt: Das
Versprechen der Site ist „wörtliches Zitat“.
_Fix:_ Vor dem Ende der Vorschau die 18 Antworten gegen `korpus-aktuell` neu belegen oder neu erzeugen und prüfen, oder diese 18
bis dahin `noindex` lassen. Bis dahin im Zitatblock „Stand des Skripts: 04.11.2026“ zeigen. _Prüfen:_ `node tools/skriptstand.mjs` meldet 0.

_Berichtigung beim Zusammenführen (2026-11-16):_ Die Zahl 18 stand im Auftrag an diese Prüfung und gilt für die lokalen
Beispielantworten in `phase1/antworten.json`, nicht für den Host. Am Host nachgezählt: Von 134 Zitat-Adressen der 31 Fragen gibt es
4 im aktuellen Korpus nicht mehr (Abschnitt plus erste acht Wörter), je eine in s12, s19, s29 und 0cfd2b864eda. Das ist eine
untere Grenze, eine Änderung nach dem achten Wort sieht dieser Vergleich nicht; die genaue Liste zeigt die Moderation. Der Befund
bleibt, sein Umfang ist kleiner. `tools/skriptstand.mjs` liest `antworten.json` und kann am Host nicht 0 melden.

**2. „geprüft“ sagt nicht, wer prüft und wann.** Auf jeder Frageseite steht beim Bot `04.11.2026 · geprüft`. Das Datum ist das der
Frage (`dateOf(tag)` in `answerCard`, `lib/site.js:158`), nicht das der Prüfung. Wer prüft, steht nirgends. Dass der Prüfer der
Autor des Skripts ist, erfährt man nur im Impressum unter „Lizenzen“. `ueber/` nennt Konrad Völkel einmal, im letzten Satz, ohne
Rolle. Wer über die Suche auf s09 landet, sieht also: ein Bot, ein grünes Wort, „Prüfen Sie das Zitat“, „sie können falsch sein“.
Das ist ehrlich, aber es verschenkt das stärkste Signal der Site.
_Fix:_ Bei geprüften Bot-Antworten „geprüft von Konrad Völkel, Autor des Skripts, am TT.MM.JJJJ“ mit Link auf die Person (die
Karte gibt es schon für Moderationsantworten, bf8ec38f9c86). Den Satz „Prüfen Sie das Zitat“ bei „geprüft“ weicher fassen. In
`ueber.md` einen Absatz „Wer prüft“: Autor des Skripts, hält die Vorlesung. Ob die Rolle an der HHU genannt wird, entscheidet
Konrad, die Distanzformel im Impressum bleibt. _Prüfen:_ s09 zeigt Name, Rolle und Prüfdatum ohne Klick.

**3. 28 Kapitelseiten gingen beim Start dünn in den Index.** Alle 29 Seiten unter `f/kapitel/` haben 133 bis 181 Wörter (Crawl). Der
eigene Inhalt ist die H1 „Fragen zu „X““ und ein bis zwei Fragetitel; der Rest ist Pfad, Suchhinweis („lädt dafür rund 24 MB“)
und Fuß, auf allen gleich. 24 Kapitel haben genau eine Frage, 4 zwei, `adversarial-attacks-polysemie` keine. `kapitelPage` setzt
`index,follow`, sobald eine Frage geprüft ist (`lib/site.js:297`), die Sitemap nimmt sie auf (`:376`). Die Beschreibung ist
29-mal derselbe Satz mit anderem Kapitelnamen. Eine Kapitelseite mit einer Frage ist eine Kopie der Liste im Unterforum.
_Fix:_ Kapitelseiten erst ab drei geprüften Fragen indexieren, darunter `noindex,follow` (die Links zählen weiter). Sinnvolle
Landeseiten werden sie mit zwei, drei Sätzen „Worum es im Kapitel geht“ aus dem Skript (Einleitung, verlinkt), den Fragen mit
dem ersten Satz ihrer Antwort statt nur dem Titel, und einer Beschreibung, die die Fragen nennt. _Prüfen:_ Bau mit `--release`:
keine Kapitelseite unter drei Fragen in der Sitemap.

### Mittel

**4. Titel schneiden bei rund der Hälfte das Thema ab.** Alle 31 Fragetitel enden auf „…“ (46 bis 64 Zeichen, die Grenze 65 hält).
Weil „ | hAInrich2“ 12 Zeichen kostet, fällt oft genau der Suchbegriff weg: s13 „Warum muss ich vor jedem Schritt …“ (zero_grad),
s14 „Wie merke ich überhaupt, dass bei mir …“ (ReLU), s18 „Wozu braucht man beim VAE den …“ (Reparametrisierungstrick), s29 „…
besser …“ (Adam), bf8ec38f9c86 (PyTorch), s08 (Sigmoid), s21 (Skip Connections), s28 (weiche Wahrscheinlichkeiten). Befund 4 vom
2026-11-06 ist damit formal erledigt, inhaltlich nicht.
_Fix:_ Kurztitel in der Moderation (Feld, das `questionTitle` vorzieht), z. B. „optimizer.zero_grad(): warum vor jedem Schritt?“.
Ohne Kurztitel: Suffix auf Frageseiten weglassen, das gibt 12 Zeichen. _Prüfen:_ Crawl: kein Titel endet auf „…“, jeder enthält
das Fachwort der H1.

**5. Beschreibungen mit Lücken und Leerstellen.** Die Beschreibung ist jetzt der Anfang der Antwort (Befund 3 erledigt). Aber 8
von 31 haben Auslassungen statt Formeln mitten im Satz: s03 „Der Gradient von … an der Stelle a ist der Vektor …, also …“, s09,
s15 „berechnet ….“, s12, s21, s23, s28. s12 beginnt mit „- “ (Listenzeichen), s14 enthält „[es]“. s29 („…bleibt daher offen“),
s20 und s22 sagen zuerst, was das Skript nicht hat. Fünf sind unter 70 Zeichen (s01, s25, s19, s20, s27).
_Fix:_ Erste Sätze ohne „…“ nehmen, sonst den Kurztitel plus Kapitel. Listenzeichen und eckige Klammern in `excerpt` entfernen.
Bei Negativantworten eine eigene Beschreibung durch die Moderation. _Prüfen:_ keine Beschreibung mit „…“ vor dem Ende, keine mit „- “.

**6. Antwortreste aus dem Abruf und aus dem Skript.** Gelesen auf dem Host:
- s29: „Die Skriptpassagen vergleichen SGD und Adam nicht … bleibt daher offen.“ Das Wort „Passagen“ ist Sprache der Suche, nicht
  des Lesers. Laut `skriptluecken` (Nachtrag) wurde „offen“ bei s29 gestrichen, der Einstieg sagt es aber weiter. Die Frage ist eine
  echte, oft gesuchte Frage; die Seite beantwortet sie nicht.
- s09: „Genau diese Form hat w·x + b unten“ — „unten“ verweist auf eine Abbildung im Skript, nicht auf der Seite.
- s03: „Für f wie oben ist ∇f(1,2) = (8,3)ᵀ“ — f ist in der Antwort nie definiert.
- s14: „wenn [es] immer 0 liefert“, „τ = max(0, y) […]“, „Bei ihnen ist die Ableitung […] nirgends“: Zitierklammern im Fließtext.
- s21: Tippfehler „ortohogonale“ im handgeschriebenen Absatz.
- s12, s21: Erst Bausteine mit fetter Überschrift („Das Vorgehen im Skript.“, „Umsetzung in PyTorch.“), die eigentliche Antwort
  kommt im letzten Absatz. Für Suche und KI-Zitate sollte sie oben stehen.
_Fix:_ Moderation: Einstieg mit der Antwort, Verweise „oben/unten“ auflösen, Klammern glätten. s29 und s20 (und s22) entweder
selbst beantworten (Vorschläge mit Literatur stehen in `skriptluecken`) oder bis dahin `noindex`. _Prüfen:_ grep im Bau nach
`Passage`, ` oben`, ` unten`, `[…]`, `[...]` in Antworttexten: 0.

**7. Zitate überwiegen die Antwort, und sie sind öffentlich anderswo.** Gezählt ohne doppelten KaTeX-Text: s09 284 Wörter Antwort zu
935 Zitat, s12 216 zu 562, s29 186 zu 501, s21 214 zu 509, s20 264 zu 473, 0cfd2b864eda 242 zu 468, s03 277 zu 472; nur s23 hat
mehr Antwort (232 zu 176). Die Zitate stehen wortgleich im öffentlichen Skript (CC BY-SA, verlinkt). Das ist kein Spam, aber
Google wählt für den Zitattext das Skript als Original, und ein Snippet aus dem Zitat wäre Skripttext. Dazu kommt: s09 und s12
übernehmen ganze Skriptsätze in die Antwort. Die Wortzahlen im Crawl (s09: 2959) sind durch MathML und KaTeX doppelt gezählt.
_Fix:_ `data-nosnippet` an `<section class="zitate">`, damit Snippets aus der Antwort kommen. Optional die Zitate auf die belegten
Absätze kürzen statt ganzer Abschnitte. _Prüfen:_ HTML einer Frageseite: `data-nosnippet` am Zitatblock.

**8. Kein Weg von der Frage weiter.** Frageseiten verlinken weder ihre Kapitelseite (die Zeile unter der H1 ist reiner Text, der
Pfad endet ohne Link), noch verwandte Fragen, noch „Frage stellen“ (Crawl: `inlinks` von s09 ohne `f/kapitel/`). Jede Frage hat
genau zwei interne Links auf sich: Unterforum und Kapitel. Wer über die Suche auf s09 landet, kommt nur zurück zur Liste.
_Fix:_ Kapitelzeile verlinken, darunter zwei bis drei Fragen desselben Kapitels oder Unterforums. _Prüfen:_ Crawl: jede Frage
verlinkt ihre Kapitelseite.

### Niedrig

**9. Keine Frische-Signale.** Sichtbar ist nur das Datum der Frage (04.11. oder 05.11.2026), bei Frage und Antwort gleich. Es gibt
kein „zuletzt bearbeitet“, kein `dateModified`, keinen `lastmod` (Befund 13 von damals offen). `Last-Modified` im Kopf ist die
Bauzeit (16.11.2026 04:30), nicht die der Antwort. _Fix:_ Datum der Antwort und der letzten Bearbeitung zeigen und in die Sitemap.

**10. Testfragen (Befund 10).** 0cfd2b864eda ist inhaltlich eine der besten Seiten (direkt, korrekt, vier Belege). Die H1 zeigt
„etwas lineares“ klein, das ist Studierendentext, kein Problem. bf8ec38f9c86 hat 79 Wörter Antwort, 163 auf der Seite, ohne
Beleg, mit der Zahl „über 80% des Forschungscodes“ ohne Quelle. Dafür die einzige Seite mit Name und Foto des Prüfers. _Fix:_
Quelle für die 80 % ergänzen oder den Satz ohne Zahl; die Seite ist sonst als dünne Meinung indexiert.

**11. „Beispielfrage“ ohne Herkunft.** 29 von 31 Fragen tragen „Beispielfrage“, `ueber/` sagt aber „Die Fragen kommen von
Studierenden“. Laut `skriptluecken` stammen einige aus Transkripten des Hörsaals, die übrigen hat ein Modell erzeugt. Für
Erfahrung zählt das: Eine Frage, die so im Hörsaal gestellt wurde, ist ein echtes Signal. _Fix:_ Badge unterscheiden („aus der
Vorlesung“ und „Beispielfrage“) und in `ueber.md` einen Satz dazu.

**Info.** Unterforen (157 bis 339 Wörter) sind als Listen in Ordnung, die Beschreibungen nennen die Themen. Die 29
`f/neu/?kapitel=`-Varianten sind `noindex` und zeigen per Canonical auf `f/neu/`, bleiben so. Startseite 170 Wörter reicht für ein
Forum, dessen Inhalt in den Fragen liegt.

## Was sich seit dem 2026-11-06 geändert hat

| Befund damals | Heute |
|---|---|
| 1 Alle geprüft, falsche „offen“-Aussagen | s09, s10, s19 bereinigt. s29 sagt im Einstieg weiter „offen“, s20 zu Recht. Neu: 18 veraltete Zitate (Befund 1). |
| 3 Beschreibungen leer | Erledigt, aus der Antwort. Neue Schwächen: Formellücken, Listenzeichen (Befund 5). |
| 4 Titel zu lang | Erledigt, alle ≤ 65. Neue Schwäche: Thema abgeschnitten (Befund 4). |
| 8 Startseite dünn | Erledigt. |
| 10 Testfragen | Bleiben. 0cfd2b864eda gut, bf8ec38f9c86 dünn (Befund 10). |
| neu | 29 Kapitelseiten, fast alle dünn (Befund 3). |

## Nicht geprüft

17 der 31 Fragen habe ich nicht am Host gelesen (s01, s02, s04 bis s08, s11, s13, s15 bis s18, s22, s24 bis s28), nur Titel und
Beschreibung aus dem Crawl und die Opus-Fassung in `phase1`. Die Liste der 18 veralteten Zitate habe ich nicht selbst erzeugt
(`tools/skriptstand.mjs` nicht ausgeführt), die Zahl stammt aus dem Auftrag. Fachliche Richtigkeit habe ich bei den gelesenen
Antworten geprüft, nicht gegen Literatur. Keine Daten von Google, kein Suchvolumen, keine Prüfung, wie Google KaTeX-Seiten
tatsächlich ausliest. Datenschutz, Nutzungsbedingungen und die Moderationsseiten habe ich nicht gelesen.
