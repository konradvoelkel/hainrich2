/**
 * Nimmt der Browser das Sitzungs-Cookie der Moderation auf `http://localhost` an? Erst den Verbund starten, dann messen:
 *
 *   node smoke-mod/start.mjs &
 *   node research/2026-11-17-webkit-cookie/probe.mjs
 *
 * Je Browser eine Zeile: Status und `Set-Cookie` der Anmeldung (ohne Wert), die Cookies, die der Browser danach hält, und die Überschrift.
 */
import { chromium, firefox, webkit } from '@playwright/test';
import { PASSPHRASE, PORT } from '../../smoke-mod/konstanten.mjs';

for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  const browser = await type.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  let antwort = null;
  page.on('response', async response => {
    if (response.request().method() === 'POST') antwort = { status: response.status(), cookie: (await response.allHeaders())['set-cookie']?.replace(/=[^;]+/, '=…') ?? null };
  });
  await page.goto(`http://localhost:${PORT}/eidl/mod/`);
  await page.fill('#name', 'test');
  await page.fill('#passphrase', PASSPHRASE);
  await page.click('button.haupt');
  await page.waitForLoadState('networkidle');
  console.log(JSON.stringify({ browser: name, antwort, imBrowser: (await context.cookies()).map(c => c.name), h1: await page.locator('h1').textContent() }));
  await browser.close();
}
