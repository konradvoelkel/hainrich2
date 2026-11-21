# MWG 64a6d70: HTML, Formulare, Barrierefreiheit

Nur gelesen, Stand `d417706`.

## Gelesene Leitfäden

Ganz gelesen: `html/html`, `forms/forms`, `accessibility/accessibility`, `forms/validate-input-after-interaction`, `forms/required-field-feedback`, `forms/ime-safe-enter-submit`, `accessibility/accessible-error-announcement`, `accessibility/accessible-generated-content`, `accessibility/respect-os-text-scale`, `forms/autofill-sign-in-form`, `ui-components/dialog`, `ui-components/breadcrumbs`, `ui-behaviors/search-hidden-content`, `ui-components/progress`, `ui-components/checkbox`, `ui-components/card`, `ui-behaviors/scroll-target-on-load`, `forms/form-fields-automatically-fit-contents`.
Teilweise gelesen: `ui-components/accordion`, `ui-components/navbar`, `ui-components/persistent-toast-notifications`, `user-experience/form-factor-adaptation`, `user-experience/content-first-noise-reduction`, `user-experience/natural-interactions` (nur Überschriften).

## Nicht anwendbar

Web Components, Medien, Bildpriorität (gehört zur Performance), Adresse, Zahlung, Registrierung, OTP, Select-Picker, Slider, Switch, Toasts, Tabs, Menüs, Popover, Übergänge, Drag. `hidden="until-found"` braucht es nicht, `details` reicht. `field-sizing` wäre nur eine Verbesserung.

## Befunde

### html/html
- (a) Doctype, `lang="de"`, Viewport ohne Zoomsperre (lib/site.js:258–262, lib/mod-pages.js:14–18). Eine `h1` je Seite, die Überschriften springen nicht, je ein header/main/footer.
- (a) `button` für Aktionen, `a` für Wege, `type="button"` an Pfeilen und Listenknöpfen.
- (a) Schmuckbilder haben `alt=""` neben Linktext, der Avatar ist `aria-hidden` (site.js:287, 409–410, 476).
- (a) Zitate als `figure > blockquote + figcaption`. `summary` steht zuerst, der Marker bleibt, im summary ist nichts Interaktives (site.js:312–318).
- (a) Kein positives `tabindex`. Wird ein Formular verborgen, wandert der Fokus mit (site/fragen.js:154, 166). Keine Inline-Handler.
- (b1) site.js:508 `section role="search"`: „use `<search>` to enclose search and filtering mechanisms“. Einen Baseline-Stand nennt der Leitfaden nicht. Fix: `<search class="suche" …>`, Tests in test/site.test.mjs und test/kapitel.test.mjs mitziehen.
- (b2) site.js:315: „use the `cite` attribute to provide a machine-readable URL for that source“. Fix: `cite="${esc(zitat.url)}"`.
- (b3) Der Fokus geht verloren: fragen.js:138 baut „Meine Fragen“ alle 3 s neu, Löschen und Entfernen (Z. 80–89, 111–123) nehmen den fokussierten Knopf weg. Regel: „maintain focus … when the currently focused element is hidden or removed“. Fix: Neu bauen nur bei geänderten Daten, den Fokus über `data-id` zurücksetzen, nach dem Löschen auf die nächste Zeile oder die `h2`.
- (c1) Die `h1` steht im DOM zuerst, das Grid zeigt sie unter dem Kopf (site.js:470–476, style.css:135–139). Die Tab-Folge bleibt gleich, weil die `h1` nichts Fokussierbares enthält. Grund ist der Textextraktor (research/2026-11-17-seo-audit, Befund 2).

### forms/forms
- (a) Moderation: `post` mit `action`, `label for`, `select` mit leerer Option und `required`, `formnovalidate` nur an Aktionen ohne Speichern (mod-pages.js:40–46, 217, 258, 273).
- (a) Native Grenzen gelten, kein `:invalid`-Styling, Absenden bleibt möglich, `font: inherit`, `resize: vertical`. AJAX mit `preventDefault`, das Ergebnis meldet `role="status"`, sichtbar ist immer nur ein Formular.
- (b4) fragen.js:145 und 157: Ein Doppelklick schickt zwei Fragen ab. Regel: „DO disable the button *after* a valid submission is clicked to prevent double-posts“. Fix: `event.submitter.disabled` setzen, im `finally` zurücknehmen.
- (b5) Kurscode (site.js:626) und Name der Moderation (mod-pages.js:42): „turn off text correction on fields that hold identifiers rather than prose“. Fix: `autocapitalize="none" autocorrect="off"`, am Namen auch `spellcheck="false"`. Der Kurscode bekommt `name` und den Knopf „Kurscode prüfen“ statt „Weiter“. `autocorrect` ist Newly seit 2026-09-11 (Chrome/Edge 153, Firefox 136, Safari 14.1), ein Fallback ist nicht nötig. `autocomplete="off"` am Kurscode: siehe Frage 1.
- (b6) Checkboxen haben kein `for`/`id` (site.js:609; mod-pages.js:118, 266, 304): „Explicitly associate `<label>` with its control via `for`/`id`“.
- (b7) site.js:630–635 und mod-pages.js:56, 75, 212, 264: Pflicht und freiwillig sehen gleich aus, die Grenze von 10 bis 1500 Zeichen steht nirgends, Hinweise stehen unverknüpft unter dem Feld. Regel: „indicate clearly which fields are required both visually in the label and programmatically“. Fix: Hinweis über dem Feld mit `aria-describedby`.
- (c2) Öffentliche Formulare ohne `action`, `method` und `name`, abgeschickt per `fetch` (site.js:624–638). Grund: CSP `form-action 'none'` (site/serve.mjs:18, Plan Z. 591), dazu der `noscript`-Hinweis.
- (c3) Die Suche hat kein `<form>`, sie sendet nichts (app.js:1–3).

