# Agentenlesbarkeit, /eidl/ (Stand 2026-11-17, dritter Durchgang)

Geprüft an: rohem HTML von s09, s13, bf8ec38f9c86, `eidl.html`, `eidl__f__neu.html`; Quelltext `lib/site.js`, `site/app.js`, `fragen.js`, `stimmen.js`, `zitate.js`, `style.css`. Nichts ausgeführt, kein Host, kein Dienst. Der Zugänglichkeitsbaum ist **aus dem HTML und CSS gelesen, nicht aus einem Browser gemessen**. Lighthouse und die Plugin-Skripte (`agentic_check.py` ruft den Host ab) habe ich nicht benutzt: Es gibt keinen Wert X/N. Kontrastzahlen sind Schätzungen aus den oklch-Werten, keine Messung.

## 1. Gegen gestern

| Punkt vom 16.11. | Stand | Beleg |
|---|---|---|
| Einwilligungstext erst nach Kurscode | **anders** (teils) | `f/neu/`: statischer Absatz sagt nur „Was mit einer Frage geschieht, steht unter Datenschutz“ mit Link. Der Satz „öffentlich, Anthropic (USA)“ fehlt weiter vor dem Code. Das Formular ist neu `hidden` bis Token, der Text darin ist ausführlicher (CC0, Einwilligung). |
| Fokus nach „Weiter“ / Absenden | **behoben** | `fragen.js` Z. 154 `text.focus()`; nach dem Absenden `role=status`-Text plus `h2` mit `tabIndex=-1` fokussiert (Z. 178-183). |
| Suchergebnisse nicht angekündigt, Suche kein Landmark | **behoben** | `app.js` `melde()`: „n Fragen und m Stellen im Skript gefunden“ in `#suchstatus` (`role=status`); `eidl.html`: `section role="search" aria-label="Suche im Forum"`. |
| Stimmenzähler ohne Namen, ohne Ansage | **offen** | `<span class="punkte" title="Punkte">0</span>` unverändert, keine `role=group`, kein `aria-live`; Stimmbox weiter im `aside.autor`. |
| Antworten ohne Namen, `[1]`/`#2` ohne Sinn | **behoben** | `article aria-label="Antwort des Bots"` / „Antwort der Moderation“ / „Frage“; `a.nummer aria-label="Beitrag 2"`; `a.marke-zitat aria-label="Zitat 1"`. Der `h2` „Originaltext aus dem Skript“ steht weiter je Antwort (gleichlautend), jetzt unkritisch. |
| Kein Sprunglink | **behoben** | `<a class="sprung" href="#inhalt">Zum Inhalt</a>` als erstes Element, `main id="inhalt"`; CSS zeigt ihn bei Fokus. |
| Vorschau-Banner | **unverändert**, kein Mangel | `p.vorschau` vor dem Kopf. |
| Entdeckungsdateien / Zugriffsrichtlinie | **unverändert** | Siehe 5; robots.txt laut Auftrag fest. |

## 2. Neue Befunde, nach Gewicht

### Mittel: „Melden“ ist ohne Zusammenhang und trägt keinen Beitragsbezug
- Wo: jeder Beitrag, `a.melden href="../../impressum/#inhalte-melden"` (s09, s13: je 2; bf8: 2). Dazu im Fuß „Inhalt melden“, gleiches Ziel.
- Warum: Ein Vorleseprogramm, das die Linkliste vorliest, hört zweimal „Melden“ und einmal „Inhalt melden“. Gleicher Name bei gleichem Ziel ist formal erlaubt (WCAG 2.4.4 verlangt Verständlichkeit aus Linkziel oder Zusammenhang; ob der Zusammenhang „im selben Beitrag-Kopf“ dafür genügt, ist Auslegung, ich habe die Norm nicht nachgeschlagen). Schwerer wiegt die Funktion: Das Ziel kennt den Beitrag nicht. Ein Agent oder Mensch landet im Impressum und muss Seite und Beitragsnummer selbst nennen.
- Fix: `aria-label="Beitrag 2 melden"` (oder `aria-labelledby`, das auf die Nummer zeigt), Ziel mit Bezug, etwa `…/impressum/?beitrag=s13-b2#inhalte-melden` oder ein `mailto:` mit Betreff; die Seite `impressum/` müsste das ausgeben (dann braucht es JS oder fertigen Text).
- Belegt, dass es half: Linkliste im Baum zeigt „Beitrag 2 melden“; die Meldung nennt den Beitrag.

