"""Vokabelschnitt: python -I trim.py <modellordner> <ausgabeordner> <N> <korpus.txt>...

Schneidet Tabelle und Tokenizer auf N Tokens. Die Gewichte bleiben unverändert: Texte, deren
Tokens erhalten sind, bekommen denselben Vektor. Reihenfolge: Spezialtokens, Einzelzeichen der
lateinischen, griechischen und mathematischen Schrift, alle Tokens der ersten Korpusdatei (das
Skript), dann Häufigkeit im übrigen Korpus, dann der Score des Modells für lateinische Tokens. Das
Testset gehört nicht ins Korpus.
"""
import json,os,re,shutil,sys,unicodedata
from collections import Counter
import numpy as np,onnx
from tokenizers import Tokenizer
src,out,N=sys.argv[1],sys.argv[2],int(sys.argv[3]);corpus=sys.argv[4:]
t=json.load(open(f'{src}/tokenizer.json'));vocab=t['model']['vocab']
tok=Tokenizer.from_file(f'{src}/tokenizer.json')
def latin(p):
    p=p.replace('▁','')
    return all(ord(c)<0x250 or 0x370<=ord(c)<0x400 or 0x2000<=ord(c)<0x2c00 for c in p)
def count(f):
    c=Counter()
    lines=[l for l in open(f,encoding='utf8',errors='ignore').read().split('\n') if l.strip()]
    for i in range(0,len(lines),4096):
        for e in tok.encode_batch(lines[i:i+4096],add_special_tokens=False): c.update(e.ids)
    return c
per_file=[count(f) for f in corpus]
counts=sum(per_file,Counter())
special={a['id'] for a in t['added_tokens']}
keep=set(special)|{i for i,(p,_) in enumerate(vocab) if len(p.replace('▁',''))<=1 and latin(p)}
keep|=set(per_file[0])   # die erste Datei ist das Skript: alle seine Tokens bleiben
print('tokens of first corpus file',len(per_file[0]))
base=len(keep)
for i,_ in counts.most_common():
    if len(keep)>=N: break
    keep.add(i)
used=len(keep)-base
for i in sorted(range(len(vocab)),key=lambda i:-vocab[i][1]):
    if len(keep)>=N: break
    if latin(vocab[i][0]): keep.add(i)
old=sorted(keep);new={o:n for n,o in enumerate(old)}
assert old[:4]==[0,1,2,3],old[:4]   # die Positions-IDs im Graph hängen an <pad>=1
print(f'corpus tokens seen {len(counts)}, base {base}, from corpus {used}, filled {len(keep)-base-used}, total {len(old)}')
t['model']['vocab']=[vocab[i] for i in old]
for a in t['added_tokens']: a['id']=new[a['id']]
os.makedirs(f'{out}/onnx',exist_ok=True)
json.dump(t,open(f'{out}/tokenizer.json','w'),ensure_ascii=False,separators=(',',':'))
c=json.load(open(f'{src}/tokenizer_config.json'))
if 'added_tokens_decoder' in c: c['added_tokens_decoder']={str(new[int(k)]):v for k,v in c['added_tokens_decoder'].items()}
json.dump(c,open(f'{out}/tokenizer_config.json','w'),ensure_ascii=False,indent=1)
g=json.load(open(f'{src}/config.json'));g['vocab_size']=len(old);json.dump(g,open(f'{out}/config.json','w'),indent=1)
shutil.copy(f'{src}/special_tokens_map.json',out)
m=onnx.load(f'{src}/onnx/model_quantized.onnx')
w=next(i for i in m.graph.initializer if i.name=='embeddings.word_embeddings.weight_quantized')
a=np.frombuffer(w.raw_data,dtype=np.uint8).reshape(w.dims)
w.raw_data=np.ascontiguousarray(a[old]).tobytes();w.dims[0]=len(old)
onnx.save(m,f'{out}/onnx/model_quantized.onnx')
print('onnx MB',os.path.getsize(f'{out}/onnx/model_quantized.onnx')/1e6,'tokenizer MB',os.path.getsize(f'{out}/tokenizer.json')/1e6)
