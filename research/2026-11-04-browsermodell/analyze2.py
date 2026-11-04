"""python analyze2.py <set.json> name=file.json ..."""
import json,sys,numpy as np
d=json.load(open(sys.argv[1]));files=[c['file'] for c in d['chunks']]
def wil(k,n):
    p=k/n;z=1.96;c=(p+z*z/2/n)/(1+z*z/n);h=z*((p*(1-p)/n+z*z/4/n/n)**.5)/(1+z*z/n);return f'{p:4.0%} [{c-h:.0%}-{c+h:.0%}]'
print(f"{'Modell':16} {'Dupl.':>5} {'Neg.':>5} {'AUC':>5}  {'Dup Top1':>8} {'Dup Top5 (95%)':>18}  {'Kap Top1':>8} {'Kap Top3 (95%)':>18} {'Kap Top5':>8}  {'DE/EN cos':>9} {'EN Top5':>7}")
res={}
for a in sys.argv[2:]:
    name,f=a.split('=');e=json.load(open(f));Q={k:np.array(v) for k,v in e['q'].items()};C=np.array(e['c'])
    cs=lambda x,y:float(Q[x]@Q[y])
    p=np.array([cs(x[0],x[1]) for x in d['pos']]);n=np.array([cs(*x) for x in d['neg']]);x=np.array([cs(*y) for y in d['cross']])
    auc=float(np.mean([(u>v)+.5*(u==v) for u in p for v in n]))
    bank=list(dict.fromkeys([q[1] for q in d['pos']]+[t for m in d['neg'] for t in m]));B=np.array([Q[t] for t in bank])
    def rank(q,target):
        s=B@Q[q]
        for i,t in enumerate(bank):
            if t==q: s[i]=-9
        return int((s>s[bank.index(target)]).sum())+1
    r=[rank(a_,b_) for a_,b_,_ in d['pos']]
    xr=[]
    for en,de in d['cross']:
        if de in bank: xr.append(rank(en,de))
    k={1:0,3:0,5:0};N=0;miss=[]
    for a_,b_,g in d['pos']:
        for q in (a_,b_):
            top=[files[i] for i in np.argsort(-(C@Q[q]))[:5]];N+=1
            rk=next((i+1 for i,f_ in enumerate(top) if any(f_.startswith(s) for s in g)),None)
            for j in k: k[j]+=rk is not None and rk<=j
            if rk is None: miss.append(q[:50])
    res[name]=dict(r=r,miss=miss,bank=len(bank))
    n5=sum(v<=5 for v in r)
    print(f"{name:16} {np.median(p):5.2f} {np.median(n):5.2f} {auc:5.2f}  {sum(v<=1 for v in r)/len(r):8.0%} {wil(n5,len(r)):>18}  {k[1]/N:8.0%} {wil(k[3],N):>18} {k[5]/N:8.0%}  {np.median(x):9.2f} {sum(v<=5 for v in xr):>3}/{len(xr)}")
print('bank size',list(res.values())[0]['bank'],'queries',N,'pairs',len(d['pos']),len(d['neg']),len(d['cross']))
for k_,v in res.items(): print(k_,'chapter misses',len(v['miss']),v['miss'][:5])
