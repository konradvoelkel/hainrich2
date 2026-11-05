import json, re, sys, time, urllib.request, urllib.parse, urllib.robotparser, gzip
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
seen={}; q=[START]; ext=set(); broken=[]
while q:
    u=q.pop(0)
    if u in seen: continue
    if not rp.can_fetch('*',u): seen[u]={'blocked':True}; continue
    try: st,fu,h,b=get(u)
    except Exception as e: seen[u]={'error':str(e)}; broken.append(u); continue
    if 'html' not in h.get('Content-Type',''): seen[u]={'status':st,'type':h.get('Content-Type'),'size':len(b)}; continue
    p=P(); p.feed(b.decode('utf8'))
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
      'img':[(i.get('src'),i.get('alt'),i.get('width'),i.get('height'),i.get('loading')) for i in p.img],'inlinks':sorted(set(inter)),'icons':[l for l in p.links if 'icon' in (l.get('rel') or '')],'manifest':[l.get('href') for l in p.links if l.get('rel')=='manifest'],'pre':[(l.get('rel'),l.get('href')) for l in p.links if l.get('rel') in('preload','modulepreload','stylesheet')],'scripts':p.scripts}
    time.sleep(.15)
json.dump({'pages':seen,'ext':sorted(ext),'broken':broken},open(sys.argv[1],'w'),ensure_ascii=False,indent=1)
