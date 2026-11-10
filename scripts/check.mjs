// בדיקות אחרי build (build-spec סעיף 12). רץ על dist/. יוצא עם קוד 1 אם יש שגיאה.
// - קישור פנימי שבור, עמוד יתום, עומק קליקים מעל 3 מדף הבית
// - H1 אחד בכל עמוד, title ו-description ייחודיים
// - דמיון בין עמודים: 3 משפטים זהים ברצף בתוך <article>
// - דוח "מחירים לבדיקה" -> docs/prices-to-check.md
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const DIST = 'dist';
const errors = [];
const warns = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}
const toUrl = (f) => {
  const rel = path.relative(DIST, f).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
};

// עמודים שמגיעים אליהם רק מתהליך (תודה אחרי טופס) - לא נבדקים כיתומים
const FLOW_ONLY = new Set(['/thanks/']);
const files = walk(DIST).filter((f) => !f.endsWith('404.html'));
const pages = new Map();
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const url = toUrl(f);
  const links = [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((h) => h.startsWith('/') && !h.startsWith('//') && !/\.(svg|xml|txt|css|js|woff2?)$/.test(h.split('#')[0]))
    .map((h) => h.split('#')[0])
    .filter(Boolean);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const art = (html.match(/<article[\s\S]*?<\/article>/) || [''])[0]
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/g, ' ');
  const sentences = art.split(/[.?!:]\s+/).map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.split(' ').length >= 7);
  pages.set(url, { links: new Set(links), h1, title, desc, sentences });
}

// קישורים שבורים
for (const [u, p] of pages) {
  for (const l of p.links) {
    const key = l.endsWith('/') || l.includes('.') ? l : l + '/';
    if (!pages.has(key) && !fs.existsSync(path.join(DIST, l))) errors.push(`קישור שבור: ${u} -> ${l}`);
  }
  if (p.h1 !== 1) errors.push(`${u}: ${p.h1} תגיות H1 (נדרש 1)`);
}

// יתומים + עומק
const incoming = new Map([...pages.keys()].map((u) => [u, 0]));
for (const [u, p] of pages) for (const l of p.links) if (l !== u && incoming.has(l)) incoming.set(l, incoming.get(l) + 1);
for (const [u, n] of incoming) if (u !== '/' && !FLOW_ONLY.has(u) && n === 0) errors.push(`עמוד יתום (אין אליו קישור): ${u}`);
const depth = new Map([['/', 0]]);
const q = ['/'];
while (q.length) {
  const u = q.shift();
  for (const l of pages.get(u)?.links ?? []) if (pages.has(l) && !depth.has(l)) { depth.set(l, depth.get(u) + 1); q.push(l); }
}
for (const u of pages.keys()) {
  if (FLOW_ONLY.has(u)) continue;
  if (!depth.has(u)) errors.push(`לא נגיש מדף הבית: ${u}`);
  else if (depth.get(u) > 3) errors.push(`עומק ${depth.get(u)} קליקים: ${u}`);
}

// ייחודיות title / description
const dup = (field) => {
  const m = new Map();
  for (const [u, p] of pages) if (p[field]) m.set(p[field], [...(m.get(p[field]) || []), u]);
  for (const [v, us] of m) if (us.length > 1) errors.push(`${field} כפול: ${us.join(', ')}`);
};
dup('title'); dup('desc');

// דמיון: 3 משפטים משותפים ברצף עם אותו עמוד אחר
const owners = new Map();
for (const [u, p] of pages) for (const s of new Set(p.sentences)) owners.set(s, [...(owners.get(s) || []), u]);
for (const [u, p] of pages) {
  let run = 0, prevOther = null;
  for (const s of p.sentences) {
    const others = (owners.get(s) || []).filter((x) => x !== u);
    const other = others.find((o) => o === prevOther) ?? others[0] ?? null;
    if (other && (run === 0 || other === prevOther)) { run++; prevOther = other; } else { run = other ? 1 : 0; prevOther = other; }
    if (run === 3) errors.push(`דמיון: 3 משפטים זהים ברצף בין ${u} ל-${other}`);
  }
}

// דוח מחירים לבדיקה
const rows = [];
function walkMd(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walkMd(p) : p.endsWith('.md') ? [p] : [];
  });
}
for (const f of walkMd('src/content/pages')) {
  const fm = fs.readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const d = yaml.load(fm[1]);
  for (const r of d.prices || []) if (r.verified === false) rows.push(`| ${d.keyword} | ${r.item} | ${r.min}-${r.max} ${r.unit} | ${r.source || ''} |`);
}
fs.writeFileSync('docs/prices-to-check.md', `# מחירים לבדיקה\n\nשורות שסומנו verified: false - לא מוצגות באתר עד אימות.\n\n| עמוד | עבודה | טווח | מקור |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n`);

console.log(`check: ${pages.size} עמודים, ${errors.length} שגיאות, ${rows.length} מחירים לבדיקה`);
if (warns.length) console.log(warns.map((w) => '  ! ' + w).join('\n'));
if (errors.length) { console.error(errors.map((e) => '  x ' + e).join('\n')); process.exit(1); }
