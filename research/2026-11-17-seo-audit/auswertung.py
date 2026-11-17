"""Wertet einen Crawl aus und hält ihn gegen einen früheren: python3 auswertung.py <crawl.json> [<früherer crawl.json>]. Nur lesen, kein Netz."""
import json, re, sys, collections
neu = json.load(open(sys.argv[1])); alt = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else None
B = 'https://hai.konradvoelkel.com/eidl/'
P = {u: p for u, p in neu['pages'].items() if 'title' in p}
kind = lambda u: ('neu-variante' if '?kapitel=' in u else 'frage' if re.search(r'/f/(s\d+|[0-9a-f]{12})/$', u) else 'kapitel' if '/f/kapitel/' in u else 'neu' if u.endswith('/f/neu/') else 'unterforum' if re.search(r'/f/[a-z]+/$', u) else 'start' if u == B else 'text')
arten = collections.Counter(kind(u) for u in P)
print('Seiten:', len(P), dict(arten), '| gesperrt:', [u.replace(B, '') for u, p in neu['pages'].items() if p.get('blocked')], '| kaputt:', neu['broken'])
print('Status ungleich 200:', [u for u, p in P.items() if p['status'] != 200], '| robots:', dict(collections.Counter(p['robots'] for p in P.values())), '| lang:', dict(collections.Counter(p['lang'] for p in P.values())))
print('H1 ungleich 1:', [u.replace(B, '') for u, p in P.items() if len(p['h1']) != 1])
echt = {u: p for u, p in P.items() if kind(u) != 'neu-variante'}
print('Canonical nicht auf sich selbst (echte Seiten):', [u.replace(B, '') for u, p in echt.items() if p['canon'] != u], '| Varianten zeigen auf f/neu/:', all(p['canon'] == B + 'f/neu/' for u, p in P.items() if kind(u) == 'neu-variante'))
t = {u: p['title'] for u, p in echt.items()}
print('Titel: längster', max(len(x) for x in t.values()), '| über 65:', [u.replace(B, '') for u, x in t.items() if len(x) > 65], '| doppelt:', [x for x, n in collections.Counter(t.values()).items() if n > 1], '| mit „…“:', sum('…' in x for x in t.values()))
d = {u: p['desc'] or '' for u, p in echt.items()}
# Berichtigt am 17.11.: Die erste Fassung kappte die Liste nach acht Einträgen und suchte nur „ … “ mit Leerzeichen; die Inhaltsprüfung zählte nach
print('Beschreibung: fehlt', sum(not x for x in d.values()), '| über 160:', sum(len(x) > 160 for x in d.values()), '| unter 70:', [(u.replace(B, ''), len(x)) for u, x in d.items() if 0 < len(x) < 70], '| doppelt:', sum(n > 1 for n in collections.Counter(d.values()).values()), '| mit „…“ vor dem Ende:', [u.replace(B, '') for u, x in d.items() if '…' in x[:-2]], '| am Ende gekürzt:', sum(x.endswith('…') for x in d.values()))
fragen = {u: p for u, p in P.items() if kind(u) == 'frage'}
ohne_kapitel = [u.replace(B, '') for u, p in fragen.items() if not any('/f/kapitel/' in l for l in p['inlinks'])]
ziele = collections.Counter(l for p in P.values() for l in set(p['inlinks']))
print('Fragen ohne Link aufs Kapitel:', ohne_kapitel, '| verwaist:', [u.replace(B, '') for u in echt if ziele[u] == 0 and u != B], '| Links ins Leere:', sorted({l.replace(B, '') for p in P.values() for l in p['inlinks'] if l.startswith(B) and l not in neu['pages']})[:5])
ld = lambda p: [x.get('@type') or [n.get('@type') for n in x.get('@graph', [])] for x in map(json.loads, p['ld'])]
print('Strukturierte Daten je Art:', {k: dict(collections.Counter(json.dumps(ld(p), ensure_ascii=False) for u, p in P.items() if kind(u) == k)) for k in arten})
print('Wörter: Fragen', min(p['words'] for p in fragen.values()), 'bis', max(p['words'] for p in fragen.values()), '| Kapitelseiten', sorted(p['words'] for u, p in P.items() if kind(u) == 'kapitel')[:3], '…')
print('Fremde Links:', len(neu['ext']), collections.Counter(re.sub(r'https?://([^/]+)/.*', r'\1', x) for x in neu['ext']).most_common(6))
print('Kopfzeilen der Seiten:', {k: dict(collections.Counter((p['headers'].get(k) or '-')[:60] for p in P.values())) for k in ('cache-control', 'x-robots-tag', 'referrer-policy', 'strict-transport-security')})
if 'assets' in neu:
    print('Dateien nach Cache-Control:', {k: sorted(a.replace(B, '').replace('https://hai.konradvoelkel.com', '') for a, h in neu['assets'].items() if h.get('cache-control') == k)[:14] for k in sorted({h.get('cache-control') for h in neu['assets'].values()}, key=str)})
    print('Dateien ohne Kompression (über 2 KB, Text):', [a.replace(B, '') for a, h in neu['assets'].items() if not h.get('content-encoding') and re.search(r'\.(js|css|svg|json|html)$', a) and int(h.get('content-length', 0)) > 2000])
bilder = collections.Counter((i[0].split('/')[-1], i[1], i[2], i[3]) for p in P.values() for i in p['img'])
print('Bilder:', dict(bilder))
if alt:
    A = {u: p for u, p in alt['pages'].items() if 'title' in p}
    print('--- gegen den früheren Crawl ---')
    print('weg:', sorted(u.replace(B, '') for u in A if u not in P), '| neu:', sorted(u.replace(B, '') for u in P if u not in A))
    gem = [u for u in P if u in A]
    for feld in ('title', 'desc', 'robots', 'canon'):
        diff = [u for u in gem if P[u][feld] != A[u][feld]]
        print(f'{feld} anders: {len(diff)}', collections.Counter(kind(u) for u in diff).most_common(), [(A[u][feld], P[u][feld]) for u in diff[:2]] if feld in ('title', 'desc') else '')
    print('Wörter je Art, Mittel früher -> jetzt:', {k: (round(sum(A[u]['words'] for u in gem if kind(u) == k) / max(1, sum(kind(u) == k for u in gem))), round(sum(P[u]['words'] for u in gem if kind(u) == k) / max(1, sum(kind(u) == k for u in gem)))) for k in arten})
    print('Bytes je Art, Mittel früher -> jetzt:', {k: (round(sum(A[u]['bytes'] for u in gem if kind(u) == k) / max(1, sum(kind(u) == k for u in gem))), round(sum(P[u]['bytes'] for u in gem if kind(u) == k) / max(1, sum(kind(u) == k for u in gem)))) for k in arten})
