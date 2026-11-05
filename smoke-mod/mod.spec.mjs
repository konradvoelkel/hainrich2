import { test, expect } from '@playwright/test';
import { KURSCODE, PASSPHRASE } from './konstanten.mjs';

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
  await expect(page.locator('.antwort div.text .katex')).toBeVisible();
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
  await expect(page.locator('.foren tbody tr')).toHaveCount(4);
  const threads = await page.locator('.foren tbody td:nth-child(2)').allTextContents();
  expect(threads.reduce((sum, n) => sum + +n, 0)).toBe(3);
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

test('Cursortasten und Knopf blättern, im Textfeld bleibt die Taste beim Feld', async ({ page }) => {
  const problems = watch(page);
  await signIn(page);
  await page.goto('/eidl/mod/f/s01/');
  await page.click('a[rel="next"]');
  await expect(page).toHaveURL(/\/f\/s02\/$/);
  await expect(page.locator('.blaettern .meta')).toHaveText('2 von 4');
  /** die URL steht vor dem Skript: unter Last ging die Taste sonst ins Leere */
  await page.waitForLoadState();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/f\/s03\/$/);
  await page.waitForLoadState();
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/\/f\/s02\/$/);
  await page.waitForLoadState();
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Control+ArrowRight');
  await expect(page).toHaveURL(/\/f\/s02\/$/);
  await page.focus('#antwort');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/f\/s02\/$/);
  await page.focus('#frage');
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/\/f\/s02\/$/);
  await page.goto('/eidl/mod/f/s04/');
  await expect(page.locator('a[rel="next"]')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/f\/s04\/$/);
  expect(problems).toEqual([]);
});

test('ungespeicherte Änderungen gehen nicht still verloren, Speichern fragt nicht nach', async ({ page }) => {
  await signIn(page);
  await page.goto('/eidl/mod/f/s01/');
  const dialogs = [];
  page.on('dialog', dialog => {
    dialogs.push(dialog.type());
    dialog.dismiss();
  });
  await page.locator('#antwort').pressSequentially(' ergänzt');
  await page.locator('h1').click();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => dialogs).toEqual(['beforeunload']);
  await expect(page).toHaveURL(/\/f\/s01\/$/);
  await expect(page.locator('#antwort')).toHaveValue(/ergänzt/);
  await page.click('button[value="speichern"]');
  await expect(page.locator('.gemeldet')).toContainText('Gespeichert');
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/f\/s02\/$/);
  expect(dialogs).toEqual(['beforeunload']);
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

/** alles, was nur im Browser sichtbar wird: CSP, localStorage, die Karte mit Formel, und dass Lesende nichts davon sehen */
async function enterCode(page) {
  await page.goto('/eidl/f/neu/');
  await expect(page.locator('#fragetext')).toBeHidden();
  await page.fill('#kurscode', KURSCODE);
  await page.click('#code button.haupt');
  await expect(page.locator('#fragetext')).toBeVisible();
  await expect(page.locator('#kurscode')).toBeHidden();
}

test('Mit Einwilligung kommt der Entwurf sofort und nur für die fragende Person, die Moderation gibt ihn frei', async ({ page, browser }) => {
  const problems = watch(page);
  await page.goto('/eidl/f/neu/');
  await page.fill('#kurscode', 'ein-falscher-code');
  await page.click('#code button.haupt');
  await expect(page.locator('#code .fehler')).toContainText('stimmt nicht');
  await enterCode(page);
  await expect(page.locator('#einwilligung')).not.toBeChecked();
  await page.fill('#fragetext', 'Was bedeutet Broadcasting bei Tensoren genau?');
  await page.check('#zustimmung');
  await page.check('#einwilligung');
  await page.click('#frage button.haupt');
  await expect(page.locator('.meine-frage .antwort .badge')).toHaveText('Entwurf', { timeout: 15_000 });
  await expect(page.locator('.meine-frage .antwort .katex')).toBeVisible();
  await expect(page.locator('.meine-frage .hinweis')).toContainText('nur Sie sehen ihn');

  await page.reload();
  await expect(page.locator('.meine-frage .frage-text')).toHaveText('Was bedeutet Broadcasting bei Tensoren genau?');
  await expect(page.locator('.meine-frage .antwort .badge')).toHaveText('Entwurf');
  await expect(page.locator('#fragetext')).toBeVisible();

  /** ein anderer Browser: kein Geheimnis, keine Frage */
  const stranger = await (await browser.newContext()).newPage();
  await stranger.goto('/eidl/');
  await expect(stranger.locator('main')).not.toContainText('Broadcasting bei Tensoren genau');
  const list = await stranger.request.get('/eidl/daten/fragen.json');
  expect(await list.text()).not.toContain('Broadcasting bei Tensoren genau');

  const mod = await (await browser.newContext()).newPage();
  await signIn(mod);
  await mod.click('a:has-text("Broadcasting bei Tensoren")');
  await expect(mod.locator('h1')).toContainText('Neue Frage');
  await expect(mod.locator('#kapitel')).toHaveValue('Tensoren');
  await mod.click('button[value="pruefen"]');
  await expect(mod.locator('.gemeldet')).toContainText('Freigegeben');

  await page.reload();
  await page.click('.meine-frage a:has-text("Steht jetzt im Forum")');
  await expect(page.locator('h1')).toHaveText('Was bedeutet Broadcasting bei Tensoren genau?');
  await expect(page.locator('.antwort .badge')).toHaveText('geprüft');
  await expect(page.locator('.antwort .katex')).toBeVisible();
  expect(problems).toEqual([]);
});

