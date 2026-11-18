"""Steht die Frage im Text, den ein Extraktor aus einer Frageseite zieht? Nur lokal, kein Netz.

    ~/.local/share/claude-seo/.venv/bin/python -I research/2026-11-17-seo-audit/auszug.py <verzeichnis> [muster]

<verzeichnis> ist ein gebauter Baum (…/site/eidl/f) oder der Ordner `seiten/` eines Crawls. Gezählt wird je Frageseite, ob der Auszug
von trafilatura die ersten fünf Wörter der H1 enthält, den Prüfvermerk und den Anfang der Antwort.

Seit dem 2026-11-18 dazu (Audit vom selben Tag, Befund 2): ob in den ersten 400 Zeichen des Auszugs steht, dass ein Sprachmodell
geantwortet hat, ob der Auszug ein zitiertes Kapitel beim Namen nennt, und ob er mit Links eine Adresse des Skripts trägt. Die
Stellen des Skripts liest das Skript aus den Bildunterschriften der Zitate; eine Seite ohne Zitat zählt dort nicht mit."""
import glob, html, os, re, sys
from urllib.parse import urlsplit
import trafilatura

root = sys.argv[1]
files = sorted(glob.glob(os.path.join(root, 'eidl__f__*.html')) + glob.glob(os.path.join(root, '*', 'index.html')))
files = [f for f in files if re.search(r'(?:f__|/)(s\d\d|[0-9a-f]{12})(?:\.html|/index\.html)$', f)]
plain = lambda fragment: ' '.join(html.unescape(re.sub('<[^>]+>', ' ', re.sub(r'<span class="katex".*?</span></span></span>', ' ', fragment, flags=re.S))).split())
mit, ohne, vermerk, antwort, vorn = [], [], 0, 0, 0
bot, herkunft, zitiert, kapitel, adresse = 0, 0, 0, 0, 0
for f in files:
    page = open(f, encoding='utf8').read()
    name = re.search(r'(s\d\d|[0-9a-f]{12})', os.path.basename(f) if f.endswith('.html') and 'eidl__' in f else os.path.basename(os.path.dirname(f))).group(1)
    frage = ' '.join(plain(re.search(r'<h1>(.*?)</h1>', page, re.S).group(1)).split()[:5])
    text = re.search(r'<div class="text">(.*?)</div>', page, re.S)
    anfang = ' '.join(plain(text.group(1)).split()[:4]) if text else None
    out = ' '.join((trafilatura.extract(page) or '').split())
    (mit if frage in out else ohne).append(name)
    vorn += out.startswith(frage)
    vermerk += bool(re.search(r'[Gg]eprüft am \d\d\.', out))
    if 'aria-label="Antwort des Bots"' in page:
        bot += 1
        herkunft += 'Sprachmodell' in out[:400]
    stellen = re.findall(r'<figcaption>\[\d+\] <a href="([^"]+)"[^>]*>(.*?)</a></figcaption>', page, re.S)
    if stellen:
        zitiert += 1
        titel = {plain(name).split(' › ')[0] for _, name in stellen}
        hosts = {urlsplit(html.unescape(url)).netloc for url, _ in stellen}
        kapitel += any(f'„{t}“' in out for t in titel)
        adresse += any(h in (trafilatura.extract(page, include_links=True) or '') for h in hosts)
    antwort += bool(anfang and anfang in out)
print(f'trafilatura {trafilatura.__version__}: {len(files)} Frageseiten | Frage im Auszug: {len(mit)} | Auszug beginnt mit der Frage: {vorn} | Anfang der Antwort im Auszug: {antwort} | Prüfvermerk: {vermerk}')
print(f'Sprachmodell in den ersten 400 Zeichen: {herkunft} von {bot} Seiten mit Antwort des Bots | zitiertes Kapitel beim Namen genannt: {kapitel} von {zitiert} Seiten mit Zitat | Adresse des Skripts im Auszug mit Links: {adresse} von {zitiert}')
print('ohne Frage:', ' '.join(ohne) or '-')
