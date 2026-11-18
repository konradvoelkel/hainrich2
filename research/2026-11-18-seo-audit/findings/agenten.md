# Agentenlesbarkeit, /eidl/ (Stand 2026-11-18, vierter Durchgang, erster nach dem Start)

Geprüft: rohes HTML von `eidl.html`, `seiten/eidl__f__s09.html`, `eidl__f__kapitel__backpropagation.html`, `eidl__f__neu.html`, `eidl__nutzungsbedingungen.html`, dazu `robots.txt`, `sitemap.xml` und `crawl.json` (Kopfzeilen). Der Zugänglichkeitsbaum ist **aus dem HTML gelesen, nicht aus einem Browser gemessen**; was ein Reader daraus macht, ist teils Annahme (so gekennzeichnet).
**Lighthouse ist nicht installiert und lief nicht; `agentic_check.py` und `agent_ux_check.py` habe ich nicht gestartet (sie laden am Host bzw. in einem Browser). Es gibt keinen Wert X/N und keinen Agent-UX-Wert.** Die Punkte unten sind meine Handbewertung.
Host: 4 HEAD-Anfragen (siehe Abschnitt 4), sonst nichts.

## 1. Gegen gestern (Bericht vom 17.11.)

| Punkt | Stand | Beleg |
|---|---|---|
| „Melden“ ohne Beitragsbezug | **behoben** | s09: `a.melden` ist `mailto:` mit Betreff `Meldung zu f/s09/#b1`, Text mit vollem Beitragslink und Gründeliste, `aria-label="Beitrag 1 melden"`, `title="Öffnet eine vorbereitete E-Mail"`. Fuß-Link „Inhalt melden“ führt weiter zu `impressum/#inhalte-melden`. |
| Stimmenzähler ohne Namen | **teils behoben** | `<span class="punkte" title="Punkte">0</span><span class="nur-vorlesen"> Punkte</span>`: lesbar „0 Punkte“. Keine `role=group`, kein `aria-live` (Ansage nach Klick weiter offen, niedrig). |
| Einwilligungssatz vor Kurscode | **offen** | `f/neu/` zeigt vor dem Code nur „Was mit einer Frage geschieht, steht unter Datenschutz“ mit Link. |
| `<aside class="autor">` im `article` | **offen** | Je Beitrag ein `aside` ohne Namen (s09: 2). Siehe Befund 1. |
| Zitat-`summary` ohne Leerzeichen/Rauschen | **teils behoben** | Zwischen `.mehr zu` und `.mehr auf` steht jetzt ein Leerzeichen; Anriss doppelt weiter den Zitatanfang (nur ohne CSS sichtbar, niedrig). |
| Zwischenüberschriften der Antwort `<strong>` | **offen, niedrig** | unverändert (nicht neu an s13 geprüft; s09 nicht darauf gelesen). |
| Fuß-`nav` ohne Namen | **offen, niedrig** | `<footer class="fuss"><nav>` ohne `aria-label`; auf der Frageseite drei `nav` (zwei benannt: „Pfad“, „Weiter“). |
| Nicht-ASCII-Fragment `#wer-prüft` | **offen, niedrig** | s09: `href="../../ueber/#wer-prüft"` unverändert. |
| Vorschau-Banner | **behoben** (Banner weg, gewollt). |
| Entdeckungsdateien | **unverändert**, siehe 4. |

## 2. Neue Befunde

### Mittel: Zugänglicher Name und sichtbarer Text bei „Melden“ stimmen überein, aber nur teilweise
- Wo: `a.melden`: sichtbar „Melden“, Name „Beitrag 1 melden“. Das Kriterium „Label in Name“ (WCAG 2.5.3) verlangt, dass der sichtbare Text im Namen vorkommt: „Melden“ steht darin, aber **kleingeschrieben und nicht am Anfang** („melden“ am Ende). Die Norm vergleicht ohne Groß/Klein; ob „am Ende“ genügt, habe ich nicht nachgeschlagen. Für Sprachsteuerung („Klick Melden“) wird es nach meiner Erfahrung gefunden, weil Teilstring-Treffer üblich sind. Kein Mangel, nur genannt, weil du danach gefragt hast.
- Gleiche Prüfung für die übrigen Namen: `a.nummer` sichtbar „#1“, Name „Beitrag 1“ (Zahl enthalten, ok); `a.marke-zitat` sichtbar vermutlich „[1]“, Name „Zitat 1“ (ok); Abstimmknöpfe sichtbar „▲“/„▼“ (Symbol, kein Text zu vergleichen). Kein Verstoß gefunden.
- Anmerkung `title`: Bei sichtbarem Text und `aria-label` wird `title` meist nur als Beschreibung ausgegeben (Annahme); er sagt dem Agenten „öffnet E-Mail“, bevor er klickt. Das ist gut. Der Link nennt aber kein `mailto:` im Namen; ein Agent muss das Attribut `href` lesen. Fix wäre nur kosmetisch: nichts.