### Niedrig: eingeklapptes Zitat, was Programme sehen
- Beleg (`lib/site.js` Z. 238, `style.css` Z. 94): `<summary><span class="anriss">…</span> <span class="mehr zu">ganzes Zitat</span><span class="mehr auf">einklappen</span></summary>`; CSS blendet bei geschlossen `.auf`, bei offen `.anriss` und `.zu` mit `display:none` aus.
- Mit CSS und Zugänglichkeitsbaum (angenommen: `display:none` fällt aus dem Namen, das ist Browserverhalten, hier nicht gemessen): geschlossen heißt der Knopf „Anriss … ganzes Zitat“, offen „einklappen“, Zustand `expanded` kommt vom Browser. Das ist brauchbar. Die zwei Beschriftungen sind kein Problem.
- Ohne CSS (Textauszug, Reader-Modus, Agent, der das DOM zieht): Anriss, „ganzes Zitat“, „einklappen“ stehen als „…ganzes Zitateinklappen“ ohne Leerzeichen zwischen den beiden `mehr`-Spans, dann das volle Zitat. Der Anriss doppelt den Anfang des Zitats mit „…“. Das ist Rauschen, kein Fehler, Volltext ist immer im DOM (auch `data-nosnippet`, das nur Suchausschnitte betrifft).
- Fix (klein): Leerzeichen zwischen die `mehr`-Spans oder `.auf` mit `aria-hidden`; sonst nichts. Der Link `[1]` setzt per `zitate.js` das `details` auf; ohne JS bleibt es zu, der Text ist trotzdem erreichbar (Klick auf Zusammenfassung).

### Niedrig: Stimmenzähler (wie gestern, offen)
Name nur über `title`, Zähler ändert sich ohne Ansage, Pfeile `hidden` bis `stimmen.js` läuft (Z. 74), also ohne JS und für Agenten ohne Skriptausführung: nur eine unbenannte „0“ oder „1“. Fix: `<span class="punkte"><span class="nur-lesen">Punkte: </span>1</span>` und `role=group aria-label="Bewertung"` am `.stimme`; Pfeile bleiben `hidden` (das Verstecken bis JS ist richtig, sonst gäbe es tote Knöpfe).

### Niedrig: Zwischenüberschriften der Bot-Antwort sind `<strong>`
s13 Antwort: „**Woher die Gradienten kommen.**“ usw. sind fett im Absatz, keine Überschriften. Überschriftennavigation überspringt sie. Die Überschriftenfolge selbst ist sauber (`h1` Frage, dann `h2` „Originaltext aus dem Skript“; nie eine Stufe übersprungen). Fix nur, wenn die Antwort-Erzeugung es billig kann (`h3` wäre unter dem `h1` korrekt, `h2` besser nach Rollen). Sonst lassen.

### Niedrig: kleine Unstimmigkeiten
- Moderationsantwort (bf8): Autorlink führt auf `https://www.konradvoelkel.com` (extern, `rel=noopener`), der Bot-Link auf `ueber/`. Beides in Ordnung, der Linkname „Konrad Völkel“ sagt nicht, dass er die Site verlässt.
- Moderationsantwort trägt keinen Prüfvermerk „Geprüft am…“, nur Badge „geprüft“ und Datum. Gewollt? Als Vermerk redundant (Moderation ist der Prüfer); dann ist es folgerichtig.
- Zwei Absätze `p.lizenz` auf s13 (einer im Zitatblock, einer am Ende der Seite): verschiedene Aussage (Skript vs. Antworten), beide ok.
- Prüfvermerk-Link `href="../../ueber/#wer-prüft"` hat ein nicht ASCII-Zeichen im Fragment; Ziel `id="wer-prüft"` existiert auf `ueber/`. Funktioniert in Browsern, Agenten mit eigenem URL-Parser können es verfehlen. Eine ASCII-ID wäre robuster (niedrig).

