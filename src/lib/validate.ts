/**
 * שער איכות בזמן build: עמוד שמפר כלל מדיד מפיל את הבנייה (build-spec סעיף 12, content-guide סעיפים 6-10).
 */
import { allPages, urlOf, bodyLinks, type Page } from './pages';

export async function validateAll() {
  const pages = await allPages();
  const urls = new Set(pages.map(urlOf));
  const byUrl = new Map(pages.map((p) => [urlOf(p), p]));
  urls.add('/'); urls.add('/sitemap/');
  const errors: string[] = [];
  const seenTitle = new Map<string, string>();
  const seenDesc = new Map<string, string>();

  for (const p of pages) {
    const d = p.data;
    const u = urlOf(p);
    const e = (m: string) => errors.push(`${u}: ${m}`);
    const body = p.body ?? '';

    if (!d.title.includes(d.keyword)) e(`H1 לא מכיל את הביטוי "${d.keyword}"`);
    if (!d.metaTitle.includes(d.keyword)) e(`metaTitle לא מכיל את הביטוי "${d.keyword}"`);
    if (!d.metaDescription.includes(d.keyword)) e(`metaDescription לא מכיל את הביטוי "${d.keyword}"`);
    if (seenTitle.has(d.metaTitle)) e(`metaTitle כפול עם ${seenTitle.get(d.metaTitle)}`);
    if (seenDesc.has(d.metaDescription)) e(`metaDescription כפול עם ${seenDesc.get(d.metaDescription)}`);
    seenTitle.set(d.metaTitle, u); seenDesc.set(d.metaDescription, u);

    if (/[–—]/.test(body + d.title + d.metaTitle + d.metaDescription + JSON.stringify(d.faq))) e('מקף ארוך (– או —) - מותר רק "-"');
    if (/\[[^\]\n]{1,40}\](?!\()/.test(body)) e('נראה כמו placeholder בסוגריים מרובעים בגוף העמוד');
    if (/^#\s/m.test(body)) e('H1 בגוף המאמר - ה-H1 מגיע מ-title בלבד');

    // החלטת המשתמש 2026-11-10: בלי קישורים חיצוניים ובלי שמות מקורות בתוכן
    const faqText = d.faq.map((f) => f.q + ' ' + f.a).join(' ');
    if (/\]\(https?:|<a\s[^>]*href="https?:/.test(body) || /https?:\/\//.test(faqText)) e('קישור חיצוני בתוכן (אסור לפי החלטת המשתמש)');
    const shown = [d.title, d.metaTitle, d.metaDescription, d.summary, ...d.prices.filter((r) => r.verified).flatMap((r) => [r.item, r.desc ?? '', r.note ?? ''])].join(' ');
    if (/https?:\/\//.test(shown)) e('קישור חיצוני בשדה שמוצג (summary/meta/מחירים)');
    const src = (body + ' ' + faqText + ' ' + shown).match(SOURCE_NAMES);
    if (src) e(`שם מקור בתוכן: "${src[0]}"`);

    const links = bodyLinks(body);
    for (const l of links) if (!urls.has(l)) e(`קישור פנימי לעמוד שלא קיים: ${l}`);

    // קישוריות פנימית (החלטת המשתמש 2026-11-13): עד 5 קישורים ייחודיים בגוף, בלי כפילויות,
    // העוגן = הביטוי של עמוד היעד (או צורה קרובה), וקישור לדף הבית רק בעוגן "בית האיטום"
    const uniq = new Set(links);
    if (uniq.size > 5) e(`יותר מ-5 קישורים פנימיים בגוף (${uniq.size})`);
    if (uniq.size < links.length) e('קישור כפול לאותו עמוד בגוף');
    for (const m of body.matchAll(/\[([^\]]+)\]\((\/[^)\s#]*)(#[^)]*)?\)/g)) {
      const [, anchor, to] = m;
      if (to === '/') { if (anchor.trim() !== 'בית האיטום') e(`קישור לדף הבית חייב להיות בעוגן "בית האיטום", נמצא "${anchor}"`); continue; }
      const t = byUrl.get(to);
      if (t && !anchorFits(anchor, t.data.keyword)) e(`עוגן "${anchor}" לא תואם לביטוי של ${to} ("${t.data.keyword}")`);
    }

    if (d.type === 'service' || d.type === 'problem' || d.type === 'city') {
      // כללים לעמודים חדשים (14.11.2026): 2 עד 5 קישורים בגוף
      if (uniq.size < 2) e(`נדרשים 2 עד 5 קישורים פנימיים בגוף, נמצאו ${uniq.size}`);
      if (d.faq.length < 10 || d.faq.length > 15) e(`FAQ: נדרשות 10 עד 15 שאלות, יש ${d.faq.length}`);
      if (!d.prices.some((r) => r.verified)) e('אין טבלת מחירים (שורה מאומתת אחת לפחות)');
    }
    if (d.type === 'hub' && (d.faq.length < 5 || d.faq.length > 8)) e(`Hub FAQ: נדרשות 5 עד 8 שאלות, יש ${d.faq.length}`);
    if (d.type === 'city' && !d.city) e('עמוד עיר בלי שדה city');
    if (d.type === 'region' && !d.region) e('עמוד אזור בלי שדה region');
    // אורך: לפחות 1,000 מילים בגוף (בלי frontmatter ובלי FAQ) בכל עמוד תוכן - דרישת המשתמש 2026-11-10
    if (d.type !== 'reference') {
      const words = wordCount(body);
      if (words < 1000) e(`אורך: ${words} מילים בגוף, נדרש לפחות 1,000`);
    }
    for (const r of d.prices) if (r.min > r.max) e(`מחיר: min גדול מ-max ב"${r.item}"`);
  }
  if (errors.length && process.env.SKIP_VALIDATE) {
    console.warn(`\n[SKIP_VALIDATE] ${errors.length} בעיות תוכן:\n- ${errors.join('\n- ')}\n`);
    return;
  }
  if (errors.length) {
    throw new Error(`\n\nבדיקת איכות תוכן נכשלה (${errors.length}):\n- ${errors.join('\n- ')}\n`);
  }
}

/** שמות מקורות שאסור להזכיר בתוכן (אתרים, ארגונים, יצרנים שצוטטו כמקור) */
export const SOURCE_NAMES = /מידרג|Midrag|דפי זהב|ויקיפדיה|Wikipedia|ויקיטקסט|Wikisource|השירות המטאורולוגי|הלמ"ס|הלשכה המרכזית לסטטיסטיקה|כל זכות|ynet|nadlancenter|מרכז הנדל"ן|נדל"ן סנטר|נדל\\"ן סנטר|המקצוענים|[Pp]ro\.co\.il|d\.co\.il|כלכליסט|Calcalist|גלובס|דה מרקר|(?<![א-ת])נבו(?![א-ת])|EPA|CDC|WHO|ארגון הבריאות העולמי|בנק ישראל|מבקר המדינה|(?<![א-ת])[בלמהושכ]?טמבור(?![א-ת])|Tambour|(?<![א-ת])סיקה(?![א-ת])|Sika|(?<![א-ת])[בלמהושכ]?נירלט(?![א-ת])|Nirlat|(?<![א-ת])[בלמהושכ]?פזקר(?![א-ת])|Pazkar|IKO|Polyglass|Kingspan|VELUX|(?<![א-ת])ולוקס(?![א-ת])|Palram|(?<![א-ת])[בלמהושכ]?פלרם(?![א-ת])|Xypex|Alchimica|Soudal|Hilti|Dörken|DuPont|Tyvek|Lysaght|FILA|Protimeter|Sewerin|Fluke|Greenmix|(?<![א-ת])גרינמיקס(?![א-ת])|Maris|(?<![א-ת])מריס(?![א-ת])|Dow|Penosil|Shapir|(?<![א-ת])שפיר(?![א-ת])|Prefa|VMZINC|IIBEC|Ravago|בר-אילן|NIOSH|NOAA|TheMarker|קליל|TAMSEAL|Tamseal|Hyperdesmo|מריסל|BRE\b|פוליגג|טופגג|אקרילפז|גומיגג|סיקפלקס|Sikaflex|אלסטוסיל|Keter|(?<![א-ת])כתר(?![א-ת])|Mapei|Dektite|Link-Seal|Hutterer|Lechner|USA Containers|Property Care|gov\.il|www\.|https?:\/\//;

// התאמת עוגן לביטוי: הביטוי המדויק, או כל המילים שלו בצורה קרובה (תחיליות ב/ה/ל/ו/מ/ש/כ, יחיד/רבים).
// אותה לוגיקה כמו scripts/links.mjs.
const normA = (s: string) => s.replace(/["'״׳]/g, '').replace(/[,.:;()]/g, ' ').replace(/\s+/g, ' ').trim();
const SYN: Record<string, string> = { 'איסכורית': 'פח', 'בניה': 'בני', 'בנייה': 'בני', 'פולימרי': 'פולימר', 'קפילארית': 'קפילר' };
const stemA = (w: string) => {
  let x = w;
  if (x.length > 3) x = x.replace(/^(וה|שה|וב|ול|מה|כש|וכ|ומ|[בהלומשכ])(?=[א-ת]{3})/, '');
  if (x.length > 3) x = x.replace(/(ות|ים|יות|ה|ת)$/, '');
  return x;
};
const stemsA = (s: string) => normA(s).split(' ').filter((w) => w.length > 1).map((w) => SYN[w] ?? stemA(w));
export function anchorFits(anchor: string, keyword: string) {
  const a = normA(anchor), k = normA(keyword);
  if (a.includes(k)) return true;
  const as = new Set(stemsA(a));
  return stemsA(k).every((w) => as.has(w));
}

export function wordCount(md: string) {
  return md
    .replace(/\]\([^)]*\)/g, ']') // URL של קישורים לא נספר
    .replace(/[#*|>`\[\]_-]+/g, ' ')
    .split(/\s+/)
    .filter((w) => /[֐-׿A-Za-z0-9]/.test(w)).length;
}

export const hasPrices = (p: Page) => p.data.prices.some((r) => r.verified);
