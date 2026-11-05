#!/usr/bin/env node
/**
 * Was der Web-Prozess auf dem VPS braucht, eine Datei oder ein Verzeichnis je Zeile. Allowlist statt Kopie des Repos, und
 * die Abhängigkeiten kommen aus `package-lock.json`: transformers und das Modell bleiben auf dem Laptop.
 */
import fs from 'node:fs';
import path from 'node:path';

const repo = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const lock = JSON.parse(fs.readFileSync(path.join(repo, 'package-lock.json'), 'utf8')).packages;

const CODE = ['package.json', 'server/web.mjs', 'tools/mod-account.mjs', ...['auth', 'checker', 'forum', 'mod', 'mod-pages', 'mod-tasten', 'publish', 'render', 'segment', 'site', 'store'].map(n => `lib/${n}.js`)];

const needed = new Set();
const visit = name => {
  const key = `node_modules/${name}`;
  if (needed.has(key)) return;
  if (!lock[key]) throw new Error(`${name} fehlt in package-lock.json`);
  needed.add(key);
  for (const dep of Object.keys(lock[key].dependencies ?? {})) visit(dep);
};
['markdown-it', 'katex'].forEach(visit);

console.log([...CODE, ...needed].join('\n'));