## 3. Zugänglichkeitsbaum der Frageseite (gelesen)

Reihenfolge s13: Link „Zum Inhalt“, Text „Vorschau, nicht veröffentlicht.“, `banner`-artiger `header.kopf` (ein `header` direkt im `body` ist Landmarke `banner`), `main`, darin `nav „Pfad“`, zwei `article` („Frage“, „Antwort des Bots“), Absatz Lizenz, `nav „Weitere Fragen“`, `contentinfo` mit unbenannter `nav` (zweite `nav` ohne Name: bei drei `nav` auf der Seite gleichnamig-ungenau; ein `aria-label="Fußleiste"` wäre schöner, niedrig).
- Die `header` in den `article` sind keine Landmarken (richtig). `aside.autor` im `article` ist eine „complementary“-Landmarke je Beitrag, wenn Reader sie so ausgeben: pro Beitrag eine Landmarke „complementary“ ohne Namen, bei langen Fäden Lärm. Das ist eine Annahme zum Reader-Verhalten (in Chromium: `aside` im `article` bleibt `complementary`). Fix: `div` statt `aside` (niedrig).
- Prüfvermerk: `p.pruefung` als Satz mit `time datetime` und Link: gut, klar vorlesbar („Geprüft am 10.11.2026 von Konrad Völkel, Autor des Skripts“).
- Formeln: MathML mit TeX-Annotation, HTML-Teil `aria-hidden`: gut (unverändert).
- Quelle der Zitate: `figcaption` „[1] Backpropagation › Das Muster“ als Link auf die Skriptstelle (`#…:~:text=`): ein Agent sieht Beleg und Ziel. Die Marke `[1]` im Text hat `aria-label="Zitat 1"` und Ziel `#z1`.
- Abstimmpfeile: Namen „Gute Frage“/„Schlechte Frage“, `aria-pressed`, `hidden` bis Skript. Gut, bis auf den Zähler (siehe oben).
- Link „Moderation“ im Fuß: Name genügt, `rel="nofollow"`. Ein Agent, der Links abläuft, trifft es letzten; er sieht nicht, dass es ein Login ist und gesperrt (`robots.txt`). Kein Problem.

## 4. Bedienbarkeit ohne Sehen

