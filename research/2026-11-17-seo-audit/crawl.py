"""Crawl der öffentlichen Site, nur GET: python3 crawl.py <ausgabe.json> [verzeichnis für das rohe HTML].
Wie am 06.11. und 16.11., dazu seit dem 17.11.: das rohe HTML je Seite (damit die Fachprüfungen den Host nicht selbst abrufen), die
Kopfzeilen der Seiten und die der eingebundenen Dateien (Cache-Control, seit dem 17.11. im Server-Repo gesetzt)."""
import json, os, re, sys, time, urllib.request, urllib.parse, urllib.robotparser, gzip
from html.parser import HTMLParser
BASE='https://hai.konradvoelkel.com'; START=BASE+'/eidl/'
rp=urllib.robotparser.RobotFileParser(BASE+'/robots.txt'); rp.read()
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.meta=[]; s.links=[]; s.a=[]; s.img=[]; s.h=[]; s.title=''; s.lang=None; s.ld=[]; s._t=None; s._buf=[]; s.text=[]; s._skip=0; s.scripts=[]; s.css=[]
    def handle_starttag(s,t,a):
        a=dict(a)
        if t=='html': s.lang=a.get('lang')
        if t=='meta': s.meta.append(a)
        if t=='link': s.links.append(a)
        if t=='a' and a.get('href'): s.a.append(a)
        if t=='img': s.img.append(a)
        if t=='script':
            s._skip+=1
            if a.get('type')=='application/ld+json': s._t='ld'; s._buf=[]
            if a.get('src'): s.scripts.append(a['src'])
        if t=='style': s._skip+=1
        if t in('h1','h2','h3','h4'): s._t=t; s._buf=[]
        if t=='title': s._t='title'; s._buf=[]
    def handle_endtag(s,t):
        if t in('script','style'):
            s._skip=max(0,s._skip-1)
        if t==s._t or (t=='script' and s._t=='ld'):
            x=''.join(s._buf).strip()
            if s._t=='title': s.title=x
            elif s._t=='ld': s.ld.append(x)
            else: s.h.append((s._t,re.sub(r'\s+',' ',x)))
            s._t=None
    def handle_data(s,d):
        if s._t: s._buf.append(d)
        if not s._skip: s.text.append(d)
def get(u):
    r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 seo-audit','Accept-Encoding':'gzip'})
    with urllib.request.urlopen(r,timeout=30) as f:
        b=f.read()
        if f.headers.get('Content-Encoding')=='gzip': b=gzip.decompress(b)
        return f.status,f.geturl(),dict(f.headers),b
seen={}; q=[START]; ext=set(); broken=[]; assets=set()
RAW=sys.argv[2] if len(sys.argv)>2 else None
def save(u,b):
    if not RAW: return
    name=urllib.parse.urlsplit(u); f=(name.path.strip('/') or 'index').replace('/','__')+('__'+re.sub(r'\W+','_',name.query) if name.query else '')+'.html'
    os.makedirs(RAW,exist_ok=True); open(os.path.join(RAW,f),'wb').write(b)
while q:
    u=q.pop(0)
    if u in seen: continue
    if not rp.can_fetch('*',u): seen[u]={'blocked':True}; continue
    try: st,fu,h,b=get(u)
    except Exception as e: seen[u]={'error':str(e)}; broken.append(u); continue
    if 'html' not in h.get('Content-Type',''): seen[u]={'status':st,'type':h.get('Content-Type'),'size':len(b)}; continue
    save(u,b); p=P(); p.feed(b.decode('utf8'))
    m=lambda k,v: next((x.get('content') for x in p.meta if x.get(k)==v),None)
    text=re.sub(r'\s+',' ',' '.join(p.text)).strip()
    inter=[]
    for a in p.a:
        v=urllib.parse.urljoin(fu,a['href']).split('#')[0]
        if v.startswith(BASE): inter.append(v)
        elif v.startswith('http'): ext.add(v)
    for v in inter:
        if v not in seen and v not in q and v.startswith(BASE+'/eidl/'): q.append(v)
    seen[u]={'status':st,'title':p.title,'desc':m('name','description'),'robots':m('name','robots'),'canon':next((l.get('href') for l in p.links if l.get('rel')=='canonical'),None),
      'lang':p.lang,'h1':[x[1] for x in p.h if x[0]=='h1'],'h2':[x[1] for x in p.h if x[0]=='h2'],'words':len(text.split()),'bytes':len(b),'ld':p.ld,
      'og':{x['property']:x.get('content') for x in p.meta if x.get('property','').startswith('og:')},'tw':{x['name']:x.get('content') for x in p.meta if x.get('name','').startswith('twitter:')},
      'img':[(i.get('src'),i.get('alt'),i.get('width'),i.get('height'),i.get('loading')) for i in p.img],'inlinks':sorted(set(inter)),'icons':[l for l in p.links if 'icon' in (l.get('rel') or '')],'manifest':[l.get('href') for l in p.links if l.get('rel')=='manifest'],'pre':[(l.get('rel'),l.get('href')) for l in p.links if l.get('rel') in('preload','modulepreload','stylesheet')],'scripts':p.scripts,'headers':{k.lower():v for k,v in h.items() if k.lower() in('cache-control','content-security-policy','x-robots-tag','referrer-policy','x-content-type-options','x-frame-options','strict-transport-security','content-type','etag','last-modified')}}
    for ref in p.scripts+[l.get('href') for l in p.links if l.get('rel') in('stylesheet','preload','icon','apple-touch-icon') and l.get('href')]+[i.get('src') for i in p.img if i.get('src')]: assets.add(urllib.parse.urljoin(fu,ref))
    time.sleep(.15)
kopf={}
for a in sorted(x for x in assets if x.startswith(BASE)):
    try:
        with urllib.request.urlopen(urllib.request.Request(a,method='HEAD',headers={'User-Agent':'Mozilla/5.0 seo-audit','Accept-Encoding':'br'}),timeout=30) as f: kopf[a]={'status':f.status,**{k.lower():v for k,v in f.headers.items() if k.lower() in('cache-control','content-encoding','content-length','content-type','etag')}}
    except Exception as e: kopf[a]={'error':str(e)}
    time.sleep(.1)
json.dump({'pages':seen,'ext':sorted(ext),'broken':broken,'assets':kopf},open(sys.argv[1],'w'),ensure_ascii=False,indent=1)
