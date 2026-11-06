#!/usr/bin/env python3
"""
Erzeugt das Logo und alle Ableitungen nach site/brand/. Generiert, nicht gezeichnet (Playbook §3.10, §3.13): Die Farben
kommen aus dem Farbsystem, ein neuer Farbton rendert alles neu. Die Ergebnisse liegen im Repo, damit der Bau der Site kein
Inkscape braucht. Braucht Inkscape, Pillow, matplotlib und die Schrift Inter.

    python3 tools/render_brand.py           # schreibt alles neu
    python3 tools/render_brand.py --check   # prüft, ob die Dateien zum Skript passen

Das Motiv: ein flippiger Hai, der einfach wie ein Hai aussieht, und ein Toupet im Stil von Heine, das schief auf dem Kopf sitzt.
Nicht böse, also keine Zähne. Unter 64 Pixeln trägt das nicht mehr, dafür gibt es die Kachel: helle Silhouette, Toupet und Auge
dunkel. Die Domain steht bewusst nicht im Bild, es überlebt einen Umzug.
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

BODY = 'M30 214 C84 178 158 172 226 200 C288 226 356 222 414 168 L440 190 C408 270 330 326 236 324 C150 322 76 282 30 214 Z'
BELLY = 'M26 226 C110 248 190 268 262 266 C330 264 392 246 442 198 L460 360 L20 360 Z'
TAIL = 'M410 172 C430 140 452 110 496 80 C486 124 480 152 484 176 C498 192 508 216 510 244 C480 228 456 214 436 194 Z'
DORSAL = 'M258 214 C278 176 314 140 362 120 C352 156 350 186 358 214 C326 230 290 230 258 214 Z'
PECTORAL = 'M196 312 C214 340 246 372 292 388 C286 360 274 332 262 310 Z'
# Flach und breit, sitzt schief auf dem Kopf. Haar nie als gestapelte Wülste mit Spitze, das sieht aus wie etwas anderes.
TOUPET = ('M88 182 C92 150 122 124 158 122 C176 104 208 100 230 114 C250 112 272 126 276 148 '
          'C288 152 300 146 308 134 C312 166 284 190 254 182 C238 192 214 188 204 178 C176 170 134 170 88 182 Z')
TOUPET_TILT = 'rotate(-5 180 150)'


def mark():
    return f'''<g transform="translate(0 40)">
<clipPath id="koerper"><path d="{BODY}"/></clipPath>
<path d="{TAIL}" fill="{MARKE}"/><path d="{DORSAL}" fill="{MARKE}"/><path d="{PECTORAL}" fill="{MARKE}"/>
<path d="{BODY}" fill="{MARKE}"/>
<path d="{BELLY}" fill="{FLAECHE}" clip-path="url(#koerper)"/>
<path d="{BODY}" fill="none" stroke="{MARKE}" stroke-width="14" stroke-linejoin="round"/>
<g fill="none" stroke="{FLAECHE}" stroke-width="9" stroke-linecap="round"><path d="M200 222 C206 234 206 246 200 256"/><path d="M224 228 C230 240 230 250 224 262"/><path d="M248 232 C254 244 254 254 248 264"/></g>
<circle cx="132" cy="216" r="23" fill="#fff"/><circle cx="126" cy="217" r="12" fill="{TINTE}"/><circle cx="122" cy="212" r="4" fill="#fff"/>
<path d="M64 250 C94 274 132 278 166 258" fill="none" stroke="{TINTE}" stroke-width="9" stroke-linecap="round"/>
<g transform="{TOUPET_TILT}"><path d="{TOUPET}" fill="{TINTE}"/><path d="M130 158 C168 136 214 136 256 156" fill="none" stroke="{MARKE}" stroke-width="6" stroke-linecap="round"/></g>
</g>'''


def face():
    """Für die Kachel: nah am Kopf, der Körper läuft aus dem Bild. Helle Silhouette, nur Toupet und Auge dunkel"""
    return f'''<g transform="translate(-26 -116) scale(1.62)">
<path d="{DORSAL}" fill="{FLAECHE}"/><path d="{BODY}" fill="{FLAECHE}"/>
<circle cx="130" cy="222" r="19" fill="{TINTE}"/>
<g transform="{TOUPET_TILT}"><path d="{TOUPET}" fill="{TINTE}"/></g>
</g>'''


# Periodische Wellen ergeben eine Landschaft auf dem Torus, die Kachel schließt an allen Rändern nahtlos an
WELLEN = [(1, 0, .9, 0), (0, 1, .8, 1.3), (1, 1, .6, 2.1), (1, -1, .55, .7), (2, 1, .32, 4), (1, 2, .3, 5.2), (2, -1, .26, 3.1), (3, 1, .14, 1.9), (1, -3, .12, .4)]
MUSTER_SEITE = 800
MUSTER_RASTER = 200
MUSTER_LINIEN = 16


def muster():
    """Höhenlinien einer Loss-Landschaft, jede vierte kräftiger wie auf einer Karte. Nur Form, die Farbe gibt die Seite über mask-image"""
    import contourpy
    import numpy as np
    axis = np.linspace(0, 1, MUSTER_RASTER + 1)
    x, y = np.meshgrid(axis, axis)
    field = sum(a * np.cos(2 * np.pi * (m * x + n * y) + phase) for m, n, a, phase in WELLEN)
    lines = contourpy.contour_generator(axis * MUSTER_SEITE, axis * MUSTER_SEITE, field).lines
    levels = np.linspace(field.min(), field.max(), MUSTER_LINIEN + 2)[1:-1]

    def path(points):
        thin = np.vstack([points[:-1:3], points[-1:]])
        return 'M' + 'L'.join(f'{px:.0f} {py:.0f}' for px, py in thin)

    groups = ['', '']
    for i, level in enumerate(levels):
        groups[i % 4 == 0] += ''.join(path(line) for line in lines(level))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {MUSTER_SEITE} {MUSTER_SEITE}">'
            f'<g fill="none" stroke="#000" stroke-linejoin="round"><path stroke-width="1.1" d="{groups[0]}"/><path stroke-width="2.2" d="{groups[1]}"/></g></svg>\n')


def svg(body, width=512, height=512, label='hAInrich'):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{label}">\n'
            f'{body}\n</svg>\n')


def tile(radius=104):
    return svg(f'<clipPath id="kachel"><rect width="512" height="512" rx="{radius}"/></clipPath>\n'
               f'<g clip-path="url(#kachel)"><rect width="512" height="512" fill="{MARKE}"/>\n{face()}</g>')


def maskable():
    """Volle Fläche: Das System schneidet selbst, also das Gesicht in die sichere Mitte"""
    return svg(f'<rect width="512" height="512" fill="{MARKE}"/>\n<g transform="translate(70 70) scale(.72)">{face()}</g>')


def fit(text, font_file, size, limit):
    width = ImageFont.truetype(str(font_file), size).getlength(text)
    if width > limit:
        sys.exit(f'{text!r} ist {width:.0f} px breit, Platz sind {limit} px')


def card():
    lines = [('hAI', 'nrich2', 112, TEXT_X, 250), ('Fragen und Antworten zum Skript', None, 36, TEXT_X, 330),
             ('„Einführung in Deep Learning“', None, 36, TEXT_X, 378), ('Ein Bot antwortet mit Zitat, die Moderation prüft', None, 28, TEXT_X, 456)]
    limit = TEXT_RIGHT - TEXT_X
    fit('hAInrich2', FONT_BOLD, 112, limit)
    for text, _, size, _, _ in lines[1:]:
        fit(text, FONT_REGULAR, size, limit)
    style = 'font-family:Inter'
    title = (f'<text x="{TEXT_X}" y="250" style="{style};font-weight:700;font-size:112px" fill="{TINTE}">'
             f'h<tspan fill="{MARKE}">AI</tspan>nrich2</text>')
    rows = '\n'.join(f'<text x="{x}" y="{y}" style="{style};font-size:{size}px" fill="{TINTE}">{text}</text>' for text, _, size, x, y in lines[1:])
    return svg(f'''<rect width="{CARD_W}" height="{CARD_H}" fill="{FLAECHE}"/>
<rect x="0" y="{CARD_H - 14}" width="{CARD_W}" height="14" fill="{MARKE}"/>
<g transform="translate(14 70) scale(.92)">{mark()}</g>
{title}
{rows}''', CARD_W, CARD_H, 'hAInrich2: Fragen und Antworten zum Skript')


def wordmark():
    style = f'font-family:Inter;font-weight:700;font-size:300px'
    return svg(f'''<g transform="translate(0 20)">{mark()}</g>
<text x="540" y="372" style="{style}" fill="{TINTE}">h<tspan fill="{MARKE}">AI</tspan>nrich</text>''', 1800, 552)


SOURCES = {'logo.svg': lambda: svg(mark()), 'favicon.svg': tile, 'muster.svg': muster}
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
