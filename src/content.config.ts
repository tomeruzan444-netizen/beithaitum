import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * עמודי תוכן. מיקום הקובץ = ה-URL:
 *   src/content/pages/walls/index.md     -> /walls/
 *   src/content/pages/walls/exterior.md  -> /walls/exterior/
 *   src/content/pages/prices.md          -> /prices/
 */
const priceRow = z.object({
  item: z.string(),
  desc: z.string().optional(),
  unit: z.string(), // מ"ר / מטר רץ / לעבודה
  min: z.number(),
  max: z.number(),
  note: z.string().optional(),
  source: z.string(), // שם המקור (אתר מחירון, יצרן, הצעות שוק...)
  sourceUrl: z.string().url().optional(),
  checked: z.string(), // YYYY-MM
  verified: z.boolean().default(true), // false = לא מוצג, נכנס לדוח "מחירים לבדיקה"
});

const pages = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/pages',
    generateId: ({ entry }) => entry.replace(/\.md$/, '').replace(/(^|\/)index$/, ''),
  }),
  schema: z.object({
    title: z.string(), // H1 - חייב להכיל את keyword
    metaTitle: z.string(),
    metaDescription: z.string(),
    keyword: z.string(),
    secondary: z.array(z.string()).default([]),
    type: z.enum(['hub', 'service', 'problem', 'reference', 'region', 'city']),
    silo: z.string(),
    /** משפט ייחודי אחד לכרטיס ב-Hub ובסיידבר */
    summary: z.string(),
    order: z.number().default(50),
    related: z.array(z.string()).default([]),
    methods: z.array(z.string()).default([]),
    surfaces: z.array(z.string()).default([]),
    problems: z.array(z.string()).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    prices: z.array(priceRow).default([]),
    vat: z.enum(['כולל מע"מ', 'לא כולל מע"מ']).default('לא כולל מע"מ'),
    diagram: z.string().optional(),
    featuredCities: z.boolean().default(false),
    updated: z.string(), // YYYY-MM-DD
    draft: z.boolean().default(false),
  }),
});

export const collections = { pages };
