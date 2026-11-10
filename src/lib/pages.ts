/**
 * מנוע הקישורים הפנימיים. הכול מחושב מה-frontmatter - שום קישור לא מוקלד ידנית בתבניות.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { silos } from '../data/silos';
import { cityBySlug, km } from '../data/cities';

export type Page = CollectionEntry<'pages'>;

export const urlOf = (p: Page) => (p.id ? `/${p.id}/` : '/');

let cache: Page[] | null = null;
export async function allPages(): Promise<Page[]> {
  if (!cache) cache = (await getCollection('pages')).filter((p) => !p.data.draft);
  return cache;
}

export async function pageByUrl(url: string) {
  return (await allPages()).find((p) => urlOf(p) === url);
}

/** נתיב קיים ומפורסם? (לקישור מותנה מדף הבית ומעמודים אחרים) */
export async function publishedSet() {
  return new Set((await allPages()).map(urlOf));
}

export async function hubOf(silo: string) {
  return (await allPages()).find((p) => p.data.silo === silo && p.data.type === 'hub');
}

export async function childrenOf(silo: string) {
  return (await allPages())
    .filter((p) => p.data.silo === silo && p.data.type !== 'hub')
    .sort((a, b) => a.data.order - b.data.order || a.data.keyword.localeCompare(b.data.keyword, 'he'));
}

const tags = (p: Page) => new Set([...p.data.methods, ...p.data.surfaces, ...p.data.problems]);
function overlap(a: Page, b: Page) {
  const ta = tags(a);
  let n = 0;
  for (const t of tags(b)) if (ta.has(t)) n++;
  // קישור מפורש ב-related שווה יותר מתגית משותפת
  if (a.data.related.includes(urlOf(b))) n += 3;
  if (b.data.related.includes(urlOf(a))) n += 1;
  return n;
}

/** אחים מאותו סילו, ממוינים לפי חפיפה */
export async function siblings(p: Page, max = 6) {
  return (await childrenOf(p.data.silo))
    .filter((x) => x.id !== p.id)
    .map((x) => ({ x, s: overlap(p, x) }))
    .sort((a, b) => b.s - a.s || a.x.data.order - b.x.data.order)
    .slice(0, max)
    .map((o) => o.x);
}

/** פתרונות קשורים מסילואים אחרים (רק עם חפיפה אמיתית) */
export async function crossRelated(p: Page, max = 4) {
  return (await allPages())
    .filter((x) => x.data.silo !== p.data.silo && x.data.type !== 'reference' && x.data.type !== 'city')
    .map((x) => ({ x, s: overlap(p, x) }))
    .filter((o) => o.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map((o) => o.x);
}

/** תפריט: לכל סילו עם Hub מפורסם - עד 7 עמודים */
export async function menu() {
  const out = [];
  for (const s of silos) {
    const hub = await hubOf(s.id);
    if (!hub) continue;
    const kids = (await childrenOf(s.id)).filter((k) => k.data.type !== 'city');
    out.push({ silo: s, hub, items: kids.slice(0, 7), total: kids.length });
  }
  return out;
}

/** קישורים פנימיים בגוף markdown */
export function bodyLinks(body: string) {
  return [...body.matchAll(/\]\((\/[^)\s#]*)(#[^)]*)?\)/g)].map((m) => m[1]);
}

/** ערים סמוכות שיש להן עמוד מפורסם, לפי מרחק */
export async function nearbyCities(p: Page, max = 5) {
  const me = p.data.city ? cityBySlug(p.data.city) : undefined;
  if (!me) return [];
  return (await allPages())
    .filter((x) => x.data.type === 'city' && x.data.city && x.data.city !== me.slug)
    .map((x) => ({ x, d: km(me, cityBySlug(x.data.city!)!) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, max)
    .map((o) => o.x);
}

export async function regionPage(slug?: string) {
  if (!slug) return undefined;
  return (await allPages()).find((x) => x.data.type === 'region' && x.data.region === slug);
}

/** ערים מפורסמות באזור */
export async function citiesInRegion(slug: string) {
  return (await allPages())
    .filter((x) => x.data.type === 'city' && x.data.city && cityBySlug(x.data.city)?.region === slug)
    .sort((a, b) => a.data.order - b.data.order || a.data.keyword.localeCompare(b.data.keyword, 'he'));
}

/** אייקון איזומטרי לעמוד, לפי סילו ותגיות */
export function iconFor(p: Page): 'concrete' | 'membrane' | 'liquid' | 'tiles' | 'metal' | 'terrace' | 'leak' | 'wall' | 'gutter' | 'building' {
  const d = p.data, s = new Set([...d.surfaces, ...d.methods, ...d.problems]);
  if (d.silo === 'gutters' || s.has('gutter')) return 'gutter';
  if (d.type === 'city' || d.type === 'region' || d.silo === 'structures') return 'building';
  if (s.has('tiled-roof')) return 'tiles';
  if (s.has('metal-roof') || s.has('panel-roof')) return 'metal';
  if (s.has('balcony') || s.has('paved-roof') || d.silo === 'balconies') return 'terrace';
  if (d.silo === 'moisture') return 'leak';
  if (d.silo === 'walls' || d.silo === 'interior') return 'wall';
  if (s.has('bitumen-membranes') || s.has('tar')) return 'membrane';
  if (s.has('liquid-applied') || s.has('polyurethane') || s.has('acrylic') || s.has('spray')) return 'liquid';
  return 'concrete';
}

/** מדריכים קשורים (עמודי בעיה / Hub) לפי תגיות */
export async function guidesFor(p: Page, max = 3) {
  return (await allPages())
    .filter((x) => x.id !== p.id && (x.data.type === 'problem' || (x.data.type === 'hub' && x.data.silo !== 'areas')))
    .map((x) => ({ x, s: overlap(p, x) + (x.data.silo === p.data.silo ? 1 : 0) }))
    .filter((o) => o.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map((o) => o.x);
}

/** ערים מובילות (לפי order) */
export async function topCities(max = 6) {
  return (await allPages()).filter((x) => x.data.type === 'city').sort((a, b) => a.data.order - b.data.order).slice(0, max);
}
