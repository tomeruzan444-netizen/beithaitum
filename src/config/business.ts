/**
 * פרטי העסק - מקור אמת יחיד. כל רכיב באתר שואב מכאן.
 * ערך שמתחיל ב-"[" הוא placeholder שעוד לא נמסר: הוא לא נכנס לסכמה (JSON-LD),
 * מוצג באתר בסימון מקווקו, ונספר ברשימת "חסרים לפני עלייה לאוויר" (ראו TASK-LOG / CLAUDE.md).
 * אין להמציא כאן נתונים: שנות ניסיון, אחריות ורישום רק אם נמסרו.
 */
export const business = {
  name: 'בית האיטום',
  nameEn: 'Beit HaItum',
  /** כתובת האתר. כרגע דומיין זמני בהוסטינגר; כשיהיה דומיין אמיתי מחליפים כאן ובמשתנה SITE_URL. */
  url: import.meta.env.SITE ?? 'https://orangered-goshawk-401694.hostingersite.com',
  phone: '052-3456543',
  /** בפורמט בינלאומי בלי + ובלי מקפים, למשל 972501234567 */
  whatsapp: '972523456543',
  email: 'itumhouse@gmail.com',
  area: '[כתובת / אזור שירות]',
  hours: '[שעות]',
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

export const telHref = () =>
  isFilled(business.phone) ? `tel:${business.phone.replace(/[^\d+]/g, '')}` : '#contact';

export const waHref = (text = 'שלום, אשמח לקבל הצעת מחיר לאיטום') =>
  isFilled(business.whatsapp)
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
    : '#contact';

/** האתר באוויר על דומיין זמני -> noindex בכל העמודים, robots חוסם. */
export const isTemporaryDomain = () => /hostingersite\.com|localhost/.test(business.url);

/** רשימת פרטים חסרים - מוצגת ב-build log */
export const missingFields = () =>
  Object.entries(business)
    .filter(([, v]) => typeof v === 'string' && !isFilled(v))
    .map(([k]) => k);
