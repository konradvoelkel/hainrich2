import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { KAPITEL, KAPITEL_SLUG, kapitelBySlug, UNTERFOREN } from '../lib/forum.js';
import { biasKeywords, KAPITEL_BONUS, KAPITEL_FAKTOR, centerPassages, profile, rankQuestions } from '../lib/rank.js';
import { fuse } from '../lib/search.js';
import { askPage, forumPage, indexPage, kapitelPage, publicQuestion, sitemap } from '../lib/site.js';
import { openPending } from '../lib/pending.js';

const site = { origin: 'https://example.test', base: '/eidl/', skript: 'https://skript.test/', vorschau: false, ladegroesse: 'rund 25 MB', fragen: true };
const passage = { id: 'p1', page: 'backpropagation', title: 'Backpropagation', path: ['Das Muster'], text: 'Ein Gradient wird rückwärts durch den Graphen gereicht und wiederverwendet.', hash: 'h1', link: 'https://skript.test/backpropagation/#das-muster' };
const seed = { id: 's01', frage: 'Warum ist Backpropagation effizient?', kapitel: 'backpropagation' };
const row = { seed: 's01', model: 'm', status: 'ok', text: 'Weil die Ableitungen wiederverwendet werden.[1]', cited: [{ id: 'p1', hash: 'h1' }], check: { hinweise: [] }, input: 1 };
const question = (overrides = {}) => publicQuestion(seed, { ...row, ...overrides }, [passage], '2026-11-12');
const reviewed = q => ({ ...q, antworten: q.antworten.map(a => ({ ...a, status: 'geprüft' })) });
const backprop = KAPITEL.find(k => k.slug === 'backpropagation');

test('jedes Kapitel hat eine eindeutige Kennung, und die Liste deckt sich mit den Unterforen', () => {
  const titles = UNTERFOREN.flatMap(u => u.kapitel);
  assert.equal(KAPITEL.length, titles.length);
  assert.deepEqual(Object.keys(KAPITEL_SLUG).sort(), [...titles].sort());
  const slugs = KAPITEL.map(k => k.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9-]+$/);
  assert.equal(kapitelBySlug('backpropagation').titel, 'Backpropagation');
  assert.equal(kapitelBySlug('backpropagation').unterforum.slug, 'lernen');
  assert.equal(kapitelBySlug('gibt-es-nicht'), null);
  assert.equal(kapitelBySlug(undefined), null);
});

test('die Kapitelseite trägt Adresse, Titel, Brotkrumen und einen Link ins Formular für dieses Kapitel', () => {
  const html = kapitelPage(backprop, [], site);
  assert.match(html, /<link rel="canonical" href="https:\/\/example\.test\/eidl\/f\/kapitel\/backpropagation\/">/);
  assert.match(html, /<h1>Fragen zu „Backpropagation“<\/h1>/);
  assert.match(html, /<a class="knopf fragen" href="\.\.\/\.\.\/neu\/\?kapitel=backpropagation" rel="nofollow">Frage stellen<\/a>/);
  assert.match(html, /<nav class="pfad" aria-label="Pfad"><ol role="list"><li><a href="\.\.\/\.\.\/\.\.\/">Forum<\/a><\/li><li><a href="\.\.\/\.\.\/lernen\/">Lernen und Training<\/a><\/li><li aria-current="page">/, 'der Pfad ist eine Liste, die Kapitelseite ist die aktuelle Seite');
  assert.match(html, /href="https:\/\/skript\.test\/backpropagation\/">Kapitel im Skript/);
  assert.match(html, /"name":"Backpropagation"/);
  assert.match(html, /src="\.\.\/\.\.\/\.\.\/logo\.svg"/);
  assert.match(html, /<script type="module" src="\.\.\/\.\.\/\.\.\/app\.js">/);
  assert.match(html, /Zu diesem Kapitel gibt es noch keine Frage\. Stellen Sie die erste\./);
});

