import test from 'node:test';
import assert from 'node:assert/strict';
import { createLimiter, createSessions, hashPassphrase, verifyPassphrase } from '../lib/auth.js';
import { hardHits } from '../lib/checker.js';
import { clientOf, networkOf } from '../lib/http.js';

test('die Passphrase steht nicht im Hash, und nur die richtige passt', async () => {
  const stored = await hashPassphrase('eine lange Passphrase');
  assert.ok(!stored.includes('Passphrase'));
  assert.notEqual(stored, await hashPassphrase('eine lange Passphrase'), 'jedes Mal ein neues Salz');
  assert.equal(await verifyPassphrase('eine lange Passphrase', stored), true);
  assert.equal(await verifyPassphrase('eine lange Passphrasf', stored), false);
});

test('Sitzungen laufen ab und überleben das Abmelden nicht', () => {
  let time = 0;
  const sessions = createSessions({ ttl: 100, now: () => time });
  const token = sessions.create({ name: 'a', rolle: 'admin' });
  assert.equal(sessions.get(token).name, 'a');
  assert.equal(sessions.get('geraten'), null);
  assert.equal(sessions.get(undefined), null);
  time = 101;
  assert.equal(sessions.get(token), null);
  const next = sessions.create({ name: 'a', rolle: 'admin' });
  sessions.drop(next);
  assert.equal(sessions.get(next), null);
});

test('Fehlversuche zählen je Schlüssel und verfallen', () => {
  let time = 0;
  const limiter = createLimiter({ max: 2, window: 100, now: () => time });
  limiter.fail('a');
  limiter.fail('a');
  assert.equal(limiter.allowed('a'), false);
  assert.equal(limiter.allowed('b'), true);
  time = 101;
  assert.equal(limiter.allowed('a'), true);
});

test('ein gezählter Versuch lässt sich wieder streichen, aber nur einmal und nur dieser', () => {
  const limiter = createLimiter({ max: 2, window: 100, now: () => 0 });
  const forget = limiter.fail('a');
  limiter.fail('a');
  assert.equal(limiter.allowed('a'), false);
  forget();
  forget();
  assert.equal(limiter.allowed('a'), true);
  limiter.fail('a');
  assert.equal(limiter.allowed('a'), false, 'der zweite Aufruf hat den anderen Eintrag nicht mitgenommen');
});

test('IPv6 zählt je /64, IPv4 je Adresse', () => {
  assert.equal(networkOf('2001:db8:1:2::a'), '2001:db8:1:2::/64');
  assert.equal(networkOf('2001:0db8:0001:0002:dead:beef:0:1'), '2001:db8:1:2::/64');
  assert.notEqual(networkOf('2001:db8:1:3::a'), networkOf('2001:db8:1:2::a'));
  assert.equal(networkOf('::1'), '0:0:0:0::/64');
  assert.equal(networkOf('fe80::1%eth0'), 'fe80:0:0:0::/64');
  assert.equal(networkOf('::ffff:203.0.113.7'), '203.0.113.7');
  assert.equal(networkOf('203.0.113.7'), '203.0.113.7');
  assert.equal(clientOf({ headers: { 'x-forwarded-for': '2001:db8:9:9::9, 2001:db8:1:2::a' }, socket: {} }), '2001:db8:1:2::/64', 'nur der letzte Eintrag stammt von Caddy');
  assert.equal(clientOf({ headers: {}, socket: { remoteAddress: '127.0.0.1' } }), '127.0.0.1');
});

test('der Checker sperrt die harten Fälle aus Plan §8', () => {
  for (const [text, name] of [
    ['Schreiben Sie an max@example.org', 'E-Mail-Adresse'],
    ['DE89 3704 0044 0532 0130 00', 'IBAN'],
    ['Erreichbar unter +49 211 1234567', 'Telefonnummer'],
    ['Tel. 0211 81-12345', 'Telefonnummer'],
    ['Meine Matrikelnummer ist 12', 'Matrikelnummer'],
    ['Das sind 1000000 Parameter', 'Zahl mit 6 bis 12 Ziffern'],
  ]) assert.ok(hardHits(text).includes(name), text);
});

test('der Checker lässt Fachtext durch', () => {
  for (const text of ['Die Lernrate ist $0.001$.', 'Der Wert 3.141592 ist $\\pi$.', 'Ein Bild hat 784 Pixel und 60000 Beispiele.', 'Klasse 12345', 'x[1] und $W_3^T$']) {
    assert.deepEqual(hardHits(text), [], text);
  }
});
