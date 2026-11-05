import { chromium, devices } from 'playwright';
const B='https://hai.konradvoelkel.com/eidl/', out=process.argv[2];
const browser=await chromium.launch();
const measure=async(path,net)=>{
  const ctx=await browser.newContext({...devices['Pixel 7']});
  const page=await ctx.newPage(); const c=await ctx.newCDPSession(page);
  await c.send('Network.enable'); await c.send('Emulation.setCPUThrottlingRate',{rate:4});
  if(net) await c.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6e6/8,uploadThroughput:750e3/8});
  let bytes=0,reqs=0; const types={}; const urls=[];
  c.on('Network.loadingFinished',e=>{bytes+=e.encodedDataLength;reqs++}); c.on('Network.responseReceived',e=>{types[e.type]=(types[e.type]||0)+1;urls.push(e.response.url)});
  await page.addInitScript(()=>{window.__m={cls:0,lcp:0,lcpEl:'',tbt:0,long:0};
    new PerformanceObserver(l=>{for(const e of l.getEntries()){if(!e.hadRecentInput)__m.cls+=e.value}}).observe({type:'layout-shift',buffered:true});
    new PerformanceObserver(l=>{for(const e of l.getEntries()){__m.lcp=e.startTime;__m.lcpEl=e.element?.tagName+'.'+(e.element?.className||'')}}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(l=>{for(const e of l.getEntries()){__m.long++;__m.tbt+=Math.max(0,e.duration-50)}}).observe({type:'longtask',buffered:true});});
  await page.goto(B+path,{waitUntil:'load'}); await page.waitForTimeout(2500);
  const r=await page.evaluate(()=>({...__m,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,ttfb:performance.getEntriesByType('navigation')[0].responseStart,scrollW:document.documentElement.scrollWidth,w:innerWidth}));
  await ctx.close();
  return {path,net:net?'4G langsam':'ungedrosselt',reqs,kb:Math.round(bytes/1024),modell:urls.some(u=>/models|wasm/.test(u)),types,...Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='number'?Math.round(v*1000)/1000:v]))};
};
for(const p of ['', 'f/s09/', 'ueber/', 'f/grundlagen/']) console.log(JSON.stringify(await measure(p,true)));
// erste Suche: was blockiert den Hauptfaden
{
  const ctx=await browser.newContext({...devices['Pixel 7']}); const page=await ctx.newPage(); const c=await ctx.newCDPSession(page);
  await c.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.addInitScript(()=>{window.__l=[];window.__e=[];new PerformanceObserver(l=>{for(const e of l.getEntries())__l.push(Math.round(e.duration))}).observe({type:'longtask',buffered:true});
    new PerformanceObserver(l=>{for(const e of l.getEntries())__e.push([e.name,Math.round(e.duration)])}).observe({type:'event',durationThreshold:16,buffered:true});});
  let model=0; page.on('response',async r=>{if(/models|wasm/.test(r.url()))model++});
  await page.goto(B,{waitUntil:'load'}); await page.waitForTimeout(1000);
  const box=page.locator('input[type=search],#suche input,input').first(); await box.tap(); const t=Date.now();
  await box.pressSequentially('Was ist der Unterschied zwischen Parameter und Hyperparameter',{delay:60});
  await page.waitForTimeout(25000);
  const r=await page.evaluate(()=>({long:__l,ev:__e.sort((a,b)=>b[1]-a[1]).slice(0,5)}));
  console.log('Suche',JSON.stringify({modellDateien:model,maxLong:Math.max(0,...r.long),anzLong:r.long.length,summeLong:r.long.reduce((a,b)=>a+b,0),ereignisse:r.ev}));
  await ctx.close();
}
for(const [n,d,p] of [['start-mobil',devices['Pixel 7'],''],['frage-mobil',devices['Pixel 7'],'f/s09/'],['ueber-mobil',devices['Pixel 7'],'ueber/']]){
  const ctx=await browser.newContext({...d}); const page=await ctx.newPage(); await page.goto(B+p,{waitUntil:'load'}); await page.waitForTimeout(800); await page.screenshot({path:`${out}/${n}.png`}); await ctx.close();
}
{const ctx=await browser.newContext({viewport:{width:1280,height:800}}); const page=await ctx.newPage(); await page.goto(B,{waitUntil:'load'}); await page.waitForTimeout(800); await page.screenshot({path:`${out}/start-desktop.png`}); await ctx.close();}
await browser.close();
