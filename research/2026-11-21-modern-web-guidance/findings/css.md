# CSS und visuelle Gestaltung, geprüft gegen Modern Web Guidance (64a6d70)

Geprüft: `site/style.css` (276 Zeilen), Köpfe in `lib/site.js:258-284` und `lib/mod-pages.js:15-23`, Markup-Stellen, `site/brand/*.svg`, `site/stimmen.js`, `site/fragen.js`. Nur gelesen, nichts im Browser gemessen. Kontrastwerte sind aus den oklch-Werten geschätzt (bei fast grauen Farben gilt L³ ≈ Y).

## Gelesene Leitfäden

Ganz gelesen: css/css, css/css-layout, css/responsive-design, css/overflow-clipping-control, visual-design/dark-mode, visual-design/color, visual-design/typography, visual-design/visually-stable-font-fallbacks, visual-design/improve-text-layout-and-legibility, visual-design/browser-ui-theming, ui-atoms/responsive-table, ui-atoms/scrollability-affordance-hints, ui-behaviors/motion.
Zusätzlich gelesen: visual-design/soft-edge-content-fade, visual-design/visually-texture-content, visual-design/visual-effects, visual-design/visually-stable-mixed-fonts, visual-design/custom-text-decorations, visual-design/contrast-color, css/atrule-support-conditionals, css/individual-transform-properties, css/size-aware-styling, css/reduce-style-repetition, ui-atoms/single-line-overflow, ui-atoms/icons.

## Nicht anwendbar

contrast-color (feste Farbpaare, kein Hintergrund zur Laufzeit), reduce-style-repetition (`@function`, kein Bedarf), single-line-overflow (`nowrap` nur an kurzen Etiketten und Zahlen, nichts wird abgeschnitten), Sticky-Köpfe aus responsive-table (kurze Listen), icons außer dem Logo (▲▼ sind Textzeichen). Der Textmarker (272) ist ein Markerband und keine Linie, custom-text-decorations deckt ihn nicht. Die übrigen Titel unter css/, visual-design/, ui-atoms/ (Karussell, Tooltips, Anchor, Scrollbar-Farben, 3D, Formen) passen zu keinem Muster der Site. `theme-color` behandelt kein Leitfaden.

## Befunde

### css/css
- (a) Farben laufen alle über Tokens auf `:root`.
- (a) `:is()`/`:where()` statt doppelter Regeln (89, 94, 266-271).
- (a) Zustände kommen aus Selektoren (`[open]`, `[hidden]`; 94, 172, 217).
- **(b) B1 Physische Eigenschaften**, `style.css:52, 89, 91, 95, 112-115, 140, 142-143, 163, 169, 189, 191, 224, 232-233, 242-243, 250`. „Prefer logical properties and values over physical ones“. Uneinheitlich: Zeile 250-251 und 272 sind schon logisch. Kein Baseline-Stand genannt, kein Fallback nötig. Fix: `margin-inline-start: auto`, `border-inline-start`, `padding-inline-start`, `text-align: start/end`, `inset-inline-start`. Niedrig.
- **(b) B2 Reset auf `*` und keine Layer**, `style.css:37`. „DO NOT use global resets (styles on `*`)“, „Use cascade layers (`@layer`) to define explicit priority zones“. Fix: `box-sizing` nur an Feldern und Kästen; der Auftrittsblock 262-273 als eigene Schicht. Niedrig, der Nutzen ist hier klein.
- **(b) B3 Doppeltes Wissen und tote Regeln**, „Be allergic to knowledge duplication.“ Geprüft: `.antwort` kommt nur als `beitrag antwort` vor (`site.js:415, 428`). Darum wird `style.css:81` ganz überschrieben, `:82` (`.antwort > header`) trifft nie (der Kopf steht in `.inhalt`), und `:148` setzt nur 81 zurück. Alle drei können weg. `:174` und `:202` haben dieselben Felddeklarationen (zusammenlegen als `.formular :is(input, textarea, select)`). Den Hauptknopf-Dreiklang tragen `:179, 182, 201` je für sich, die Knopfgrundform `:178` und `:183`. Kleingrößen .85, .88, .9rem und sechs Radien ohne Token. Niedrig.

