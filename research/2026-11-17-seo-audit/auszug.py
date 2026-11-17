"""Steht die Frage im Text, den ein Extraktor aus einer Frageseite zieht? Nur lokal, kein Netz.

    ~/.local/share/claude-seo/.venv/bin/python -I research/2026-11-17-seo-audit/auszug.py <verzeichnis> [muster]

<verzeichnis> ist ein gebauter Baum (…/site/eidl/f) oder der Ordner `seiten/` eines Crawls. Gezählt wird je Frageseite, ob der Auszug
von trafilatura die ersten fünf Wörter der H1 enthält, den Prüfvermerk und den Anfang der Antwort."""
import glob, html, os, re, sys
import trafilatura

root = sys.argv[1]
files = sorted(glob.glob(os.path.join(root, 'eidl__f__*.html')) + glob.glob(os.path.join(root, '*', 'index.html')))
files = [f for f in files if re.search(r'(?:f__|/)(s\d\d|[0-9a-f]{12})(?:\.html|/index\.html)$', f)]
plain = lambda fragment: ' '.join(html.unescape(re.sub('<[^>]+>', ' ', re.sub(r'<span class="katex".*?</span></span></span>', ' ', fragment, flags=re.S))).split())
mit, ohne, vermerk, antwort, vorn = [], [], 0, 0, 0
for f in files:
    page = open(f, encoding='utf8').read()
    name = re.search(r'(s\d\d|[0-9a-f]{12})', os.path.basename(f) if f.endswith('.html') and 'eidl__' in f else os.path.basename(os.path.dirname(f))).group(1)
    frage = ' '.join(plain(re.search(r'<h1>(.*?)</h1>', page, re.S).group(1)).split()[:5])
    text = re.search(r'<div class="text">(.*?)</div>', page, re.S)
    anfang = ' '.join(plain(text.group(1)).split()[:4]) if text else None
    out = ' '.join((trafilatura.extract(page) or '').split())
    (mit if frage in out else ohne).append(name)
    vorn += out.startswith(frage)
    vermerk += 'Geprüft' in out
    antwort += bool(anfang and anfang in out)
print(f'trafilatura {trafilatura.__version__}: {len(files)} Frageseiten | Frage im Auszug: {len(mit)} | Auszug beginnt mit der Frage: {vorn} | Anfang der Antwort im Auszug: {antwort} | Prüfvermerk: {vermerk}')
print('ohne Frage:', ' '.join(ohne) or '-')
