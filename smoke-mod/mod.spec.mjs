import { test, expect } from '@playwright/test';
import { PASSPHRASE } from './konstanten.mjs';

/** alles, was im echten Browser anders ist als in den Unit-Tests: Origin, Cookie, CSP */
const watch = page => {
  const problems = [];
  page.on('console', m => { if (m.type() === 'error' && !/status of 4\d\d/.test(m.text())) problems.push(m.text()); });
  page.on('pageerror', e => problems.push(e.message));
  return problems;
};

async function signIn(page) {
  await page.goto('/eidl/mod/');
  await page.fill('#name', 'test');
  await page.fill('#passphrase', PASSPHRASE);
  await page.click('button.haupt');
  await expect(page.locator('h1')).toHaveText('Fragen und Antworten');
}

test('Anmelden setzt das Cookie, Abmelden beendet die Sitzung', async ({ page, context }) => {
  const problems = watch(page);
  await page.goto('/eidl/mod/');
  await page.fill('#name', 'test');
  await page.fill('#passphrase', 'eine-falsche-passphrase');
  await page.click('button.haupt');
  await expect(page.locator('.fehler')).toContainText('stimmen nicht');
  await signIn(page);
  const cookie = (await context.cookies()).find(c => c.name === '__Secure-sitzung');
  expect([cookie.httpOnly, cookie.secure, cookie.sameSite, cookie.path]).toEqual([true, true, 'Strict', '/eidl/']);
  await page.click('form[action*="abmelden"] button');
  await expect(page.locator('#passphrase')).toBeVisible();
  await page.goto('/eidl/mod/f/s01/');
  await expect(page.locator('#passphrase')).toBeVisible();
  expect(problems).toEqual([]);
});

test('Bearbeiten und Prüfen erreichen die öffentliche Seite und die Suche', async ({ page }) => {
  const problems = watch(page);
  await signIn(page);
  await page.goto('/eidl/mod/f/s02/');
  await page.fill('#frage', 'Eine bearbeitete Frage zur Normalisierung?');
  await page.fill('#antwort', 'Neue Antwort mit $b^2$.[1]');
  await page.click('button[value="pruefen"]');
  await expect(page.locator('.gemeldet')).toContainText('geprüft');

  await page.goto('/eidl/f/s02/');
  await expect(page.locator('h1')).toHaveText('Eine bearbeitete Frage zur Normalisierung?');
  await expect(page.locator('.antwort .badge')).toHaveText('geprüft');
  await expect(page.locator('.antwort > div.text .katex')).toBeVisible();
  await expect(page.locator('.antwort .hinweis')).toContainText('die Moderation hat sie bearbeitet');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');

  await page.goto('/eidl/');
  await page.locator('#suchfeld').focus();
  await expect(page.locator('#suchstatus')).toContainText('Suche bereit', { timeout: 120_000 });
  await page.locator('#suchfeld').fill('bearbeitete Frage');
  await expect(page.locator('#treffer-fragen')).toContainText('Eine bearbeitete Frage');
  expect(problems).toEqual([]);
});

test('Zurückziehen nimmt die Seite weg, Wiederherstellen bringt sie zurück', async ({ page }) => {
  await signIn(page);
  await page.goto('/eidl/mod/f/s03/');
  await page.click('button[value="zurueckziehen"]');
  await expect(page.locator('.gemeldet')).toContainText('Zurückgezogen');
  expect((await page.request.get('/eidl/f/s03/')).status()).toBe(404);
  await page.goto('/eidl/');
  await expect(page.locator('.fragen li')).toHaveCount(3);
  await page.goto('/eidl/mod/f/s03/');
  await page.click('button[value="wiederherstellen"]');
  expect((await page.request.get('/eidl/f/s03/')).status()).toBe(200);
});

test('ein harter Treffer wird nicht gespeichert, das Getippte bleibt stehen', async ({ page }) => {
  await signIn(page);
  await page.goto('/eidl/mod/f/s04/');
  await page.fill('#antwort', 'Schreiben Sie an a@example.test [1]');
  await page.click('button[value="speichern"]');
  await expect(page.locator('.fehler').first()).toContainText('E-Mail-Adresse');
  await expect(page.locator('#antwort')).toHaveValue(/a@example\.test/);
});

for (const width of [320, 375, 768]) {
  test(`kein seitliches Scrollen bei ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await signIn(page);
    const wide = [];
    for (const url of ['/eidl/mod/', '/eidl/mod/f/s01/']) {
      await page.goto(url);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 0) wide.push(`${url} +${over}`);
    }
    expect(wide).toEqual([]);
  });
}
