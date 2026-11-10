// ספירת מילים בגוף העמוד - אותה שיטה בדיוק כמו ב-src/lib/validate.ts (נאכפת ב-build).
// שימוש: node scripts/wordcount.mjs [קבצים...]   (בלי ארגומנטים: כל העמודים מתחת ל-1,100)
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const wc = (md) =>
  md.replace(/\]\([^)]*\)/g, ']').replace(/[#*|>`\[\]_-]+/g, ' ').split(/\s+/).filter((w) => /[֐-׿A-Za-z0-9]/.test(w)).length;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => { const p = path.join(d, e.name); return e.isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : []; });

const files = process.argv.slice(2).length ? process.argv.slice(2) : walk('src/content/pages');
for (const f of files) {
  const m = fs.readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) continue;
  const d = yaml.load(m[1]);
  const n = wc(m[2]);
  if (process.argv.slice(2).length || (d.type !== 'reference' && n < 1100)) console.log(`${n}\t${d.type}\t${f}`);
}