### accessibility/accessibility
- (a) Ein Sprunglink führt auf `main`, `th scope` ist gesetzt. Die Pfeile sind Knöpfe mit `aria-pressed`, erst mit JS sichtbar. „Melden“ trägt eigene Namen. Die Statuszeile steht vorab im DOM und wartet 200 ms. Ziele ab 24 px, `:focus-visible`.
- (a, unsicher) „#1“ heißt „Beitrag 1“, „[1]“ heißt „Zitat 1“ (site.js:413, 427). Symbole zählen nach WCAG 2.5.3 nicht mit.
- (b8) site.js:292: Die Fuß-`nav` hat keinen Namen, die eigene Seite kein `aria-current`. Regel: „If a page contains multiple `<nav>` elements, apply the `aria-label` attribute“.
- (b9) Tabellen ohne Namen (site.js:536, 563, 584; mod-pages.js:283), leere Kopfzelle in mod-pages.js:289: „the `<caption>` element to provide a title and accessible name“. Fix: `aria-labelledby` auf die Überschrift.
- (b10) Listen mit `list-style: none` (site.js:512, 640; mod-pages.js:61, 68, 333): „In that case `role="list"` is required to restore them“ (Safari).
- (b11) „Gute Frage“ steht auf Listenseiten vielfach (site.js:326 über Z. 545), ebenso „Frage löschen“ (fragen.js:123): „Don't reuse an accessible name across controls with different effects in the same view“. Fix: `aria-describedby` auf den Fragetext, die Stimmbox aus dem `th` nehmen.
- (b12) `title` als Tooltip (site.js:327, 371; mod-pages.js:128): „Don't use `title` as a naming mechanism“. Fix: `title="Punkte"` streichen, den mailto-Hinweis als versteckten Text.
- (b13) Der Entwurf unter „Meine Fragen“ (h2) bringt eine eigene h2 mit (site.js:431 über Z. 438): „its heading level is lower in the heading hierarchy“. Fix: dort `h3`.
- (b14) fragen.js:180–183 setzt Meldung und Fokus gleichzeitig: „Delay slightly when other announcements may collide“. Fix: `aria-describedby="meine-status"` an die `h2`.
- (b15, unsicher) Scrollkästen (style.css:100, 102, 187, 230): „adding `tabindex="0"` to the `<pre>` element if it becomes scrollable“. Chromium ab 130 und Firefox fokussieren sie selbst, WebKit nicht.
- (b16) Die Pfeile sind auf Touch kleiner als 44 px, umgeschaltet wird nach Breite (style.css:216, 223–227): „Bump targets up on coarse pointers“. Das ist AAA und gehört auch zur CSS-Prüfung.
- (b17) Der ganze Zustimmungstext ist das Label (site.js:609, lib/fragen.js:15–16): „Don't pack descriptions, error messages, or instructions into the label“. Rechtstext, siehe Frage 2.
- (c4) Zitate liegen in einem benannten `<aside>` (site.js:416–425, 433), wegen trafilatura (D37, D47). Bei mehreren Antworten entstehen gleichnamige Landmarken. Ob `aside.autor` eine Landmarke ist, ist unsicher.
- (c5) `[tabindex="-1"]:focus { outline: none }` (style.css:244–245) trifft nur Überschriften, die ein Skript fokussiert.

