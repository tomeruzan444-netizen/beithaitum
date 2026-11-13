// דוח קישוריות פנימית בגוף התוכן (Markdown): כמות, עוגן מול ביטוי היעד, הדדיות, נכנסים, קישורי בית.
// שימוש: node scripts/links.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'src/content/pages';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.md') ? [path.join(d, e.name)] : []));
const fm = (src, k) => { const m = src.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')); return m ? m[1].trim().replace(/^(["'])(.*)\1$/, '$2') : ''; };
const fmList = (src, k) => { const m = src.match(new RegExp(`^${k}:\\s*\\[(.*)\\]`, 'm')); return m ? m[1].split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean) : []; };

export function load() {
  const pages = walk(ROOT).map((f) => {
    const src = fs.readFileSync(f, 'utf8');
    const id = path.relative(ROOT, f).replace(/\\/g, '/').replace(/\.md$/, '').replace(/\/index$/, '');
    const body = src.replace(/^---[\s\S]*?\n---\n/, '');
    const links = [...body.matchAll(/\[([^\]]+)\]\((\/[^)\s#]*)(#[^)]*)?\)/g)].map((m) => ({ anchor: m[1], to: m[2] }));
    return { file: f, url: `/${id}/`, keyword: fm(src, 'keyword'), type: fm(src, 'type'), silo: fm(src, 'silo'), city: fm(src, 'city'), order: Number(fm(src, 'order')) || 0, related: fmList(src, 'related'), tags: [...fmList(src, 'methods'), ...fmList(src, 'surfaces'), ...fmList(src, 'problems')], draft: /^draft:\s*true/m.test(src), links };
  }).filter((p) => !p.draft);
  return pages;
}

const norm = (s) => s.replace(/["'״׳]/g, '').replace(/[,.:;()]/g, ' ').replace(/\s+/g, ' ').trim();
// גזע פשוט: בלי תחיליות (ב/ה/ל/ו/מ/ש/כ) ובלי סיומות רבים/נקבה, כדי ש"איתור נזילה" יתאים ל"איתור נזילות"
const stem = (w) => {
  let x = w;
  if (x.length > 3) x = x.replace(/^(וה|שה|וב|ול|מה|כש|וכ|ומ|[בהלומשכ])(?=[א-ת]{3})/, '');
  if (x.length > 3) x = x.replace(/(ות|ים|יות|ה|ת)$/, '');
  return x;
};
const SYN = { 'איסכורית': 'פח', 'בניה': 'בני', 'בנייה': 'בני', 'פולימרי': 'פולימר', 'קפילארית': 'קפילר' };
const stems = (s) => norm(s).split(' ').filter((w) => w.length > 1).map((w) => SYN[w] ?? stem(w));
// התאמת עוגן: exact = הביטוי המדויק בעוגן; close = כל גזעי הביטוי בעוגן; partial = חצי ומעלה; weak = פחות
export function anchorMatch(anchor, keyword) {
  const a = norm(anchor), k = norm(keyword);
  if (!k) return 'none';
  if (a.includes(k)) return 'exact';
  const ks = stems(k), as = new Set(stems(a));
  const hit = ks.filter((w) => as.has(w));
  if (hit.length === ks.length) return 'close';
  if (hit.length >= Math.ceil(ks.length / 2)) return 'partial';
  return 'weak';
}

if ((process.argv[1] ?? '').endsWith('links.mjs')) {
  const pages = load();
  const by = new Map(pages.map((p) => [p.url, p]));
  const inbound = new Map(pages.map((p) => [p.url, new Set()]));
  const issues = { over5: [], under2: [], weak: [], broken: [], self: [], dupTarget: [] };
  let homeLinks = [];
  for (const p of pages) {
    const seen = new Set();
    for (const l of p.links) {
      if (l.to === '/') { homeLinks.push({ from: p.url, anchor: l.anchor }); continue; }
      const t = by.get(l.to);
      if (!t) { issues.broken.push(`${p.url} -> ${l.to}`); continue; }
      if (t.url === p.url) issues.self.push(p.url);
      if (seen.has(l.to)) issues.dupTarget.push(`${p.url} -> ${l.to}`);
      seen.add(l.to);
      inbound.get(t.url).add(p.url);
      const m = anchorMatch(l.anchor, t.keyword);
      if (m === 'weak' || m === 'partial') issues.weak.push(`${m}\t${p.url} -> ${t.url}\t[${l.anchor}] / ${t.keyword}`);
    }
    const n = p.links.length;
    if (n > 5) issues.over5.push(`${p.url} (${n})`);
    if (n < 2 && p.type !== 'reference') issues.under2.push(`${p.url} (${n})`);
  }
  // הדדיות בתוך סילו: A->B בלי B->A
  const oneWay = [];
  for (const p of pages) for (const l of p.links) {
    const t = by.get(l.to);
    if (t && t.silo === p.silo && t.type !== 'hub' && p.type !== 'hub' && !t.links.some((x) => x.to === p.url)) oneWay.push(`${p.url} -> ${t.url}`);
  }
  const noIn = pages.filter((p) => inbound.get(p.url).size === 0).map((p) => p.url);
  const counts = {};
  for (const p of pages) counts[p.links.length] = (counts[p.links.length] || 0) + 1;
  const exact = pages.flatMap((p) => p.links.filter((l) => by.get(l.to)).map((l) => anchorMatch(l.anchor, by.get(l.to).keyword)));
  const tally = exact.reduce((o, m) => ((o[m] = (o[m] || 0) + 1), o), {});
  console.log('pages', pages.length, '| links per page:', JSON.stringify(counts));
  console.log('anchor match:', JSON.stringify(tally));
  console.log('home links:', homeLinks.length, homeLinks.slice(0, 20));
  for (const [k, v] of Object.entries(issues)) console.log(`\n## ${k} (${v.length})\n` + v.slice(0, 400).join('\n'));
  console.log(`\n## one-way within silo (${oneWay.length})`);
  console.log(oneWay.slice(0, 50).join('\n'));
  console.log(`\n## no inbound body links (${noIn.length})\n` + noIn.join('\n'));
}
