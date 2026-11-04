"""Anfrage im Browser gegen gespeicherte Vektoren: python mixed.py <set.json> <node.json> <browser.json>"""
import json,sys,numpy as np
d=json.load(open(sys.argv[1]));N=json.load(open(sys.argv[2]));R=json.load(open(sys.argv[3]));files=[c['file'] for c in d['chunks']]
nq={k:np.array(v) for k,v in N['q'].items()};rq={k:np.array(v) for k,v in R['q'].items()};nc=np.array(N['c']);rc=np.array(R['c'])
print('cos Node/Browser Fragen: median %.4f min %.4f; Passagen: median %.4f min %.4f'%(np.median([nq[k]@rq[k] for k in nq]),min(nq[k]@rq[k] for k in nq),np.median(np.sum(nc*rc,1)),np.min(np.sum(nc*rc,1))))
bank=list(dict.fromkeys([q[1] for q in d['pos']]+[t for m in d['neg'] for t in m]))
def run(name,Qq,Qb,C):
    B=np.array([Qb[t] for t in bank]);Cc=C-C.mean(0)
    def prof(v,k=20):
        s=Cc@v;s=s-s.mean();t=np.zeros_like(s);i=np.argsort(-s)[:k];t[i]=s[i];return t/np.linalg.norm(t)
    P=np.array([prof(Qb[t]) for t in bank]);z=lambda s:(s-s.mean())/s.std()
    k={3:0,5:0};n=0;r=[];r0=[]
    for a,b,g in d['pos']:
        for q in (a,b):
            top=[files[i] for i in np.argsort(-(C@Qq[q]))[:5]];n+=1
            rk=next((i+1 for i,f in enumerate(top) if any(f.startswith(s) for s in g)),None)
            for j in k:k[j]+=rk is not None and rk<=j
        for out,sc in ((r0,B@Qq[a]),(r,z(B@Qq[a])+2*z(P@prof(Qq[a])))):
            sc=sc.copy()
            for i,t in enumerate(bank):
                if t==a: sc[i]=-9
            out.append(int((sc>sc[bank.index(b)]).sum())+1)
    r,r0=np.array(r),np.array(r0)
    print(f'{name:34} Kapitel Top3 {k[3]/n:.0%} Top5 {k[5]/n:.0%} | Duplikat Kosinus Top5 {np.mean(r0<=5):.0%} | mit Profil Top5 {np.mean(r<=5):.0%} Top10 {np.mean(r<=10):.0%} Top20 {np.mean(r<=20):.0%}')
run('alles Node',nq,nq,nc)
run('Anfrage Browser, Bestand Node',rq,nq,nc)
run('alles Browser',rq,rq,rc)