### Niedrig: Unbenanntes `<aside>` im `<article>` (Frage- und Antwortkarte) und in `section.zitate`
- Wo: `article.beitrag > aside.autor` (Avatar, „Frage“/Bot, Stimmen) und `section.zitate > aside > figure`.
- Was Agenten daraus machen (Annahme, Chromium-Verhalten; nicht gemessen): `aside` ist Landmarke „complementary“, ohne Namen eine unbenannte Landmarke. Im `article` gilt sie nach HTML-AAM weiter als complementary (nicht wie `header`/`footer`, die dort ihre Landmarkenrolle verlieren). Ein Agent, der Landmarken zur Orientierung nutzt, sieht auf s09 **drei** unbenannte Landmarken „complementary“ (zwei Autorenkästen, ein Zitatblock), die erste mit den Abstimmknöpfen. Der Zitatblock als „Nebeninhalt“ ist inhaltlich falsch: Die Zitate sind der Beleg der Antwort, nicht Beiwerk. Der Grund für das `aside` war das Auszugsverfahren (trafilatura), nicht die Semantik.
- Fix, wenn der Auszug es zuläßt: `aside.autor` zu `div`; dem Zitat-`aside` ein `aria-label="Zitate aus dem Skript"` geben (der `h2` steht ja schon davor, `aria-labelledby` auf ihn). Das ändert das HTML-Gerüst, das gestern wegen trafilatura gewählt wurde; **vor dem Umbau `auszug.txt` neu prüfen**. Gewinn: kleiner, kein Agent scheitert daran.
- Erfolg sähe man: Landmarkenliste zeigt „Zitate aus dem Skript“ statt „complementary“.

### Niedrig: Suchfeld lädt auf Fokus, der Text sagt „Klick/Fokus“
- `eidl.html`: Statusabsatz `#suchstatus role=status`: „Beim ersten Klick/Fokus ins Suchfeld lädt er dafür rund 24 MB von diesem Server.“ Das ist jetzt genau (gestern: nur „Klick“). Ein Agent kann es vor dem Fokussieren lesen, **wenn er den Absatz im Baum sieht**: der Abschnitt `section.suche` ist im Roh-HTML `hidden` (bis `app.js` ihn freigibt), der Hinweis steht also **nur** im freigegebenen Zustand. Das Feld hat sichtbares `label` „Steht Ihre Frage schon hier?“, Placeholder „Frage eintippen“ (Name kommt vom Label; Label-in-Name nicht verletzt).
- Ohne JS (Agent liest nur Roh-HTML): keine Suche, kein `noscript`-Hinweis auf Start- und Kapitelseiten; die Forenliste bleibt. Niedrig, wie gestern.

### Niedrig: Kapitelseiten mit Abstimmpfeilen in Tabellenzellen
- `eidl__f__kapitel__backpropagation.html`: `<table class="liste themen">` mit `th scope=col` Thema/Antworten/Status, Zellen mit `data-label`. Abstimmknöpfe stehen in den Zeilen, `hidden`. Tabelle benannt durch Spaltenköpfe, nicht durch `caption` (niedrig; `aria-labelledby` auf die `h2` genügte). Das Gerüst ist sonst sauber.

## 3. Der Baum im Einzelnen (aus HTML gelesen)

- **Startseite** (5,6 KB): Sprunglink, `header.kopf`, `main#inhalt`, `section.einstieg` mit `h1`, `section[role=search]` „Suche im Forum“ (hidden bis JS) mit zwei `h2`, `section` mit `h2` und Tabelle der Unterforen, `footer` mit unbenannter `nav`. Überschriftenfolge h1, h2, h2, h2: sauber.
- **Frageseite s09**: `nav` „Pfad“, `article.faden` mit `article#b1` „Frage“ (enthält `h1`!) und `article#b2` „Antwort des Bots“, `section.zitate` mit `h2` „Originaltext aus dem Skript“ und `aside > figure#z1…z7`, je `details/summary` plus `figcaption` mit Link auf die Skriptstelle, `nav` „Weiter“, `footer`. Der Faden ist ein `article` im `article`: für einen Baum klar („Frage“ und „Antwort des Bots“ als verschachtelte Artikel). Die Antwort-`article` enthält die `section.zitate`, die Zitate gehören also zur Antwort: gut, mit dem Unterschied aus Befund 1.
- Die `h1` steht **im** Frage-Artikel nach dem `aside.autor`? Reihenfolge laut Tags: `h1`, dann `aside`, dann `header` (Zeit, Melden, Nummer). Eine Überschrift als erstes Element der Karte: gut für Überschriftennavigation.
- **Kapitelseite**: `nav` Pfad, `section` mit `h1`, Suche, `section` mit `h2` und Tabelle. Keine Lücke in den Stufen.
- **Frageformular**: `h1`, zwei `form` (beide `hidden` bis JS), Reihenfolge Kurscode-Formular (`label for`, `required`), dann Frage-Formular (`textarea` mit `label`, `minlength=10`, `maxlength=1500`, `required`; Haken 1 `required`, Haken 2 freiwillig, nur im Text erkennbar), `noscript`-Warnung. Kein `form`-Name (`aria-label`) an den Formularen: für Agenten, die Formulare zählen, zwei namenlose `form` (niedrig). `kapitel-liste` als JSON-Block (Rauschen im Textauszug, niedrig).