### Fehleranzeige (accessible-error-announcement, validate-input-after-interaction, required-field-feedback)
- (a) Nichts wird vorzeitig als ungültig markiert, der Browser fokussiert das erste ungültige Feld, die Alert-Absätze stehen ab dem Laden im DOM.
- (b18, unsicher in der Wirkung) fragen.js:52–56 und stimmen.js:59–61 blenden den Alert zusammen mit dem Text ein: „a live region that is shown, rather than changed, isn't announced reliably“. Fix: ohne `hidden` nur den Text tauschen, `.fehler:empty { padding: 0; margin: 0 }`.
- (b19) Serverfehler hängen an keinem Feld (fragen.js:149, 170; mod-pages.js:39, 205, 253): „after a failed submit, move focus to the first invalid field“. Fix: `aria-invalid` und `aria-describedby` an `#kurscode` bzw. `#fragetext`, Fokus dorthin. lib/api.js:65 soll „mindestens 10 Zeichen“ nennen.
- (b20) site.js:609, 626, 632: Firefox und Safari melden leere Pflichtfelder schon beim Laden. Regel: „Set `aria-invalid="false"` until `:user-invalid` matches“. Fix: `syncAria` aus dem Leitfaden. `:user-invalid` ist Widely seit 2023-11-02 (Chrome/Edge 119, Firefox 88, Safari 16.5), ein Fallback ist nicht nötig.
- (c6) Die Moderation läuft ohne JS (mod-pages.js:1, Plan §9): Es gibt keinen `aria-invalid`-Abgleich und kein „Passwort zeigen“. Beim Löschen und bei der Vorschau steht ein Haken statt einer Rückfrage (mod-pages.js:112, 298; D27, D33).

### forms/ime-safe-enter-submit
- (a) Kein eigener Enter-Handler, lib/mod-tasten.js:15 lässt Eingabefelder in Ruhe.

### accessibility/accessible-generated-content
- (b21) style.css:158 und 164: `thead` ist `display: none`, die Spaltennamen kommen nur aus `content: attr(data-label)`. Regel: „DON'T use `content` to convey meaningful text (labels, state, instructions)“. Fix: `thead` sichtbar-versteckt, `content: attr(data-label) ": " / "";`. Baseline: Newly seit 2024-07-09 (Chrome 77, Edge 79, Firefox 128, Safari 17.4), Fallback ist eine einwertige `content`-Zeile davor. Unsicher: Ob WebKit die Tabellensemantik bei `display: block` behält.

### accessibility/respect-os-text-scale
- (a) Keine Schriftgröße an der Wurzel, Größen und Breakpoints in rem.
- (b22) site.js:262: „opt into native operating system text scaling using the `<meta name="text-scale">` tag“. Eingeschränkt (Chrome/Edge 146), ohne Unterstützung bleibt alles beim Alten.

### forms/autofill-sign-in-form
- (a) Eigenes Formular, `autocomplete="username"`/`"current-password"`, `required`, Einfügen erlaubt, Knopf „Anmelden“ (mod-pages.js:40–46).

### ui-components/dialog
- (b23, unsicher) fragen.js:86: `confirm()` fokussiert OK, Enter löscht also: „put `autofocus` on the safe action (such as Cancel or Keep)“. Fix: `<dialog>` mit `showModal()`, `autofocus` auf „Behalten“. Ein Fallback ist nicht nötig.

### ui-components/breadcrumbs
- (b24) site.js:446: kein `ol`, „›“ steht im Markup, die aktuelle Seite ohne `aria-current`. Regel: „Wrap the trail in `<nav aria-label="Breadcrumbs">` containing an ordered list“. Fix: `ol > li > a`, `content: "›" / ""`. Baseline wie b21.

### ui-behaviors/search-hidden-content
- (a) Lange Zitate in `details`, der Wortlaut steht ganz im HTML, zitate.js öffnet beim Sprungziel. `details` ist Widely seit 2020-01-15.

### ui-components/progress
- (b25) mod-pages.js:293–295: `<progress>` zeigt die Deckel, also Verbrauch statt „the completion progress of a task“, und hat Text darin („Do not add fallback text inside `<progress>`“). Fix: `<meter>` mit `label for`. Für `meter` nennt der Leitfaden keinen Stand.

### card, accordion, checkbox, navbar
- (a) Beiträge als `article`, Links und Knöpfe getrennt, einzelne `details` ohne Landmarke, Haken im `label`. `aria-current`: siehe b8.

## Zählung

(a) 15 · (b) 25, davon 4 unsicher (b15, b18, b23, Teil von b21) · (c) 6

Zuerst den Fragepfad: b3, b4, b18, b19, b20. Danach b10, b11, b21, b24. Der Rest ist niedrig.

## Fragen an Konrad

1. Ist `autocomplete="off"` am Kurscode Absicht, etwa wegen der Pool-PCs? Dann wird es (c) und gehört in den Plan.
2. Sollen die Zustimmungstexte ein kurzes Label bekommen, den Wortlaut als Beschreibung und eine Angabe, was Pflicht ist? Das ist Rechtstext: `ZUSTIMMUNG.version` steigt.
3. Darf `confirm()` einem eigenen `<dialog>` weichen?
4. b10, b21 und b24 verändern den Zugänglichkeitsbaum, den kein Smoke-Test prüft. Soll ein Baumtest in WebKit dazukommen?
