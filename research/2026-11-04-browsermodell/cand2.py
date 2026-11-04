"""Duplikatsuche: Rangverteilung und Vergleich über Skriptstellen. python cand2.py <set.json> <vectors.json>"""
import json,sys,numpy as np
d=json.load(open(sys.argv[1]));e=json.load(open(sys.argv[2]));Q={k:np.array(v) for k,v in e['q'].items()};C=np.array(e['c'])
bank=list(dict.fromkeys([q[1] for q in d['pos']]+[t for m in d['neg'] for t in m]));B=np.array([Q[t] for t in bank])
Cc=C-C.mean(0)
def prof(v,k=None):
    s=Cc@v; s=s-s.mean()
    if k:
        t=np.zeros_like(s); i=np.argsort(-s)[:k]; t[i]=s[i]; s=t
    return s/np.linalg.norm(s)
def ev(score):
    r=[]
    for a,b,_ in d['pos']:
        s=score(a).copy()
        for i,t in enumerate(bank):
            if t==a: s[i]=-9
        r.append(int((s>s[bank.index(b)]).sum())+1)
    r=np.array(r);return ' '.join(f'Top{k}={np.mean(r<=k):.0%}' for k in (1,3,5,10,20))
print('nur Kosinus           ',ev(lambda a:B@Q[a]))
for k in (None,20):
    P=np.array([prof(Q[t],k) for t in bank])
    print(f'nur Passagenprofil k={k}',ev(lambda a:P@prof(Q[a],k)))
    for w in (.5,1,2):
        z=lambda s:(s-s.mean())/s.std()
        print(f'Kosinus+{w}*Profil k={k}',ev(lambda a:z(B@Q[a])+w*z(P@prof(Q[a],k))))