- Von der Startseite zur Frage: **ja**, ohne JS und ohne Suche. `eidl.html` hat eine Tabelle der vier Unterforen (`th scope=col`, `th scope=row` mit Link), Unterforum → Fragenliste → Frage, dazu Pfadnavigation und „Weitere Fragen“ auf der Frageseite. Kein Hängenbleiben.
- Suche: Abschnitt ist im HTML `hidden` und wird von `app.js` freigegeben. **Ohne JS ist die Suche weg** (kein `noscript`-Hinweis auf der Startseite; die Liste bleibt). Ein Agent mit JS: `label`, `type=search`, `role=status` mit dem Satz „Beim ersten Klick lädt er rund 24 MB“. Der Satz ist gut für Menschen, Agenten laden aber auf Fokus (`feld.addEventListener('focus', start, {once:true})`), nicht beim Klick; der Text stimmt also nicht ganz (Fokus per Tastatur lädt auch). Hängepunkt: Ein Agent, der das Feld fokussiert, löst 24 MB aus und bekommt zunächst „Die Suche lädt …“ bzw. „Stichwortsuche bereit, das Sprachmodell lädt noch“; er muss auf `role=status` warten. Danach „n Fragen und m Stellen im Skript gefunden“: die Ansage ist da. Hat er eine Zeitgrenze, kann er hängen; die Stichwortsuche liefert vorher schon Treffer (laut Statustext), das ist abgefedert. Nicht ausprobiert (nicht getippt).
- Frage stellen (`f/neu/`): Statisch stehen Hinweise, `noscript`-Warnung („zum Fragen braucht diese Seite JavaScript“) und beide Formulare, beide `hidden`. Reihenfolge: Kurscode (`label for`, `required`, `role=alert`-Fehler), dann Frage (`label`, `required`, `minlength 10`), Pflicht-Zustimmung, **freiwillige** Einwilligung (zwei Checkboxen mit `label`, nur die erste `required`: der Unterschied steht allein im Text, nicht im Attribut; gut, dass die zweite nicht `required` ist). Hänger: (a) Kurscode kommt nur aus ILIAS, ein Agent kommt dort nicht hin (gewollt); (b) Der Hinweistext ist ein Link auf Datenschutz, nicht der Satz selbst (Befund 1 oben); (c) die Checkbox-Texte sind lang, aber normale Labels. Ein Agent soll hier ohnehin nicht stellvertretend zustimmen.
- `f/neu/?kapitel=…`: `kapitel-liste` als `application/json`-Block, nur für das Skript; ein Textauszug zeigt es als Rauschen (29 Einträge). Niedrig.

## 5. Maschinenlesbares

- Belegt: `lang="de"`, `<link rel="canonical">` absolut, `<time datetime>` (ISO-Datum) an Frage und Prüfvermerk, `rel="noopener"` an externen Links, `rel="nofollow"` am Moderationslink, `og:*` vollständig, `theme-color`.
- JSON-LD s13: `QAPage` mit `Question` (`name`, `text`, `answerCount`, `dateCreated`, `license`, `author`), `acceptedAnswer` (`url`, `text`, `license`, `author`, `citation` je Zitat), `Person` als eigener Knoten, `BreadcrumbList` als eigener Block. Auffällig:
  - `acceptedAnswer.text` enthält **Markdown und TeX-Quelltext** (`` `loss.backward()` ``, `**fett**`, `$\frac{dL}{dw}…$`). Das ist für Maschinen lesbar, für Rich-Result-Vorgaben „Text“ aber nicht sauber; ich habe Googles heutige Vorgaben nicht nachgeschlagen. Der Auftrag nennt ein Rich Result als unwahrscheinlich: Folge also nur Schönheit. Fix, wenn billig: Klartextfassung.
  - `acceptedAnswer` hat kein `dateCreated`/`datePublished` (bf8 hat `dateModified`, s13 nicht); die Antwort-Zeit steht im HTML nur beim Prüfvermerk. Niedrig.
  - bf8: Frage ohne `license` (Seite sagt auch nichts zur Lizenz der Frage). Kein Agentenbefund, für die Rechtstexte-Seite relevant.
  - `citation` führt Zitate 2 und 3 doppelt (gleiche Skriptstelle). Harmlos.
  - Start: `WebSite` und `Person`, **kein `SearchAction`**: richtig, die Suche ist lokal.
- `llms.txt`: lohnt nicht (31 Fragen, 29 Kapitel, schon eine Linkliste aus HTML; kein Standard, Nutzen für Agenten ungewiss). Entscheidend nur, falls die Site wächst.
- Markdown-Fassung: lohnt nicht, die Seiten sind schlankes semantisches HTML, mit Ausnahme der KaTeX-Seiten (s09: 186 KB, davon der meiste `katex-html`, `aria-hidden`). Wer Agenten Token sparen will, kürzt dort. Kein Handlungsdruck.
- WebMCP: lohnt nicht. Die einzige Aktion ist ein Formular hinter Kurscode und Einwilligung, die niemand stellvertretend geben soll. W3C-Community-Entwurf, kein Standard (Prüfdatum der Plugin-Referenz 2026-09-23; heute nicht neu nachgeprüft).
- `ai-catalog.json`, Content-Signal, Web Bot Auth: Entwürfe oder Vorschläge (gleiches Prüfdatum). Content-Signal wäre eine Willenserklärung, Eigentümer hat Trainings-Crawler bewusst nicht ausgesperrt: nicht ändern.
- Zugriffsrichtlinie (robots.txt unverändert, nicht neu abgerufen): **Training** nicht gesperrt (Entscheidung 17.11.). **Suche** nicht gesperrt, hält `noindex` fern (gewollt). **Nutzerausgelöst** nicht gesperrt, `noindex` hindert das Lesen nicht.

