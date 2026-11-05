import { test, expect } from '@playwright/test';

const FORUMS = ['/eidl/f/grundlagen/', '/eidl/f/lernen/', '/eidl/f/architekturen/', '/eidl/f/praxis/'];
const PAGES = ['/eidl/', ...FORUMS, '/eidl/f/s04/', '/eidl/f/s12/', '/eidl/f/s02/', '/eidl/ueber/', '/eidl/impressum/', '/eidl/datenschutz/'];
const WIDTHS = [320, 375, 414, 768, 1200];
const own = url => new URL(url).origin === new URL(process.env.SMOKE_URL ?? 'http://localhost:8772').origin;

/** sammelt alle Anfragen und jede Meldung, die nach Fehler aussieht */
function watch(page) {
  const seen = { requests: [], problems: [] };
  page.on('request', r => seen.requests.push(r.url()));
  page.on('console', m => { if (m.type() === 'error') seen.problems.push(m.text()); });
  page.on('pageerror', e => seen.problems.push(e.message));
  return seen;
}

test('vor dem ersten Klick lädt die Startseite weder Modell noch Daten', async ({ page }) => {
  const seen = watch(page);
  await page.goto('/eidl/');
  await page.waitForLoadState('networkidle');
  expect(seen.requests.filter(u => /models|wasm|daten|such-worker|transformers/.test(u))).toEqual([]);
  expect(seen.problems).toEqual([]);
  await expect(page.locator('#suche')).toBeVisible();
});

test('jede Seite bleibt ohne fremde Anfrage und ohne CSP-Verstoß', async ({ page }) => {
  const seen = watch(page);
  for (const url of PAGES) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  }
  expect(seen.requests.filter(u => !own(u))).toEqual([]);
  expect(seen.problems).toEqual([]);
});

test('Suche findet die Frage und das Kapitel, ohne etwas zu senden', async ({ page }) => {
  const seen = watch(page);
  await page.goto('/eidl/');
  await page.locator('#suchfeld').focus();
  await expect(page.locator('#suchstatus')).toContainText('Suche bereit', { timeout: 120_000 });
  const requestsBefore = seen.requests.length;
  await page.locator('#suchfeld').fill('Sind neuronale Netze immer MLPs?');
  await expect(page.locator('#treffer-fragen li').first()).toBeVisible();
  await expect(page.locator('#treffer-fragen')).toContainText('MLP');
  await expect(page.locator('#treffer-fragen li')).toHaveCount(5);
  await expect(page.locator('#treffer-skript li')).toHaveCount(3);
  expect(seen.requests.slice(requestsBefore)).toEqual([]);
  expect(seen.requests.filter(u => !own(u))).toEqual([]);
  expect(seen.problems).toEqual([]);
});

test('Englisch findet die deutsche Frage', async ({ page }) => {
  await page.goto('/eidl/');
  await page.locator('#suchfeld').focus();
  await expect(page.locator('#suchstatus')).toContainText('Suche bereit', { timeout: 120_000 });
  await page.locator('#suchfeld').fill('Is every neural network an MLP?');
  await expect(page.locator('#treffer-fragen')).toContainText('MLP');
});

test('ohne WASM bleibt die Stichwortsuche', async ({ page }) => {
  await page.route('**/wasm/**', r => r.abort());
  await page.goto('/eidl/');
  await page.locator('#suchfeld').focus();
  await expect(page.locator('#suchstatus')).toContainText('Stichwortsuche funktioniert weiter', { timeout: 60_000 });
  await page.locator('#suchfeld').fill('Perzeptron');
  await expect(page.locator('#treffer-skript li').first()).toBeVisible();
});

test('Frageseite: Bot erkennbar, Zitat wörtlich mit Link, noindex', async ({ page }) => {
  await page.goto('/eidl/f/s04/');
  await expect(page.locator('.bot')).toHaveText('Bot');
  await expect(page.locator('.antwort .badge')).toHaveText(/^(un)?geprüft$/);
  await expect(page.locator('.hinweis')).toContainText('Prüfen Sie das Zitat');
  await expect(page.locator('.zitate figure').first().locator('blockquote')).not.toBeEmpty();
  await expect(page.locator('.zitate figcaption a').first()).toHaveAttribute('href', /^https:\/\/eidl-skript/);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
  await page.locator('.marke-zitat').first().click();
  await expect(page).toHaveURL(/#z1$/);
});

test('ohne JavaScript bleibt alles lesbar, das tote Suchfeld fehlt', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/eidl/');
  await expect(page.locator('.foren tbody tr')).toHaveCount(4);
  let threads = 0;
  for (const forum of FORUMS) {
    await page.goto(forum);
    threads += await page.locator('.themen tbody tr').count();
  }
  expect(threads).toBe(process.env.SMOKE_URL ? await page.request.get('/eidl/daten/fragen.json').then(r => r.json()).then(f => f.length) : 30);
  await expect(page.locator('#suche')).toBeHidden();
  await page.goto('/eidl/f/s04/');
  await expect(page.locator('.katex').first()).toBeVisible();
  await context.close();
});

test('die Breitenmessung schlägt an, wenn etwas übersteht', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/eidl/');
  const over = await page.evaluate(() => {
    const box = document.createElement('div');
    box.style.width = '2000px';
    box.style.height = '1px';
    document.body.append(box);
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(over).toBeGreaterThan(0);
});

for (const width of WIDTHS) {
  test(`kein seitliches Scrollen bei ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const wide = [];
    const urls = [...new Set([...PAGES, ...(await page.request.get('/eidl/daten/fragen.json').then(r => r.json())).map(f => `/eidl/f/${f.id}/`)])];
    for (const url of urls) {
      await page.goto(url);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 0) wide.push(`${url} +${over}`);
    }
    expect(wide).toEqual([]);
  });
}

test('die Seite „Über hAInrich2“ ist von überall unten erreichbar', async ({ page }) => {
  await page.goto('/eidl/f/s01/');
  await page.click('.fuss a:has-text("Über hAInrich2")');
  await expect(page).toHaveURL(/\/eidl\/ueber\/$/);
  await expect(page.locator('h1')).toHaveText('Über hAInrich2');
  await expect(page.locator('.dokument h2')).toHaveCount(5);
  await expect(page.locator('.dokument a[href*="heicad.hhu.de"]')).toHaveText('hAInrich');
});