test('Ohne Einwilligung wartet die Frage, und löschen lässt sie sich selbst', async ({ page }) => {
  const problems = watch(page);
  await enterCode(page);
  await page.fill('#fragetext', 'Eine Frage ohne Einwilligung zum Thema Tensoren?');
  await page.check('#zustimmung');
  await page.click('#frage button.haupt');
  await expect(page.locator('.meine-frage .meta')).toContainText('Wartet auf die Moderation');
  await page.waitForTimeout(1000);
  await expect(page.locator('.meine-frage .antwort')).toHaveCount(0);

  page.once('dialog', dialog => dialog.accept());
  await page.click('.meine-frage button:has-text("Frage löschen")');
  await expect(page.locator('#meine')).toBeHidden();
  expect(problems).toEqual([]);
});

test('Der Checker sperrt im Browser sichtbar', async ({ page }) => {
  const problems = watch(page);
  await enterCode(page);
  await page.fill('#fragetext', 'Meine Matrikelnummer ist 1234567, geht das?');
  await page.check('#zustimmung');
  await page.click('#frage button.haupt');
  await expect(page.locator('#frage .fehler')).toContainText('nicht gespeichert');
  await expect(page.locator('#meine')).toBeHidden();
  expect(problems).toEqual([]);
});

test('Auf der Fragen-Seite scrollt nichts seitlich', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await enterCode(page);
  await page.fill('#fragetext', 'Eine Frage für die Telefonbreite, zum Thema Tensoren?');
  await page.check('#zustimmung');
  await page.check('#einwilligung');
  await page.click('#frage button.haupt');
  await expect(page.locator('.meine-frage .antwort .badge')).toHaveText('Entwurf', { timeout: 15_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Abstimmen geht ohne Anmeldung, lässt sich ändern und übersteht das Neuladen', async ({ page }) => {
  const problems = watch(page);
  const posts = [];
  page.on('request', r => { if (r.method() === 'POST') posts.push(r.url()); });
  await page.goto('/eidl/f/s03/');
  const box = page.locator('.stimme');
  await expect(box.locator('.punkte')).toHaveText('0');
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(posts).toEqual([]);

  await box.locator('.hoch').click();
  await expect(box.locator('.punkte')).toHaveText('1');
  await expect(box.locator('.hoch')).toHaveAttribute('aria-pressed', 'true');
  await box.locator('.runter').click();
  await expect(box.locator('.punkte')).toHaveText('-1');
  await box.locator('.runter').click();
  await expect(box.locator('.punkte')).toHaveText('0');
  await box.locator('.hoch').click();
  await expect(box.locator('.punkte')).toHaveText('1');
  expect(posts.length).toBe(4);

  /** erst nach dem Bündeln steht die Zahl in der Seite */
  await expect.poll(async () => (await page.request.get('/eidl/f/s03/')).text()).toContain('<span class="punkte" title="Punkte">1</span>');
  await page.reload();
  await expect(box.locator('.punkte')).toHaveText('1');
  await expect(box.locator('.hoch')).toHaveAttribute('aria-pressed', 'true');
  expect((await page.context().cookies()).length).toBe(0);
  expect(problems).toEqual([]);
});

test('In der Liste abstimmen sortiert sie um, und ein zweiter Browser zählt extra', async ({ page, browser }) => {
  const problems = watch(page);
  const forum = '/eidl/f/grundlagen/';
  await page.goto(forum);
  const ids = await page.locator('.stimme').evaluateAll(boxes => boxes.map(b => b.dataset.id));
  expect(ids.length).toBeGreaterThan(1);
  /** s03 hat aus dem Test davor schon Stimmen, und die Liste kann dessen Zwischenstand noch zeigen */
  const last = ids.filter(id => id !== 's03').at(-1);
  const box = p => p.locator(`.stimme[data-id="${last}"]`);
  await box(page).locator('.hoch').click();
  await expect(box(page).locator('.punkte')).toHaveText('1');
  const other = await (await browser.newContext()).newPage();
  await other.goto(forum);
  await box(other).locator('.hoch').click();
  await expect(box(other).locator('.punkte')).toHaveText('2');

  await expect.poll(async () => {
    await page.goto(forum);
    return page.locator('.stimme').first().getAttribute('data-id');
  }, { timeout: 10_000 }).toBe(last);
  await expect(box(page).locator('.hoch')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(`.stimme[data-id="${ids[0]}"] .hoch`)).toHaveAttribute('aria-pressed', 'false');
  expect(problems).toEqual([]);
});

test('Ohne JavaScript steht die Summe da, Pfeile gibt es nicht', async ({ browser }) => {
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await page.goto('/eidl/f/s01/');
  await expect(page.locator('.punkte')).toBeVisible();
  await expect(page.locator('.pfeil').first()).toBeHidden();
});

for (const width of [320, 375]) {
  test(`mit Pfeilen kein seitliches Scrollen bei ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    for (const url of ['/eidl/f/s01/', '/eidl/f/grundlagen/', '/eidl/f/lernen/']) {
      await page.goto(url);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), url).toBe(true);
    }
  });
}

test('Findet Claude nichts, antwortet die Moderation selbst, und die Antwort erscheint nicht als Bot', async ({ page, browser }) => {
  const problems = watch(page);
  await enterCode(page);
  await page.fill('#fragetext', String.raw`Wäre das mit Keras nicht einfacher, etwa für $\sum_{i=1}^{n} \frac{x_i^2}{\sqrt{1+y_i^2}} + \lambda \lVert w \rVert_2^2 + \frac{1}{n}\sum_{j=1}^{m} z_j$?`);
  await page.check('#zustimmung');
  await page.check('#einwilligung');
  await page.click('#frage button.haupt');
  await expect(page.locator('.meine-frage .meta')).toContainText('nichts gefunden', { timeout: 15_000 });
  await expect(page.locator('.meine-frage .frage-text .katex')).toBeVisible();

  const mod = await (await browser.newContext()).newPage();
  await signIn(mod);
  await mod.click('a:has-text("mit Keras")');
  await mod.selectOption('#kapitel', 'Tensoren');
  await mod.fill('#antwort', 'Das ist Geschmackssache, *ich* nehme PyTorch.');
  await mod.click('button[value="freigeben"]');
  await expect(mod.locator('.gemeldet')).toContainText('Freigegeben');
  await expect(mod.locator('#antwort')).toHaveValue('Das ist Geschmackssache, *ich* nehme PyTorch.');

  await page.reload();
  await page.click('.meine-frage a:has-text("Steht jetzt im Forum")');
  await expect(page.locator('.antwort .autor strong')).toHaveText('Moderation');
  await expect(page.locator('.antwort .badge')).toHaveText('geprüft');
  await expect(page.locator('.antwort .text em')).toHaveText('ich');
  await expect(page.locator('.antwort')).not.toContainText('Sprachmodell');
  await expect(page.locator('.zitate')).toHaveCount(0);
  await expect(page.locator('h1 .katex-html')).toBeVisible();

  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Frageseite').toBe(true);
  await page.goto('/eidl/f/grundlagen/');
  await expect(page.locator('.liste a .katex')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Liste').toBe(true);
  await page.setViewportSize({ width: 1200, height: 800 });

  await page.goto('/eidl/');
  await page.locator('#suchfeld').focus();
  await expect(page.locator('#suchstatus')).toContainText('Suche bereit', { timeout: 120_000 });
  await page.locator('#suchfeld').fill('Keras');
  await expect(page.locator('#treffer-fragen .katex').first()).toBeVisible();
  expect(problems).toEqual([]);
});

test('Die Zahlen sind für Admins da, auch schmal, und ohne Fehler unter der CSP', async ({ page }) => {
  const problems = watch(page);
  await signIn(page);
  await page.click('a:has-text("Zahlen")');
  await expect(page.locator('h1')).toHaveText('Zahlen');
  await expect(page.locator('.zahlen').first()).toContainText('0,08 $');
  await expect(page.locator('.deckel progress').first()).toBeVisible();
  await expect(page.locator('main')).toContainText('Abgegebene Stimmen');
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(problems).toEqual([]);
});
