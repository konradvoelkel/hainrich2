#!/usr/bin/env python3
"""
Erzeugt das Logo und alle Ableitungen nach site/brand/. Generiert, nicht gezeichnet (Playbook §3.10, §3.13): Die Farben
kommen aus dem Farbsystem, ein neuer Farbton rendert alles neu. Die Ergebnisse liegen im Repo, damit der Bau der Site kein
Inkscape braucht. Braucht Inkscape, Pillow und die Schrift Inter.

    python3 tools/render_brand.py           # schreibt alles neu
    python3 tools/render_brand.py --check   # prüft, ob die Dateien zum Skript passen

Das Motiv: Hai und Heine, also Hai-Profil mit Zähnen, dazu Seitenscheitel, Vatermörder und Halsbinde. Unter 64 Pixeln trägt
das nicht mehr, dafür gibt es die Kachel: helles Gesicht, Haar, Auge, Lächeln. Die Domain steht bewusst nicht im Bild, es
überlebt einen Umzug.
"""
import math
import pathlib
import subprocess
import sys
import tempfile

from PIL import Image, ImageFont

HUE = 295
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'site' / 'brand'
FONT_BOLD = pathlib.Path.home() / '.local/share/fonts/Inter/Inter-Bold.ttf'
FONT_REGULAR = pathlib.Path.home() / '.local/share/fonts/Inter/Inter-Regular.ttf'
CARD_W, CARD_H = 1200, 630
TEXT_X, TEXT_RIGHT = 500, 1140


