/**
 * Die Schlange zwischen Web-Prozess und Worker: eine Datei je Auftrag. Auf dem Server liegt sie in /run, also im Arbeitsspeicher und in
 * keinem Backup. Nur was hier liegt, sieht der Worker, `pending.db` kann er nicht öffnen (I1). Jede Datei entsteht in `tmp/` und
 * wird umbenannt, halbe Aufträge gibt es also nicht.
 */
import fs from 'node:fs';
import path from 'node:path';

export function openSpool(dir) {
  const box = name => path.join(dir, name);
  for (const name of ['eingang', 'ausgang', 'tmp']) fs.mkdirSync(box(name), { recursive: true });
  const place = (name, entry) => {
    const temp = path.join(box('tmp'), `${entry.id}.neu`);
    fs.writeFileSync(temp, JSON.stringify(entry), { mode: 0o640 });
    fs.renameSync(temp, path.join(box(name), `${entry.id}.json`));
  };
  const read = name => fs.readdirSync(box(name)).filter(f => f.endsWith('.json')).map(f => {
    const file = path.join(box(name), f);
    return { file, entry: JSON.parse(fs.readFileSync(file, 'utf8')) };
  });
  return {
    /** Web-Prozess: Auftrag einstellen, zurücknehmen, nachsehen, abholen */
    submit: job => place('eingang', job),
    cancel: id => fs.rmSync(path.join(box('eingang'), `${id}.json`), { force: true }),
    waiting: id => fs.existsSync(path.join(box('eingang'), `${id}.json`)),
    results: () => read('ausgang'),
    /** Worker: Aufträge lesen und jeden mit einem Ergebnis beenden, die Eingabe verschwindet dabei */
    jobs: () => read('eingang'),
    finish(file, result) {
      place('ausgang', result);
      fs.rmSync(file, { force: true });
    },
    drop: file => fs.rmSync(file, { force: true }),
  };
}
