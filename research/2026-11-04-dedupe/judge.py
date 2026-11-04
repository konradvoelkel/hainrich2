import json,urllib.request,time,sys
d=json.load(open('set.json'))
M=sys.argv[1]
SYS=("Du sortierst Fragen in einem Forum zu einer Vorlesung über Deep Learning. Entscheide, ob zwei Fragen Duplikate sind: "
"Duplikat heißt, eine gute Antwort auf Frage A beantwortet auch Frage B vollständig, und umgekehrt. Andere Wörter, andere Sprache oder Umgangssprache ändern daran nichts. "
"Keine Duplikate sind Fragen zu verschiedenen Begriffen, in umgekehrter Richtung, oder wenn eine Frage nur ein Teil der anderen ist. "
'Antworte nur als JSON: {"duplikat": true} oder {"duplikat": false}.')
def ask(a,b):
    body={"model":M,"stream":False,"think":False,"format":"json","options":{"temperature":0,"num_ctx":2048,"num_predict":32},
    "messages":[{"role":"system","content":SYS},{"role":"user","content":f"Frage A: {a}\nFrage B: {b}"}]}
    r=urllib.request.urlopen(urllib.request.Request("http://localhost:11434/api/chat",json.dumps(body).encode(),{"Content-Type":"application/json"}),timeout=300)
    return json.loads(json.loads(r.read())["message"]["content"]).get("duplikat")
ask("a","b")
t=time.time()
P=[(a,b,ask(a,b)) for a,b,_ in d['pos']];N=[(a,b,ask(a,b)) for a,b in d['neg']];X=[(a,b,ask(a,b)) for a,b in d['cross']]
n=len(P)+len(N)+len(X);dt=(time.time()-t)/n
print(M,f'dupes accepted {sum(r[2] is True for r in P)}/24; wrong merges {sum(r[2] is True for r in N)}/24; EN-DE accepted {sum(r[2] is True for r in X)}/6; {dt:.2f}s per pair')
print(' missed dupes:',[r[0][:50] for r in P if r[2] is not True])
print(' wrong merges:',[(r[0][:40],r[1][:40]) for r in N if r[2] is True])
