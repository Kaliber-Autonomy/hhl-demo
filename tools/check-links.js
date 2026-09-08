/* Link and anchor audit across every locale.
   Usage: node tools/check-links.js
   Exits non-zero if anything is broken, so it can gate a deploy. */
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'site');
const dirs = ['', 'fr-ca', 'de-de', 'en-de'].map(d => path.join(OUT, d));

const ids = {};
const pages = [];
for (const d of dirs) {
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('.html'))) {
    const p = path.join(d, f);
    const s = fs.readFileSync(p, 'utf8');
    ids[path.resolve(p)] = new Set([...s.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
    pages.push(p);
  }
}

let checked = 0, external = 0;
const bad = [];
for (const p of pages) {
  const s = fs.readFileSync(p, 'utf8');
  const dir = path.dirname(p);
  const rel = path.relative(OUT, p).replace(/\\/g, '/');
  for (const m of s.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(u)) { external++; continue; }
    checked++;
    if (u.startsWith('#')) {
      if (!ids[path.resolve(p)].has(u.slice(1))) bad.push(`${rel} -> ${u}  (missing anchor on this page)`);
      continue;
    }
    const [file, frag] = u.split('#');
    const target = path.resolve(dir, file);
    if (!fs.existsSync(target)) { bad.push(`${rel} -> ${u}  (missing file)`); continue; }
    if (frag && ids[target] && !ids[target].has(frag)) bad.push(`${rel} -> ${u}  (missing anchor on target)`);
  }
}

console.log(`${pages.length} pages | ${checked} internal links | ${external} external | ${bad.length} broken`);
bad.forEach(b => console.log('  ' + b));
process.exit(bad.length ? 1 : 0);