test('die Kapitelseite sagt, was das Forum ist: Sie ist das Ziel der Links aus dem Skript', () => {
  const html = kapitelPage(backprop, [], site);
  const einleitung = html.match(/<p class="einleitung">([^\n]*)<\/p>/)[1];
  assert.match(einleitung, /^Die meisten Antworten schreibt ein Sprachmodell, belegt mit wörtlichen Zitaten aus dem Skript, und die Moderation prüft sie\./, 'derselbe Satz wie auf der Startseite; zu welchem Skript, sagt schon der Seitenkopf');
  assert.match(einleitung, /Fragen stellen kann nur, wer den Kurscode hat, und den gibt es im Kurs in ILIAS\. Lesen können alle\. <a href="\.\.\/\.\.\/\.\.\/ueber\/">Mehr über die Idee<\/a>$/);
  assert.ok(html.indexOf('class="einleitung"') < html.indexOf('id="suche"'), 'vor der Suche');
  const ohne = kapitelPage(backprop, [], { ...site, fragen: false });
  assert.match(ohne, /<p class="einleitung">[^\n]*prüft sie\. <a href/, 'ohne Fragepfad kein Satz zum Kurscode');
  assert.doesNotMatch(ohne, /Kurscode/);
});

test('die Suche auf der Kapitelseite kennt ihren Kapiteltitel und findet ihre Dateien unter der Wurzel', () => {
  const html = kapitelPage(backprop, [], site);
  assert.match(html, /<section class="suche" id="suche" role="search" aria-label="Suche im Forum" hidden data-root="\.\.\/\.\.\/\.\.\/" data-kapitel="Backpropagation">/);
  assert.match(html, /<a class="knopf fragen" href="\.\.\/\.\.\/neu\/\?kapitel=backpropagation" rel="nofollow">Diese Frage stellen<\/a>/);
  assert.doesNotMatch(indexPage([], site), /data-kapitel/);
  assert.match(indexPage([], site), /<section class="suche" id="suche" role="search" aria-label="Suche im Forum" hidden data-root="">/);
});

test('erst drei geprüfte Fragen machen die Kapitelseite indexierbar, und nur ihre Fragen stehen dort', () => {
  const open = question();
  const other = { ...reviewed(question()), id: 's02', kapitel: 'Tensoren' };
  const closed = kapitelPage(backprop, [open], site);
  assert.match(closed, /name="robots" content="noindex"/);
  assert.match(closed, /<a id="thema-s01" href="\.\.\/\.\.\/s01\/">/);
  const one = kapitelPage(backprop, [reviewed(open), other], site);
  assert.match(one, /name="robots" content="noindex"/, 'eine Liste mit einer Frage ist zu dünn für den Index');
  assert.match(one, /<a id="thema-s01" href="\.\.\/\.\.\/s01\/">/);
  assert.doesNotMatch(one, /s02/, 'Fragen aus anderen Kapiteln gehören nicht auf diese Seite');
  const three = ['s01', 's03', 's04'].map(id => ({ ...reviewed(open), id }));
  assert.match(kapitelPage(backprop, three.slice(0, 2), site), /name="robots" content="noindex"/);
  assert.match(kapitelPage(backprop, three, site), /name="robots" content="index,follow"/);
  assert.match(kapitelPage(backprop, [...three.slice(0, 2), { ...open, id: 's05' }], site), /name="robots" content="noindex"/, 'ungeprüfte zählen nicht');
});

test('ohne Knopf „Frage stellen“ bei abgeschaltetem Fragepfad, die Suche bleibt', () => {
  const html = kapitelPage(backprop, [], { ...site, fragen: false });
  assert.doesNotMatch(html, /Frage stellen/);
  assert.match(html, /id="suche"/);
});