### css/css-layout
- (a) Flex mit `flex-wrap` und `gap`, `min-width: 0` an `.thema > div` (222), Grid mit `minmax(0, 1fr)` und Areas (123, 136).
- (a) Kein `100vw`, `overflow: auto` statt `scroll`, Bilder haben `width`/`height`.
- **(c) C1 Sichtreihenfolge der Fragekarte per Grid-Areas**, `style.css:135-139`. „Don't use `order` … to reorder interactive content“. Grund im Kommentar 135: Die H1 steht für Textextraktoren zuerst. Die H1 enthält nichts Fokussierbares, die Tab-Folge (Pfeile, dann Melden und #1) passt zum Bild.
- **(b) B4 `overflow: hidden` zum Rundschneiden**, `style.css:111, 123` (auch overflow-clipping-control). „Don't reach for `overflow: hidden` when you only want to clip“. `overflow: clip` ist Widely (2022-09-12), ein Fallback ist nicht nötig. Fix: `overflow: clip`. Unsicher an der Tabelle `.liste`: im Smoke-Test ansehen.
- **(b) B5 Waagerechte Scroller ohne `overscroll-behavior`**, `style.css:100, 102, 230`. „Use `overscroll-behavior: contain` (or `none`) on nested scroll regions“. Kein Baseline-Stand genannt. Fix: `overscroll-behavior-x: contain`, damit das Wischen am Rand einer Formel nicht „Zurück“ auslöst. Unsicher, ob das gewollt ist.

### css/responsive-design, css/size-aware-styling, ui-atoms/responsive-table
- (a) Schrift in `rem`, kein `vw`, Medienabfragen in `rem`.
- (a) Die gestapelte Tabelle blendet `thead` aus und beschriftet mit `attr(data-label)` (158, 164).
- **(b) B6 `@media` statt `@container`**, `style.css:150, 223`. „Use `@container` queries instead of `@media` queries.“ Container queries sind Widely (2023-02-14), ein Fallback ist nicht nötig. Fix: `main { container-type: inline-size }` und `@container (width < 34rem)`. Niedrig, denn alles steht in derselben Spalte.
- **(b) B7 Scroller der Admin-Tabelle**, `lib/mod-pages.js:283` (`.breit`). „Add a `tabindex="0"` attribute to the container“, dazu `role="region"` mit Namen. Fix im Markup. Das überschneidet sich mit dem HTML-Prüfer, betrifft nur die Moderation.

### visual-design/dark-mode
- (a) `color-scheme: light dark` auf `:root` (3), die Tokens schalten auf `:root` um (18-33), das Muster folgt `--marke`. Es gibt kein `matchMedia`.
- **(b) B8 `<meta name="color-scheme">` fehlt**, `lib/site.js:261-283`, `lib/mod-pages.js:17-22`. „MANDATORY: … place a `<meta>` tag in your `<head>`“. `color-scheme` ist Widely (2022-02-03), ein Fallback ist nicht nötig. Fix: `<meta name="color-scheme" content="light dark">` in beide Köpfe. Mittel: Ohne das Tag bleibt der Grund weiß, bis das CSS geladen ist.
- **(b) B9 Logo mit festen Farben**, `site/brand/logo.svg:9-11` (Frisur und Pupille `#222028`, L ≈ 0,25) auf `--grund` dunkel (L 0,2) und `--flaeche` (L 0,3). Dazu icons: „contrast of at least 3:1 against their backgrounds in light and dark“. Unsicher, denn es ist ein Logo; ansehen. Fix: eine eigene Farbe für Dunkel per `@media (prefers-color-scheme: dark)` in der SVG oder eine helle Kontur.