## 4. Was ein Agent nicht tun soll, und Entdeckungsdateien

- Sagt die Seite es? **Nein, weder maschinenlesbar noch im Text.** `robots.txt`: `User-agent: *` mit `Disallow:` auf `/eidl/models/`, `/wasm/`, `/daten/`, `/mod/`, `/api/` (Moderation und API ausgenommen: gut), Sitemap-Zeile. Die Nutzungsbedingungen richten sich an Fragende („Was hierher gehört“, „Keine personenbezogenen Daten“), kein Wort zu automatisierten Zugriffen, Abstimmen oder Absenden durch Programme. Der Kurscode wird nicht erraten werden können (nur Hash serverseitig, nicht geprüft), aber nirgends steht „nicht raten, nicht automatisch absenden“. Abstimmen ist laut Auftrag offen für alle, also auch für Programme; die einzige Sperre ist die Server-Bremse (nicht geprüft).
- Empfehlung (niedrig bis mittel, Entscheidung des Betreibers): ein Satz in Nutzungsbedingungen oder Über („Automatisches Lesen ist erlaubt; automatisches Abstimmen, Absenden und Raten des Kurscodes nicht“). Ein Satz im Text erreicht Agenten, die Seiten lesen, anders als eine nicht standardisierte Datei. Content-Signal wäre ein Entwurf (Prüfdatum der Plugin-Referenz 2026-09-23, heute nicht neu geprüft); Trainings-Crawler bleiben laut Entscheidung unberührt, **nichts ändern**.
- Abgerufen (4 HEAD, ≥1,5 s Abstand): `/llms.txt` 404, `/eidl/llms.txt` 404, `/.well-known/security.txt` 404, `/.well-known/ai-catalog.json` 404 (nur Statuscodes; Inhalte von Fehlerseiten nicht gelesen). `crawl.json`: kein `Link`-Kopf an den Seiten (Kopfzeilen: CSP, `x-robots` nicht gesetzt, kein `link`). Kein `rel="alternate"` auf Start und s09. Keine Markdown-Fassung.
- Lohnt es? **`llms.txt`: nein** bei 35 indexierbaren Seiten mit Linkliste und Sitemap, Nutzen für Agenten unbelegt (kein Standard; Prüfdatum 2026-09-23). **Markdown-Fassung**: nein; Ausnahme s09 mit 186 KB (KaTeX-HTML, `aria-hidden`). **`security.txt`**: unabhängig von Agenten sinnvoll, ein Dreizeiler mit der Meldeadresse (die steht schon im Impressum); niedrig. **`ai-catalog.json`, WebMCP, Web Bot Auth**: Entwürfe oder Vorschläge, die einzige Aktion ist ein Formular hinter Kurscode und Einwilligung; nicht lohnend. Fehlen ist hier eine Möglichkeit, kein Mangel.
- Zugriffslinien: **Training** nicht gesperrt (Entscheidung). **Suche** nicht gesperrt; `noindex` auf Rechtstexten, Formular, Kapiteln hält sie aus der Suche. **Nutzerausgelöst** nicht gesperrt; CSP `form-action 'none'` betrifft nur Browser.

## 5. Punkte (Einschätzung, 0 bis 100; keine Messung)

- 17.11.: 90.
- 18.11.: **91**. „Melden“ trägt Beitragsbezug und eine Vorschau der Folge (`title`, `mailto`), Zähler lesbar; Abzüge: unbenannte `aside`-Landmarken mit falscher Rolle für die Zitate, kein Satz zu erlaubtem und unerlaubtem Agentenverhalten, Einwilligungssatz fehlt vor dem Code, Roh-HTML ohne Suche und ohne Hinweis. Nicht mit Lighthouse oder Agent-UX vergleichbar.

## 6. Nicht geprüft

Lighthouse (nicht installiert), `agentic_check.py`, `agent_ux_check.py`, echter Zugänglichkeitsbaum und Screenreader, Tastaturdurchlauf, Suche tippen (24 MB), Formular absenden, Fokus und Kontrast (diesmal nicht neu gelesen; gestern aus `style.css` geschätzt, `.melden` hat unverändert keine eigene Fokusregel), JSON-LD (gehört einem anderen Bereich), Serverbremse für Stimmen, andere Seiten als die vier genannten, Googles aktuelle Regeln (nicht nachschlagbar). Sichtbarer Text der `a.marke-zitat` („[1]“) nicht im Roh-HTML nachgelesen, Annahme.