test('das Unterforum verweist auf die Kapitelseiten, die Sitemap nennt nur Kapitel mit drei geprüften Fragen', () => {
  const lernen = forumPage(UNTERFOREN.find(u => u.slug === 'lernen'), [], site);
  assert.match(lernen, /<a href="\.\.\/kapitel\/backpropagation\/">Backpropagation<\/a>/);
  assert.equal(lernen.match(/href="\.\.\/kapitel\//g).length, 9, 'Lernen und Training hat neun Kapitel');
  const three = ['s01', 's03', 's04'].map(id => ({ ...reviewed(question()), id }));
  const map = sitemap(three, site);
  assert.match(map, /<loc>https:\/\/example\.test\/eidl\/f\/kapitel\/backpropagation\/<\/loc>/);
  assert.doesNotMatch(map, /f\/kapitel\/tensoren\//);
  assert.doesNotMatch(sitemap(three.slice(0, 2), site), /f\/kapitel\//, 'unter drei geprüften Fragen bleibt die Kapitelseite draußen');
  assert.doesNotMatch(sitemap([question()], site), /f\/kapitel\//);
});

test('das Fragenformular liest die Kapitel aus einem JSON-Block, ohne Ausführung und ohne rohes <', () => {
  const html = askPage(site);
  const block = html.match(/<script type="application\/json" id="kapitel-liste">([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(block, /</);
  const list = JSON.parse(block);
  assert.equal(list.length, KAPITEL.length);
  assert.deepEqual(list.find(k => k.slug === 'backpropagation'), { slug: 'backpropagation', titel: 'Backpropagation', unterforum: 'Lernen und Training' });
  assert.match(html, /<p class="hinweis" id="kapitel-hinweis" hidden><\/p>/);
});

test('der Bias sortiert, ohne zu filtern: ein Zuschlag rückt eine dicht dahinter liegende Frage vor, eine weit entfernte bleibt hinten', () => {
  const passages = [[1, 0, 0], [0.9, 0.1, 0], [0, 1, 0], [0, 0.9, 0.1], [0, 0, 1]];
  const centered = centerPassages(passages);
  const questions = [[1, 0, 0], [0.7, 0.7, 0], [0, 0, 1]];
  const profiles = questions.map(v => profile(centered, v, 2));
  const query = [0.9, 0.4, 0];
  const rank = bonus => rankQuestions(query, questions, profiles, centered, bonus ? { bonus } : {});
  assert.deepEqual(rank(), [0, 1, 2]);
  assert.deepEqual(rank([0, 2, 0]), [1, 0, 2], 'die zweitbeste Frage aus dem Kapitel steigt auf Platz 1');
  assert.equal(rank([0, 0, 3]).at(-1), 2, 'eine weit entfernte Frage holt der Zuschlag nicht aus dem Nichts');
  assert.deepEqual([...rank([0, 0, 0])].sort(), [0, 1, 2], 'nichts geht verloren');
  assert.ok(KAPITEL_BONUS > 0);
});

test('bei reiner Stichwortsuche zählt ein Treffer im Kapitel eineinhalbfach, ohne Treffer bleibt es null', () => {
  assert.deepEqual(biasKeywords([2, 0, 3], [false, true, true]), [2, 0, 3 * KAPITEL_FAKTOR]);
  assert.deepEqual(biasKeywords([2, 3], null), [2, 3]);
});

test('bei der Fusion holt ein Platz 1 aus dem Kapitel einen Passagentreffer nach vorn', () => {
  const vector = [0.9, 0.5, 0.1];
  const lexical = [0, 0, 0];
  assert.deepEqual(fuse(vector, lexical), [0, 1, 2]);
  assert.deepEqual(fuse(vector, lexical, { bonus: [0, 0, 1 / 11] }), [2, 0, 1]);
});

test('eine ältere pending.db bekommt die Spalte für den Kapitelhinweis nachträglich', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-kapitel-'));
  const file = path.join(dir, 'pending.db');
  const old = new DatabaseSync(file);
  old.exec(`CREATE TABLE pending (id TEXT PRIMARY KEY, text TEXT, geheimnis TEXT NOT NULL, tag TEXT NOT NULL, zustimmung INTEGER NOT NULL, einwilligung INTEGER NOT NULL,
    treffer TEXT NOT NULL, zustand TEXT NOT NULL, entwurf TEXT, grund TEXT);
    INSERT INTO pending (id, text, geheimnis, tag, zustimmung, einwilligung, treffer, zustand) VALUES ('alt', 'Eine alte Frage?', 'x', '2026-11-01', 2, 0, '[]', 'wartet');`);
  old.close();
  const pending = openPending(file);
  assert.equal(pending.get('alt').kapitel, null);
  const { id } = pending.add({ text: 'Neu mit Kapitel?', zustimmung: 2, einwilligung: false, treffer: [], zustand: 'wartet', kapitel: 'Backpropagation' });
  assert.equal(pending.get(id).kapitel, 'Backpropagation');
  pending.close();
  const again = openPending(file);
  assert.equal(again.get('alt').text, 'Eine alte Frage?', 'Die Migration lässt alte Zeilen unberührt');
  again.close();
});

test('wer fragen kann, steht auf der Seite auch ohne Kurscode und ohne JavaScript', () => {
  const sichtbar = askPage(site).replace(/<form[\s\S]*?<\/form>/g, '');
  assert.match(sichtbar, /Fragen stellen kann nur, wer den Kurscode hat, und den gibt es im Kurs in ILIAS\. Lesen können alle\./);
  assert.match(sichtbar, /Was mit einer Frage geschieht, steht unter <a href="\.\.\/\.\.\/datenschutz\/">Datenschutz<\/a>\./);
});
