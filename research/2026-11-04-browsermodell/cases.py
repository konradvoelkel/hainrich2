"""Baut die Fälle für den Richter: python cases.py <set.json> <vektoren.json> <out.json>"""
import json,sys,numpy as np
d=json.load(open(sys.argv[1]));e=json.load(open(sys.argv[2]));Q={k:np.array(v) for k,v in e['q'].items()};C=np.array(e['c'])
bank=list(dict.fromkeys([q[1] for q in d['pos']]+[t for m in d['neg'] for t in m]));B=np.array([Q[t] for t in bank]);Cc=C-C.mean(0)
def prof(v,k=20):
    s=Cc@v;s=s-s.mean();t=np.zeros_like(s);i=np.argsort(-s)[:k];t[i]=s[i];return t/np.linalg.norm(t)
P=np.array([prof(Q[t]) for t in bank]);z=lambda s:(s-s.mean())/s.std()
def top(q,n=20):
    s=z(B@Q[q])+2*z(P@prof(Q[q]))
    for i,t in enumerate(bank):
        if t==q: s[i]=-9
    return [bank[i] for i in np.argsort(-s)[:n]]
pos=[{'q':a,'dup':b,'cands':top(a)} for a,b,_ in d['pos']]
neg=[{'q':a,'partner':b,'cands':top(a)} for a,b in d['neg']]
json.dump({'pairs':{'pos':[p[:2] for p in d['pos']],'neg':d['neg'],'cross':d['cross']},'pos':pos,'neg':neg},open(sys.argv[3],'w'),ensure_ascii=False)
print('dup in top20',sum(c['dup'] in c['cands'] for c in pos),'/',len(pos))
