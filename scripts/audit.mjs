// ביקורת טכנית על dist/: מטא, canonical, H1, JSON-LD, תמונות, משקל, JS, sitemap וקישורים חיצוניים.
// שימוש: node scripts/audit.mjs [--external]
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const checkExternal = process.argv.includes('--external');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => { const p = path.join(d, e.name); return e.isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : []; });
const toUrl = (f) => { const r = path.relative(DIST, f).split(path.sep).join('/'); return r === 'index.html' ? '/' : '/' + r.replace(/index\.html$/, ''); };
const issues = {}; const add = (k, v) => (issues[k] ??= []).push(v);
const ext = new Map();
const stats = { pages: 0, maxHtml: 0, maxCss: 0, jsPages: 0, schemaTypes: {} };

const files = walk(DIST).filter((f) => !f.includes(`${path.sep}pagefind${path.sep}`));
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const url = toUrl(f);
  if (url === '/404.html') continue;
  stats.pages++;
  const get = (re) => (html.match(re) || [])[1];
  const title = get(/<title>([^<]*)<\/title>/) ?? '';
  const desc = get(/<meta name="description" content="([^"]*)"/) ?? '';
  const canon = get(/<link rel="canonical" href="([^"]*)"/) ?? '';
  const robots = get(/<meta name="robots" content="([^"]*)"/) ?? '';
  if (!/<html lang="he" dir="rtl">/.test(html)) add('lang/dir חסר', url);
  if (!title) add('title חסר', url); else if (title.length > 65) add(`title ארוך (>65)`, `${url} (${title.length})`); else if (title.length < 25) add('title קצר (<25)', `${url} (${title.length})`);
  if (!desc) add('description חסר', url); else if (desc.length > 165 || desc.length < 110) add('description מחוץ ל-110-165', `${url} (${desc.length})`);
  if (!canon) add('canonical חסר', url); else if (!canon.endsWith(url)) add('canonical לא תואם', `${url} -> ${canon}`);
  if (!robots.includes('noindex')) add('robots ללא noindex (דומיין זמני)', url);
  const h1 = (html.match(/<h1[\s>]/g) || []).length; if (h1 !== 1) add('H1 != 1', `${url} (${h1})`);
  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); for (const n of j['@graph'] ?? [j]) { const t = n['@type']; stats.schemaTypes[t] = (stats.schemaTypes[t] || 0) + 1; if (t === 'FAQPage' && !(n.mainEntity?.length)) add('FAQPage ריק', url); } }
    catch { add('JSON-LD לא תקין', url); }
  }
  // תמונות ונגישות
  for (const m of html.matchAll(/<img\b[^>]*>/g)) { if (!/\balt=/.test(m[0])) add('img בלי alt', url); if (!/\bwidth=/.test(m[0]) || !/\bheight=/.test(m[0])) add('img בלי width/height', url); }
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) add('target=_blank בלי noopener', url);
  if (/href=""/.test(html)) add('href ריק', url);
  if (/<svg\b(?![^>]*aria-hidden)(?![^>]*role="img")/.test(html.replace(/<svg[^>]*aria-label[^>]*>/g, ''))) add('svg בלי aria-hidden/role', url);
  // משקל
  const kb = Buffer.byteLength(html) / 1024; stats.maxHtml = Math.max(stats.maxHtml, kb);
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce((a, m) => a + m[1].length, 0) / 1024; stats.maxCss = Math.max(stats.maxCss, css);
  if (css > 30) add('CSS inline > 30KB', `${url} (${css.toFixed(1)}KB)`);
  const scripts = [...html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>/g)];
  if (scripts.length) { stats.jsPages++; if (url !== '/search/') add('JS בעמוד (מלבד חיפוש)', url); }
  // קישורים חיצוניים
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) { const u = m[1].replace(/&amp;/g, '&'); if (!u.includes('hostingersite.com')) ext.set(u, [...(ext.get(u) || []), url]); }
}

// sitemap
const sm = fs.readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f)).flatMap((f) => [...fs.readFileSync(path.join(DIST, f), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
const pagesSet = new Set(files.map(toUrl).filter((u) => u !== '/404.html' && u !== '/search/'));
for (const u of pagesSet) if (!sm.includes(u)) add('חסר ב-sitemap', u);
for (const u of sm) if (!pagesSet.has(u)) add('ב-sitemap אבל לא עמוד', u);
if (sm.includes('/search/')) add('search ב-sitemap', '/search/');

console.log(`עמודים: ${stats.pages} | sitemap: ${sm.length} | HTML מקס: ${stats.maxHtml.toFixed(0)}KB | CSS inline מקס: ${stats.maxCss.toFixed(1)}KB | עמודים עם JS: ${stats.jsPages}`);
console.log('סכמות:', JSON.stringify(stats.schemaTypes));
console.log(`קישורים חיצוניים ייחודיים: ${ext.size}`);

if (checkExternal) {
  const list = [...ext.keys()];
  const bad = [];
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const u = list[i++];
      let code = 0;
      for (const method of ['HEAD', 'GET']) {
        try {
          const r = await fetch(u, { method, redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; link-check)' } });
          code = r.status; if (code < 400 || code === 403) break;
        } catch { code = -1; }
      }
      if (code >= 400 && code !== 403) bad.push([code, u, ext.get(u)]);
      else if (code === -1) bad.push(['timeout/err', u, ext.get(u)]);
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
  for (const [c, u, ps] of bad) add(`קישור חיצוני שבור (${c})`, `${u}  <=  ${ps.slice(0, 3).join(', ')}${ps.length > 3 ? ` +${ps.length - 3}` : ''}`);
}

const keys = Object.keys(issues);
if (!keys.length) console.log('אין ממצאים.');
for (const k of keys) { console.log(`\n## ${k} (${issues[k].length})`); for (const v of issues[k].slice(0, 40)) console.log('  - ' + v); if (issues[k].length > 40) console.log(`  ... +${issues[k].length - 40}`); }
