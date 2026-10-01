import { readFile } from 'node:fs/promises';
const OWNER = 'TNDOS';
const data = JSON.parse(await readFile(new URL('../data/versions.json', import.meta.url), 'utf8'));

const urls = [];
for (const c of data.components) {
  for (const v of c.versions || []) {
    urls.push('https://github.com/' + OWNER + '/' + c.repo + '/archive/refs/tags/' + v.tag + '.tar.gz');
    if (v.assets) for (const a of v.assets) {
      urls.push('https://github.com/' + OWNER + '/' + c.repo + '/releases/download/' + v.tag + '/' + a.name);
    }
  }
  urls.push('https://github.com/' + OWNER + '/' + c.repo + '/archive/refs/heads/main.tar.gz');
}
for (const u of urls) {
  let status = '?';
  try {
    const r = await fetch(u, { method: 'HEAD', redirect: 'follow' });
    status = String(r.status);
  } catch (e) { status = 'ERR ' + e.message; }
  console.log('  ' + status.padEnd(5) + ' ' + u.replace('https://github.com/', ''));
}