def oklch(lightness, chroma, hue):
    """Inkscape löst oklch() nicht auf, deshalb Hex"""
    h = math.radians(hue)
    a, b = chroma * math.cos(h), chroma * math.sin(h)
    l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3
    linear = (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
              -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
              -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    gamma = lambda x: 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055
    return '#%02x%02x%02x' % tuple(round(gamma(max(0, min(1, c))) * 255) for c in linear)


MARKE = oklch(.52, .12, HUE)
FLAECHE = oklch(.95, .03, HUE)
TINTE = oklch(.25, .015, HUE)

BODY = ('M26 256 C58 214 126 192 196 178 C262 164 340 168 392 198 C446 230 476 282 464 340 '
        'C452 398 388 440 300 442 C206 444 118 404 62 330 C42 304 24 276 26 256 Z')
BELLY = 'M30 276 C120 296 232 322 318 338 C380 350 432 340 484 306 L484 472 L20 472 Z'
# Seitenscheitel, flache Wellen ohne Spitze, unten wippt die Locke nach außen. Gestapelte Wülste mit Spitze sehen
# aus wie etwas anderes (Konrad, 2026-11-05).
HAIR = ('M146 218 C150 176 176 150 206 146 C214 122 248 100 286 102 C300 88 334 84 362 96 '
        'C398 96 440 122 456 160 C484 176 500 216 488 254 C506 282 504 322 486 346 C500 352 510 350 520 338 '
        'C518 372 486 394 452 378 C440 396 404 398 386 374 C374 388 344 384 336 362 '
        'C354 330 368 282 372 240 C336 212 286 200 240 202 C208 204 178 226 146 218 Z')
MOUTH = 'M66 304 C116 350 200 356 272 306 C226 392 104 382 66 304 Z'
TEETH = 'M104 331 L118 356 L134 342 Z M146 346 L160 370 L176 348 Z M190 344 L206 364 L218 332 Z'
# Biedermeier wie auf den Porträts: dunkler Rock, Vatermörder, Halsbinde
COAT = 'M120 512 C132 440 200 360 300 356 C400 352 470 430 490 512 Z'
SHIRT = 'M246 404 L354 404 L300 500 Z'
COLLAR = 'M226 360 L204 446 L300 414 L396 446 L374 360 Z'
BOW = 'M264 420 L300 434 L336 420 L336 456 L300 442 L264 456 Z'
TILE_HEAD = ('M60 280 C96 244 150 226 214 212 C276 200 348 206 392 234 C436 262 452 306 440 350 '
             'C428 396 372 430 296 430 C214 430 136 396 90 336 C74 316 58 296 60 280 Z')
TILE_HAIR = ('M170 238 C172 200 196 176 224 172 C232 148 264 128 298 130 C312 118 342 114 368 126 '
             'C402 128 440 150 454 186 C482 202 494 240 482 274 C498 300 496 336 478 358 C492 362 502 360 510 348 '
             'C508 382 478 402 448 388 C436 404 402 404 386 382 C374 394 350 390 344 370 '
             'C368 336 386 296 392 258 C358 234 310 222 262 224 C232 226 202 246 170 238 Z')


def mark():
    return f'''<path d="{COAT}" fill="{TINTE}"/><path d="{SHIRT}" fill="#fff"/><path d="{COLLAR}" fill="#fff"/><path d="{BOW}" fill="{TINTE}"/>
<g transform="translate(4 -26) scale(.92)">
<clipPath id="koerper"><path d="{BODY}"/></clipPath>
<path d="{BODY}" fill="{MARKE}"/>
<path d="{BELLY}" fill="{FLAECHE}" clip-path="url(#koerper)"/>
<path d="{BODY}" fill="none" stroke="{MARKE}" stroke-width="20" stroke-linejoin="round"/>
<path d="{HAIR}" fill="{TINTE}"/>
<g fill="none" stroke="{MARKE}" stroke-width="9" stroke-linecap="round"><path d="M226 150 C296 138 372 168 420 236"/><path d="M420 236 C436 262 444 296 438 330"/></g>
<circle cx="200" cy="250" r="31" fill="#fff"/><circle cx="192" cy="252" r="15" fill="{TINTE}"/>
<path d="{MOUTH}" fill="{TINTE}"/><path d="{TEETH}" fill="#fff"/>
<g fill="none" stroke="{FLAECHE}" stroke-width="12" stroke-linecap="round"><path d="M290 244 C298 262 298 280 290 298"/><path d="M326 248 C334 266 334 284 326 302"/></g>
</g>'''


def face():
    return f'''<path d="{TILE_HEAD}" fill="{FLAECHE}"/><path d="{TILE_HAIR}" fill="{TINTE}"/>
<circle cx="214" cy="290" r="30" fill="{TINTE}"/>
<path d="M104 340 C160 382 236 382 300 340" fill="none" stroke="{TINTE}" stroke-width="26" stroke-linecap="round"/>'''


def svg(body, width=512, height=512, label='hAInrich'):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{label}">\n'
            f'{body}\n</svg>\n')


def tile(radius=104):
    return svg(f'<rect width="512" height="512" rx="{radius}" fill="{MARKE}"/>\n{face()}')


def maskable():
    """Volle Fläche: Das System schneidet selbst, also das Gesicht in die sichere Mitte"""
    return svg(f'<rect width="512" height="512" fill="{MARKE}"/>\n<g transform="translate(77 72) scale(.7)">{face()}</g>')


def fit(text, font_file, size, limit):
    width = ImageFont.truetype(str(font_file), size).getlength(text)
    if width > limit:
        sys.exit(f'{text!r} ist {width:.0f} px breit, Platz sind {limit} px')


