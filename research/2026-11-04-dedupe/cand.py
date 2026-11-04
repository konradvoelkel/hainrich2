import json,numpy as np
d=json.load(open('set.json'))
for name in ['minilm','e5large']:
    e=json.load(open(name+'.json'));Q={k:np.array(v) for k,v in e['q'].items()}
    bank=list(dict.fromkeys([p[1] for p in d['pos']]+[t for n in d['neg'] for t in n]))
    B=np.array([Q[t] for t in bank]);h={1:0,3:0,5:0}
    for a,b,_ in d['pos']:
        s=B@Q[a]
        for i,t in enumerate(bank):
            if t==a: s[i]=-9
        r=int((s>s[bank.index(b)]).sum())+1
        for k in h: h[k]+=r<=k
    unrelated=[float(Q[d['pos'][i][0]]@Q[d['pos'][j][1]]) for i in range(24) for j in range(24) if i!=j]
    print(name,'bank',len(bank),'true duplicate in top1/3/5:',{k:f'{v/24:.0%}' for k,v in h.items()},'unrelated pairs median',round(float(np.median(unrelated)),2),'p95',round(float(np.percentile(unrelated,95)),2))
