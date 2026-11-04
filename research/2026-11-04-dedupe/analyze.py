import json,numpy as np
d=json.load(open('set.json'))
def auc(p,n):
    return np.mean([(a>b)+.5*(a==b) for a in p for b in n])
for name in ['minilm','e5large']:
    e=json.load(open(name+'.json'));Q={k:np.array(v) for k,v in e['q'].items()};C=np.array(e['c'])
    cs=lambda a,b:float(Q[a]@Q[b])
    p=np.array([cs(x[0],x[1]) for x in d['pos']]);n=np.array([cs(*x) for x in d['neg']]);x=np.array([cs(*y) for y in d['cross']])
    best=max(((2*((p>=t).sum())/((p>=t).sum()+(n>=t).sum()+len(p))),t) for t in np.unique(np.r_[p,n]))
    t=best[1];tp=(p>=t).sum();fp=(n>=t).sum()
    t0=n.max();r0=(p>t0).mean()
    print(f'\n== {name}')
    print(f'dupes   median {np.median(p):.2f} min {p.min():.2f} max {p.max():.2f}')
    print(f'hardneg median {np.median(n):.2f} min {n.min():.2f} max {n.max():.2f}')
    print(f'AUC {auc(p,n):.3f}; best-F1 thr {t:.2f}: {tp}/{len(p)} dupes caught, {fp}/{len(n)} wrong merges; zero-wrong-merge thr {t0:.2f}: recall {r0:.0%}')
    print(f'EN<->DE same question: median {np.median(x):.2f}, above best-F1 thr {(x>=t).sum()}/{len(x)}')
    print('worst dupes:',[(round(cs(a,b),2),a[:38]) for a,b,_ in sorted(d['pos'],key=lambda r:cs(r[0],r[1]))[:3]])
    print('worst negs:',[(round(cs(a,b),2),a[:38]) for a,b in sorted(d['neg'],key=lambda r:-cs(r[0],r[1]))[:3]])
    files=[c['file'] for c in d['chunks']]
    h={1:0,3:0,5:0};N=0;bad=[]
    for a,b,g in d['pos']:
        for qx in (a,b):
            o=np.argsort(-(C@Q[qx]));N+=1
            top=[files[i] for i in o[:5]]
            rank=next((i+1 for i,f in enumerate(top) if any(f.startswith(s) for s in g)),None)
            for k in h: h[k]+= rank is not None and rank<=k
            if rank is None: bad.append(qx[:44])
    print(f'Skript search, {N} DE questions, right chapter in top1/3/5: {h[1]/N:.0%} / {h[3]/N:.0%} / {h[5]/N:.0%}; misses: {len(bad)}')
    print('  e.g.',bad[:4])
