"""Parität Basis gegen Schnitt: python -I parity.py <set.json> <basis-ordner> <schnitt-ordner> <basis.json> <schnitt.json>"""
import json,sys,numpy as np
from tokenizers import Tokenizer
s,b,c,fb,fc=sys.argv[1:6]
d=json.load(open(s));A=Tokenizer.from_file(b+'/tokenizer.json');C=Tokenizer.from_file(c+'/tokenizer.json')
vb,vc=json.load(open(fb)),json.load(open(fc))
q=list(vb['q']);same=[A.encode('query: '+t).tokens==C.encode('query: '+t).tokens for t in q]
unk=sum('<unk>' in C.encode(t).tokens for t in q)
cs=np.array([float(np.dot(vb['q'][t],vc['q'][t])) for t in q])
p=[A.encode('passage: '+k['text']).tokens==C.encode('passage: '+k['text']).tokens for k in d['chunks']]
cp=np.array([float(np.dot(x,y)) for x,y in zip(vb['c'],vc['c'])])
print(f'Fragen gleich tokenisiert {np.mean(same):.1%}, <unk> in {unk}, cos Basis/Schnitt min {cs.min():.4f} median {np.median(cs):.4f}')
print(f'Passagen gleich tokenisiert {np.mean(p):.1%}, cos min {cp.min():.4f} median {np.median(cp):.4f}')
w=[(float(np.dot(vb['q'][t],vc['q'][t])),t[:60],C.encode(t).tokens[:12]) for t in q if A.encode(t).tokens!=C.encode(t).tokens]
for x in sorted(w,key=lambda r:r[0])[:5]: print(' ',round(x[0],3),x[1],x[2])
