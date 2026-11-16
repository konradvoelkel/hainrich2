# Agentenlesbarkeit, /eidl/ (Stand 2026-11-16)

Score Agent-Lesbarkeit (Handbewertung, 0 bis 100): **86**.
Das Skript `agent_ux_check.py` meldet für die Startseite 100 (vollständig, 145 Knoten, 13 Links, 0 unbenannte). Das ist nur eine Heuristik für die Startseite und deckt die Befunde unten nicht ab.

**Lighthouse Agentic Browsing: nicht gemessen.** Lighthouse ist nicht installiert und darf nicht geladen werden. Es gibt also keinen Wert X/N. Die Kriterien sind unten von Hand bewertet.

Geprüft: Quelltext (lib/site.js, site/app.js, fragen.js, stimmen.js), `curl` auf Start, f/grundlagen/, f/kapitel/backpropagation/, f/s09/, f/neu/, ueber/, datenschutz/ (7 Ladungen), Kopfzeilen, drei Entdeckungsdateien, `agentic_check.py`, `agent_ux_check.py` (je 1 Ladung der Startseite im Chromium). Nichts abgeschickt, nichts unter /api/ oder /mod/, die Suche nicht getippt.

## Was gut ist

- Alles Lesbare steht im HTML (170 Wörter auf der Startseite ohne JS). Eine Frage, ein `h1`, `lang="de"`, ein `main`, `header`, `footer`, Pfad-`nav` mit Label.
- Tabellen mit `th scope`, Spalten benannt. Links haben Namen, keine Bild-Links ohne Namen (Logo `alt=""`, daneben Text).
- Formeln: KaTeX mit MathML und TeX-Annotation, der HTML-Teil ist `aria-hidden` (110 Formeln auf f/s09/). Ein Agent liest `w \cdot x + b`.
- Zitate: `figure > blockquote` mit `figcaption`-Link „Kapitel › Abschnitt“. Der Link führt mit Textfragment (`#...:~:text=`) zur Stelle im Skript. Der Weg Antwort, `[1]`, Zitat, Skriptstelle geht ohne Bild.
- Bot und Prüfstand stehen als Text („Bot“, „geprüft“, Hinweis „Sprachmodell erzeugt“).
- Suche: echtes `label`, `type=search`, Statuszeile mit `role=status`, nichts wird vor dem ersten Fokus geladen.
- Stimmen: echte `button`, Namen „Gute Frage“/„Schlechte Frage“, `aria-pressed`, Fehler als `role=alert`.
- Formulare: `label for`, `required`, Fehler als `role=alert`. Ohne JS steht ein `noscript`-Hinweis.
- Kurscode-Pflicht ist auf f/neu/ sichtbar („Kurscode aus ILIAS“, `Weiter`); ueber/ und datenschutz/ erklären Code und Anthropic-Weg.

## Befunde

### Medium: Einwilligungstext erst nach gültigem Kurscode sichtbar
f/neu/: Das Fragenformular samt Einwilligungstext (öffentlich nach Prüfung, Verarbeitung durch Anthropic USA) ist `hidden`, bis ein Token da ist. Im Baum steht davor nur Kurscode-Feld. Ein Agent erfährt ohne Code nicht, was mit dem Text passiert, außer er folgt `datenschutz/` (dort steht es).
Fix: Auf f/neu/ im statischen Hinweisabsatz einen Satz ergänzen: „Ihre Frage wird nach Prüfung öffentlich, ein Sprachmodell von Anthropic (USA) verarbeitet sie“, mit Link. Der Wortlaut der Checkbox bleibt maßgeblich (`ZUSTIMMUNG.version` beachten, Regel 10).
Prüfen: f/neu/ ohne Token im Zugänglichkeitsbaum, der Satz ist sichtbar.

### Medium: Fokus nach „Weiter“ und nach dem Absenden
fragen.js `zeigeFormular()` versteckt das Code-Formular und zeigt das Fragenformular; der Fokus lag auf dem versteckten Knopf und geht verloren. Nach dem Absenden nur `scrollIntoView()`, kein Fokus, keine Statusmeldung außer der neuen Liste. Tastatur- und Screenreader-Nutzer sowie Agenten verlieren die Stelle.
Fix: nach `zeigeFormular()` `text.focus()`; nach Erfolg eine `role=status`-Zeile („Frage gesendet“) und Fokus darauf.
Prüfen: Playwright-Test mit Wegwerf-Datenbank, `document.activeElement`.