def card():
    lines = [('hAI', 'nrich', 112, TEXT_X, 250), ('Fragen und Antworten zum Skript', None, 36, TEXT_X, 330),
             ('„Einführung in Deep Learning“', None, 36, TEXT_X, 378), ('Jede Antwort mit wörtlichem Zitat', None, 28, TEXT_X, 456)]
    limit = TEXT_RIGHT - TEXT_X
    fit('hAInrich', FONT_BOLD, 112, limit)
    for text, _, size, _, _ in lines[1:]:
        fit(text, FONT_REGULAR, size, limit)
    style = 'font-family:Inter'
    title = (f'<text x="{TEXT_X}" y="250" style="{style};font-weight:700;font-size:112px" fill="{TINTE}">'
             f'h<tspan fill="{MARKE}">AI</tspan>nrich</text>')
    rows = '\n'.join(f'<text x="{x}" y="{y}" style="{style};font-size:{size}px" fill="{TINTE}">{text}</text>' for text, _, size, x, y in lines[1:])
    return svg(f'''<rect width="{CARD_W}" height="{CARD_H}" fill="{FLAECHE}"/>
<rect x="0" y="{CARD_H - 14}" width="{CARD_W}" height="14" fill="{MARKE}"/>
<g transform="translate(40 96) scale(.84)">{mark()}</g>
{title}
{rows}''', CARD_W, CARD_H, 'hAInrich: Fragen und Antworten zum Skript')


def wordmark():
    style = f'font-family:Inter;font-weight:700;font-size:300px'
    return svg(f'''<g transform="translate(0 20)">{mark()}</g>
<text x="540" y="372" style="{style}" fill="{TINTE}">h<tspan fill="{MARKE}">AI</tspan>nrich</text>''', 1800, 552)


SOURCES = {'logo.svg': lambda: svg(mark()), 'favicon.svg': tile}
PNGS = {'apple-touch-icon.png': (lambda: tile(0), 180), 'icon-192.png': (tile, 192), 'icon-512.png': (tile, 512), 'icon-maskable-512.png': (maskable, 512), 'logo-512.png': (lambda: svg(mark()), 512)}


def inkscape(source, target, width=None, extra=()):
    size = ['-w', str(width)] if width else []
    subprocess.run(['inkscape', str(source), '--export-filename', str(target), *size, *extra], check=True, capture_output=True)


def render():
    OUT.mkdir(exist_ok=True)
    for name, make in SOURCES.items():
        (OUT / name).write_text(make(), encoding='utf8')
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)

        def raster(text, target, width):
            source = tmp / 'quelle.svg'
            source.write_text(text, encoding='utf8')
            inkscape(source, target, width, ['--export-text-to-path'])

        for name, (make, width) in PNGS.items():
            raster(make(), OUT / name, width)
        raster(card(), OUT / 'og-card.png', CARD_W)
        icons = []
        for size in (16, 32, 48):
            raster(tile(), tmp / f'{size}.png', size)
            icons.append(Image.open(tmp / f'{size}.png').convert('RGBA'))
        icons[-1].save(OUT / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=icons[:-1])
        words = tmp / 'wort.svg'
        words.write_text(wordmark(), encoding='utf8')
        inkscape(words, OUT / 'logo-wortmarke.svg', None, ['--export-text-to-path', '--export-plain-svg'])
    # im Bild steckt mit Inter eine Schrift, die nicht jeder hat; im Ergebnis stehen nur Pfade
    if '<text' in (OUT / 'logo-wortmarke.svg').read_text(encoding='utf8'):
        sys.exit('logo-wortmarke.svg enthält noch Text')
    print(f'{len(list(OUT.iterdir()))} Dateien in {OUT.relative_to(ROOT)}, Marke {MARKE}, Fläche {FLAECHE}, Tinte {TINTE}')


def check():
    bad = [name for name, make in SOURCES.items() if (OUT / name).read_text(encoding='utf8') != make()]
    for name, (_, width) in PNGS.items():
        if Image.open(OUT / name).size != (width, width):
            bad.append(name)
    if Image.open(OUT / 'og-card.png').size != (CARD_W, CARD_H):
        bad.append('og-card.png')
    if sorted(Image.open(OUT / 'favicon.ico').info['sizes']) != [(16, 16), (32, 32), (48, 48)]:
        bad.append('favicon.ico')
    sys.exit(f'veraltet: {bad}') if bad else print('site/brand passt zum Skript')


check() if '--check' in sys.argv else render()