### visual-design/color
- (a) Status steht als Text in Badges und Meldungen. Textkontraste lagen im Audit vom 16.11. überall bei mindestens 5,5:1.
- **(b) B10 Feldränder unter 3:1**, `style.css:70, 174, 202` (`--linie` L 0,88 auf Weiß ≈ 1,4:1, dunkel ≈ 1,5:1, geschätzt). „Maintain a minimum contrast ratio of 3:1 for user interface component boundaries“. Kein Feature, also kein Fallback. Fix: Token `--feldrand: oklch(0.6 0.02 295)`, das in beiden Schemata etwa 4:1 schafft, für `input`, `textarea` und `select`. Dazu optional `@media (prefers-contrast: more)` für `--linie` und `--leise`. Mittel.
- **(b) B11 Abstimmzustand nur über die Farbe**, `style.css:220` (`--marke` und `--leise` sind fast gleich hell); `site/stimmen.js:35-36` setzt die Klasse `an` und `aria-pressed`. „Don't use color alone to indicate … its state“, „Define system color fallbacks … `@media (forced-colors: active)`“. Kein Baseline-Stand genannt. Fix: `.pfeil[aria-pressed="true"] { background: var(--flaeche); outline: 1px solid currentColor; outline-offset: -1px }`. Der Umriss bleibt auch im Kontrastmodus, die Klasse `an` fällt weg. Mittel.
- **(b) B12 `color-mix(in oklch, …, transparent)`**, `style.css:272` (auch visual-effects: „Avoid using `in oklch` for alpha transparency fades“). Laut Leitfaden zieht ein Chromium-Fehler den Farbton dabei Richtung Magenta. Kein Fallback nötig. Fix: `in oklab`. Zeile 273 mischt zwei bunte Farben, das ist in Ordnung. Niedrig.

### visual-design/typography, visual-design/improve-text-layout-and-legibility
- (a) `line-height` ohne Einheit, `overflow-wrap`, keine `px`-Schrift.
- (a) Spalte rund 75 Zeichen, kein Blocksatz, `hyphens: auto` mit `lang="de"`. `text-wrap: pretty` an `.pruefung` (144).
- **(b) B13 `text-wrap` fehlt sonst**. „Use `text-wrap: balance` for balanced headlines and headline-like content“. balance ist Newly (2024-05-13), pretty eingeschränkt (Chrome 117, Safari 26, nicht Firefox); beides wird sonst ignoriert, ein Fallback ist nicht nötig. Fix: `h1, h2 { text-wrap: balance }`, `.text p, blockquote, .einleitung { text-wrap: pretty }`. Niedrig.

### visual-design/visually-stable-font-fallbacks, visual-design/visually-stable-mixed-fonts
- (a) Eigene Datei, `font-display: swap`, Preload (`site.js:281`).
- **(b) B14 Kein `font-size-adjust`**, `style.css:266` (Bricolage, Rückfall `system-ui`) und `:101` (`code` mit festem `.92em`). „Normalize the font size based on the primary font's x-height.“ Newly (2024-07-25; Chrome 127, Firefox 118, Safari 17). Laut mixed-fonts ist ein Fallback per `@supports not` Pflicht, dafür taugt das heutige `.92em`. Fix: an 266 ein fester Zahlenwert aus der Schrift; unsicher, ob `from-font` während des Tauschs greift. Für Code `font-size-adjust: from-font` am `body`, mit `none` an Bricolage und `.katex`, sonst rechnet KaTeX falsch. Niedrig: Das Audit vom 16.11. sah keinen Sprung.

### visual-design/browser-ui-theming
- (a) `resize: vertical` (175), kein `user-select: none`, kein `scrollbar-width`, `<button>` statt `input type=submit`, `accent-color` an `progress` (237). Optional: `accent-color` auf `:root` für das Häkchen der Einwilligung.

