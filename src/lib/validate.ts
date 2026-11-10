/**
 * שער איכות בזמן build: עמוד שמפר כלל מדיד מפיל את הבנייה (build-spec סעיף 12, content-guide סעיפים 6-10).
 */
import { allPages, urlOf, bodyLinks, type Page } from './pages';

export async function validateAll() {
  const pages = await allPages();
  const urls = new Set(pages.map(urlOf));
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

    const links = bodyLinks(body);
    for (const l of links) if (!urls.has(l)) e(`קישור פנימי לעמוד שלא קיים: ${l}`);

    if (d.type === 'service' || d.type === 'problem' || d.type === 'city') {
      const uniq = new Set(links);
      if (uniq.size < 2 || uniq.size > 3) e(`נדרשים 2 עד 3 קישורים פנימיים בגוף, נמצאו ${uniq.size}`);
      if (d.faq.length < 10 || d.faq.length > 15) e(`FAQ: נדרשות 10 עד 15 שאלות, יש ${d.faq.length}`);
      if (!d.prices.some((r) => r.verified)) e('אין טבלת מחירים (שורה מאומתת אחת לפחות)');
    }
    if (d.type === 'hub' && (d.faq.length < 5 || d.faq.length > 8)) e(`Hub FAQ: נדרשות 5 עד 8 שאלות, יש ${d.faq.length}`);
    if (d.type === 'city' && !d.city) e('עמוד עיר בלי שדה city');
    if (d.type === 'region' && !d.region) e('עמוד אזור בלי שדה region');
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

export const hasPrices = (p: Page) => p.data.prices.some((r) => r.verified);
