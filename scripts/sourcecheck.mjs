// בודק שמות מקורות וקישורים חיצוניים בטקסט שמוצג באתר (גוף, FAQ, כותרות, summary, שורות מחיר מוצגות).
// השדות source / sourceUrl / checked בשורות המחיר הם רישום פנימי ולא נבדקים.
// שימוש: node scripts/sourcecheck.mjs [קבצים...]   (בלי ארגומנטים: כל העמודים)
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const RE = /מידרג|Midrag|דפי זהב|ויקיפדיה|Wikipedia|ויקיטקסט|Wikisource|השירות המטאורולוגי|הלמ"ס|הלשכה המרכזית לסטטיסטיקה|כל זכות|ynet|nadlancenter|מרכז הנדל"ן|המקצוענים|[Pp]ro\.co\.il|d\.co\.il|כלכליסט|Calcalist|גלובס|דה מרקר|(?<![א-ת])נבו(?![א-ת])|EPA|CDC|WHO|ארגון הבריאות העולמי|בנק ישראל|מבקר המדינה|(?<![א-ת])[בלמהושכ]?טמבור(?![א-ת])|Tambour|(?<![א-ת])סיקה(?![א-ת])|Sika|(?<![א-ת])[בלמהושכ]?נירלט(?![א-ת])|Nirlat|(?<![א-ת])[בלמהושכ]?פזקר(?![א-ת])|Pazkar|IKO|Polyglass|Kingspan|VELUX|(?<![א-ת])ולוקס(?![א-ת])|Palram|(?<![א-ת])[בלמהושכ]?פלרם(?![א-ת])|Xypex|Alchimica|Soudal|Hilti|Dörken|DuPont|Tyvek|Lysaght|FILA|Protimeter|Sewerin|Fluke|Greenmix|(?<![א-ת])גרינמיקס(?![א-ת])|Maris|(?<![א-ת])מריס(?![א-ת])|Dow\b|Penosil|Shapir|(?<![א-ת])שפיר(?![א-ת])|Prefa|VMZINC|IIBEC|Ravago|בר-אילן|NIOSH|NOAA|TheMarker|קליל|TAMSEAL|Tamseal|Hyperdesmo|מריסל|BRE\b/g;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => { const p = path.join(d, e.name); return e.isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : []; });
const files = process.argv.slice(2).length ? process.argv.slice(2) : walk('src/content/pages');
let total = 0;
for (const f of files) {
  const m = fs.readFileSync(f, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) continue;
  const d = yaml.load(m[1]);
  const parts = {
    body: m[2],
    faq: (d.faq || []).map((x) => x.q + ' ' + x.a).join(' '),
    meta: [d.title, d.metaTitle, d.metaDescription, d.summary].join(' '),
    prices: (d.prices || []).filter((r) => r.verified !== false).map((r) => [r.item, r.desc, r.note].join(' ')).join(' '),
  };
  const hits = [];
  for (const [k, v] of Object.entries(parts)) {
    const found = [...new Set((v || '').match(RE) || [])];
    if (found.length) hits.push(`${k}: ${found.join(', ')}`);
    if (/https?:\/\//.test(v || '')) hits.push(`${k}: קישור חיצוני`);
  }
  if (hits.length) { total++; console.log(`${f}\n   ${hits.join('\n   ')}`); }
}
console.log(`\n${total} קבצים עם הפרות`);
