/**
 * פרטי העסק - מקור אמת יחיד. כל רכיב באתר שואב מכאן.
 * ערך שמתחיל ב-"[" הוא placeholder שעוד לא נמסר: הוא לא נכנס לסכמה (JSON-LD),
 * מוצג באתר בסימון מקווקו, ונספר ברשימת "חסרים לפני עלייה לאוויר" (ראו TASK-LOG / CLAUDE.md).
 * אין להמציא כאן נתונים: שנות ניסיון, אחריות ורישום רק אם נמסרו.
 */
export const business = {
  name: 'בית האיטום',
  nameEn: 'Beit HaItum',
  /** כתובת האתר (דומיין אמיתי מ-2026-11-10). מוחלף גם ב-astro.config.mjs / SITE_URL. */
  url: import.meta.env.SITE ?? 'https://itumhouse.co.il',
  /** חסימת גוגל עד שהמשתמש יאשר עלייה לאוויר (החלטה 2026-11-10). לפתיחה: false + להסיר את X-Robots-Tag ב-public/.htaccess. */
  blockIndexing: false,
  phone: '052-4586433',
  /** בפורמט בינלאומי בלי + ובלי מקפים, למשל 972501234567 */
  whatsapp: '972524586433',
  email: 'itumhouse@gmail.com',
  area: '[כתובת / אזור שירות]',
  hours: "ימים א'-ה'",
  contractorLicense: '[מספר רישום]',
  yearsExperience: '[מספר שנים]',
  warranty: '[תנאי אחריות]',
  googleBusiness: '[קישור]',
  social: [] as string[],
  /** ניסוח הצוות כל עוד אין נתון מספרי מאומת */
  teamLine: 'צוות מומחי איטום עם ניסיון של שנים',
} as const;

export const isFilled = (v: string | undefined | null): v is string =>
  !!v && !v.trim().startsWith('[');

/** טלפון בפורמט בינלאומי לסכמה, למשל +972-52-4586433 */
export const telIntl = () =>
  isFilled(business.phone) ? '+972-' + business.phone.replace(/\D/g, '').replace(/^0/, '').replace(/^(\d{2})/, '$1-') : '';

export const telHref = () =>
  isFilled(business.phone) ? `tel:${business.phone.replace(/[^\d+]/g, '')}` : '#contact';

export const waHref = (text = 'שלום, אשמח לקבל הצעת מחיר לאיטום') =>
  isFilled(business.whatsapp)
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
    : '#contact';

/** חסום לאינדקס (דגל blockIndexing או דומיין זמני) -> noindex בכל העמודים, robots חוסם. */
export const isIndexingBlocked = () =>
  business.blockIndexing || /hostingersite\.com|localhost/.test(business.url);

/** רשימת פרטים חסרים - מוצגת ב-build log */
export const missingFields = () =>
  Object.entries(business)
    .filter(([, v]) => typeof v === 'string' && !isFilled(v))
    .map(([k]) => k);