### ui-atoms/scrollability-affordance-hints, visual-design/soft-edge-content-fade, ui-behaviors/motion
- (a) Für einen waagerechten Scroller passt ein Verlauf. Kein Listener, er wirkt nur bei Überlauf, `animation` steht vor `animation-timeline` (253-260). Die Stufen zwischen den Gradienten springen statt zu gleiten, das funktioniert trotzdem. Das fehlende `-webkit-mask-image` in den Keyframes betrifft hinter dem `@supports` nur Chrome 115-119.
- **(b) B15 Die Maske verdeckt den Fokusring**, `style.css:254-258`. motion: „Both also clip the element's own focus outline“. Chromium und Firefox fokussieren Scroller ohne fokussierbaren Inhalt per Tab. Unsicher, mit Tab prüfen. Masken samt `no-clip` sind Widely (2023-12-07), ein Fallback ist nicht nötig. Fix: die Bandmaske des Leitfadens (`linear-gradient(black, black) no-clip subtract` plus Bänder) oder `:focus-visible` am Elternteil zeichnen. Mittel.
- **(c) C2 Ohne scroll-getriebene Animation fehlt der Hinweis**, `style.css:252-253`. „If the scrollbar is hidden, … you MUST use a fallback.“ Scroll-getriebene Animationen sind Newly (2026-10-27; Chrome 115, Firefox 159, Safari 26). Am Telefon ist die Scrollleiste verborgen, ein Fallback wäre also nötig. Grund im Kommentar 252: „Wo der Browser es kann“. Möglicher Fallback ohne JS: Schatten per `background-attachment: local` auf `var(--karte)` in `@supports not (animation-timeline: scroll())`.

### ui-behaviors/motion, css/individual-transform-properties
- (a) Es läuft nichts von selbst und nichts blinkt; `translate` statt `transform`.
- **(b) B16 Reduzierte Bewegung als Abschalten**, `style.css:269, 274-276`. „Default to static state and opt in to full motion“. Fix: Die `transition` gehört in `@media (prefers-reduced-motion: no-preference)`. Niedrig.
- **(b) B17 Ohne Grundwert, an einem Inline-Element wirkungslos**, `style.css:269-271, 183`. „apply an identity transformation to the base element“. Widely (2022-08-05), ein Fallback ist nicht nötig. Geprüft: In `#neue-frage` (`site.js:513`) steht `.knopf` inline in einem `<p>`, dort greift `translate` nicht, und das senkrechte Padding überlappt Nachbarzeilen. Fix: `translate: 0` an 269, `display: inline-block` an `.knopf`. Niedrig.

### visual-design/custom-text-decorations
- **(b) B18 Unterstreichung nur bei `:hover`**, `style.css:79, 120`. „Include `:focus-visible` so keyboard users get the same reveal“. Fix: `:is(:hover, :focus-visible)`. Niedrig.

### Übrige
- (a) visually-texture-content: Das Muster nutzt `-webkit-mask` und `mask`, steht in `@media screen` und ist ohne Maske lesbar (264).
- (a) visual-effects: Das Streifenmuster ist ein Gradient (273), `color-mix` nennt seinen Farbraum.
- (a) atrule-support-conditionals: `@supports` prüft eine Eigenschaft, kein `at-rule()`.

## Zählung

(a) 23, (b) 18 (mittel: B8, B10, B11, B15; unsicher: B5, B9, B15 und die Tabelle in B4), (c) 2.

## Fragen an Konrad

1. C2: Soll es für die Formelränder einen Fallback geben, für iOS unter 26 und Firefox ESR? Der Leitfaden verlangt ihn, weil Telefone die Scrollleiste verbergen.
2. B9: Brauchen Logo und Bot-Bild eine Fassung für Dunkel? Das betrifft die Marke (BRANDING.md).
3. B10: Ein dunklerer Feldrand ändert das Bild aller Eingabefelder. Ist das in Ordnung?
4. `theme-color` ist ein einziger Wert (`#6f59a6`, `site.js:277`). Soll eine zweite Fassung mit `media="(prefers-color-scheme: dark)"` dazu? Kein Leitfaden verlangt das.
5. Außerhalb der Leitfäden: `hyphens: auto` erbt in `code` (101). Deutsche Trennung kann Bezeichner mit sichtbarem Strich brechen; `code, pre { hyphens: manual }`?
6. Zielbrowser: Im Repo steht keine Browser-Politik. Ob B13, B14 und C2 einen Fallback brauchen, hängt davon ab, ob „Widely available“ das Ziel ist.
