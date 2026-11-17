// Was kommt beim zweiten Aufruf einer Seite noch übers Netz? node wiederbesuch.mjs
// Seit dem 17.11. tragen Schrift, Logo und Icons einen Tag max-age, CSS, Skripte und Seiten weiter no-cache (Rückfrage mit ETag).
import { chromium, devices } from 'playwright';
const B='https://hai.konradvoelkel.com/eidl/';
const browser=await chromium.launch();
for(const path of ['', 'f/s09/']){
  const ctx=await browser.newContext({...devices['Pixel 7']}); const page=await ctx.newPage(); const c=await ctx.newCDPSession(page);
  await c.send('Network.enable');
  await page.goto(B+path,{waitUntil:'load'}); await page.waitForTimeout(800);
  await page.goto(B+'ueber/',{waitUntil:'load'}); await page.waitForTimeout(300);
  const name=new Map(), ausCache=new Set(), status=new Map(); let kb=0;
  c.on('Network.requestWillBeSent',e=>name.set(e.requestId,e.request.url.split('/eidl/')[1]||'(Seite)'));
  c.on('Network.requestServedFromCache',e=>ausCache.add(e.requestId));
  c.on('Network.responseReceived',e=>status.set(e.requestId,e.response.status));
  c.on('Network.loadingFinished',e=>{kb+=e.encodedDataLength});
  await page.goto(B+path,{waitUntil:'load'}); await page.waitForTimeout(800);
  const zeile=id=>name.get(id);
  console.log(JSON.stringify({seite:path||'(Start)',anfragen:name.size,ohneNetz:[...name.keys()].filter(id=>ausCache.has(id)).map(zeile),rueckfrage304:[...name.keys()].filter(id=>!ausCache.has(id)&&status.get(id)===304).map(zeile),neuGeladen:[...name.keys()].filter(id=>!ausCache.has(id)&&status.get(id)===200).map(zeile),kb:Math.round(kb/1024*10)/10}));
  await ctx.close();
}
await browser.close();