## 6. Tippziele und Kontrast (aus `style.css`)

- `.melden`: Padding `.3rem .1rem`, `font-size .85rem` (~13,6 px), negative Außenränder. Deine Messung 51 × 31 px bei 375 px: über 24 × 24 (WCAG 2.2 AA, 2.5.8), unter 44 (AAA, 2.5.5) und unter den 44 bis 48 der Hersteller-Empfehlungen. Für einen selten gebrauchten Link, der rechts in der Kopfzeile neben `#2` sitzt, vertretbar. Die Abstände zu `.nummer` reichen (`.melden + .nummer { margin-left:0 }`, `.nummer` ca. 24 px hoch): die Ziele **berühren sich**, das 24-px-Kriterium greift nur, wenn Ziele ihren eigenen Kreis frei halten; beide sind je > 24 px, es besteht also kein Verstoß, aber ein Fehltreffer ist möglich. Fix (optional): `.melden` auf `padding:.55rem .5rem`.
- Kontrast (Schätzung): `--leise` oklch(.46) auf Weiß/`--grund` etwa 6 bis 7:1, hell und dunkel (.74 auf .245) etwa 7:1: ausreichend (AA verlangt 4,5:1 für kleinen Text). `.pruefung` `--gut` (.40) auf Seitengrund ca. 7:1, auf `--gut-grund` ähnlich: gut. `.lizenz` `--leise` 13,6 px: ausreichend. Der Prüfvermerk-Link erbt die Farbe (`color:inherit`), Unterstreichung kommt vom Browser-Standard, sofern das Stylesheet sie nicht entfernt (`a`-Regel nicht gelesen, nur Treffer der gelisteten Selektoren).
- Fokus: `summary:focus-visible`, `.pfeil:focus-visible`, `input:focus` sind gerahmt; `.melden`, `.nummer`, `.marke-zitat` haben **keine eigene Regel** und fallen auf den Browser-Standard (sichtbar, sofern kein globales `outline:none`; nicht geprüft).
- Pfeile mobil: `padding .5rem .75rem` (mit Finger treffbar). Gut.

## 7. Punkte (Einschätzung, 0 bis 100)

Zusammenhang: Handbewertung, **nicht** Lighthouse und nicht `agent_ux_check.py`.
- 16.11.: 86.
- 17.11.: **90**. Die drei mittleren Befunde von gestern sind behoben, Sprunglink, Beitragsnamen, Zitatmarken benannt, Prüfvermerk und Lizenz sind klar lesbar. Abzüge: Zähler ohne Namen, „Melden“ ohne Beitragsbezug, Einwilligungssatz vor dem Code fehlt, JSON-LD-Text mit Markdown.

## 8. Nicht geprüft

Echter Screenreader und echter Zugänglichkeitsbaum (nur aus HTML/CSS gelesen); Tastaturdurchlauf; Suche tippen (24-MB-Ladung); Formular absenden; Lighthouse; `agentic_check.py` und `agent_ux_check.py` (laden am Host); Kontrast gemessen; die `a`-Regel für Unterstreichung; globaler Fokus; Googles aktuelle `QAPage`-Vorgaben (nicht nachschlagbar); alle 99 Seiten (nur Start, `f/neu/`, s09 teils, s13, bf8 genau; s09 nur auf Melden-Zahl und Prüfvermerk).