### Medium: Suchergebnisse werden nicht angekündigt
app.js `zeige()` füllt `#treffer` (nicht live) und setzt `#suchstatus` nicht neu. Ein Agent oder Screenreader erfährt nicht, dass und wie viele Treffer erschienen sind. Die Suche ist außerdem kein Landmark (`section` ohne Namen).
Fix: in `zeige()` `status.textContent = \`${n} Fragen und ${m} Stellen im Skript gefunden\``; `section.suche` zu `role="search"` oder `<search>`.
Prüfen: Tippen im Browser, Status ändert sich; Baum zeigt „search“.

### Low: Stimmenzähler ohne Namen und ohne Ansage
`<span class="punkte" title="Punkte">`: Der Name hängt nur am `title`, ändert sich ein Wert, sagt niemand etwas. Auf Listen sitzen die Pfeile im `th scope=row`, der Zeilenkopf heißt dann „Gute Frage 0 Schlechte Frage <Fragetext>“.
Fix: sichtbar versteckter Text „Punkte:“ oder `aria-label`; Gruppe `role=group aria-label="Bewertung"`; Stimmbox aus dem `th` in eine eigene `td`. `aria-live=polite` am Zähler.

### Low: Antworten haben keine Überschrift, Markenlinks heißen „[1]“ und „#2“
Jede Antwort ist ein unbenannter `article`, nur Frage hat `h1`. Der Link `#2` und `[1]` sagt allein nichts. Zwei Antworten haben je ein `h2` „Originaltext aus dem Skript“, gleichlautend.
Fix: `aria-label` auf den Links („Zitat 1“, „Link zu Antwort 2“); `article aria-labelledby` oder versteckte `h2` „Antwort 2, Bot“.

### Low: Kein Sprunglink
Vor `main` stehen nur Banner und Kopf mit einem Link. Auf der Startseite wenig Gewinn, auf Tabellenseiten ebenfalls klein. Nur wenn es nichts kostet.

### Info: Vorschau-Banner
Ein einfaches `p` vor dem Kopf, keine Rolle, kein Landmark. Als erster Text im Baum richtig. Kein Mangel.

### Info: Entdeckungsdateien und Zugriffsrichtlinie
- Training: robots.txt hat nur die Gruppe `*` (sperrt /models/, /wasm/, /daten/, /mod/, /api/), keine KI-Gruppen, keine Content-Signal-Zeile. Es gibt keine Sperre für Trainings-Crawler. Alles ist per `noindex` in der Vorschau.
- Suche: dieselbe Gruppe `*`; `noindex` hält Suchmaschinen und KI-Suche aus dem Index, das ist gewollt.
- Nutzerausgelöst (Claude-User, ChatGPT-User und andere): nicht gesperrt; `noindex` hindert sie nicht am Lesen.
- `/.well-known/ai-catalog.json`, `/llms.txt`, `/eidl/llms.txt`: 404. Markdown-Variante (`Accept: text/markdown`, `.md`): keine. 404 für unbekannte Adressen echt (kein Soft-404).
- Bewertung für diese Größe: llms.txt, Markdown und ai-catalog sind **nicht nötig**. Das HTML ist schon schlicht und serverseitig fertig. Optional später, wenn die Site öffentlich wird: eine Content-Signal-Zeile (z. B. `ai-train=no`), falls das Skript nicht für Training gedacht ist. Sie ist eine Willenserklärung, keine Sperre.
- Stand der Entwürfe (Prüfdatum der Plugin-Referenz 2026-09-23): Content-Signal (Cloudflare-Richtlinie und IETF-Entwurf), ai-catalog.json, WebMCP (W3C-Community-Group-Entwurf, kein Standard) und Web Bot Auth sind Entwürfe bzw. Vorschläge. llms.txt ist eine Community-Spezifikation.
- WebMCP: nicht anwendbar (0 `registerTool`, Formulare brauchen Kurscode und Einwilligung, die ein Agent nicht stellvertretend geben soll).

## Antworten auf die Fragen

- „Was sagt die Seite zu X?“: Ja, aus dem Baum allein; Text und Formeln sind da, die Seiten sind kurz.
- Zur Skriptstelle hinter einem Zitat navigieren: Ja, über den Link im `figcaption`.
- Ohne Versuch erfahren, dass ein Kurscode nötig ist: Ja (f/neu/, ueber/). Was mit dem Text geschieht: nur über datenschutz/ oder ueber/, auf f/neu/ erst nach Code (Befund 1).

## Nicht geprüft

Lighthouse-Bruchzahl (nicht installiert); echter Screenreader; Tastaturdurchlauf im Browser (nur aus dem Quelltext gelesen); Tippen in die Suche; Fokusanzeige der Knöpfe `.haupt` und Links; Farbkontrast; alle 99 Seiten (nur 6 Typen); `.well-known`-Einzelprüfungen jenseits von ai-catalog (das Skript lief, ich habe nur die Zeilen oben gewertet).
