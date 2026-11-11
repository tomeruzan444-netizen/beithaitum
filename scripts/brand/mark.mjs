// סימן הלוגו של בית האיטום: ריבוע כהה (חותם) ובתוכו שני קווי גג מקבילים -
// העליון בגוון נייר (שכבת הגמר), התחתון בנחושת (שכבת האיטום). בית שמוגן בשכבות, בצורה המינימלית ביותר.
// מקור אמת אחד לגיאומטריה - משמש גם ל-Logo.astro וגם ליצירת ה-PNG.
export const COLORS = { ink: '#15181D', copper: '#A65A2E', paper: '#F8F7F2', mist: '#E4E8EF', grey: '#5C626A' };

export const MARK_VIEWBOX = '0 0 64 64';

/** @param {{ onDark?: boolean }} o */
export function markSvgInner(o = {}) {
  const bg = o.onDark ? COLORS.paper : COLORS.ink;
  const line = o.onDark ? COLORS.ink : COLORS.paper;
  const sw = 4.6;
  const join = `fill="none" stroke-width="${sw}" stroke-linejoin="miter" stroke-miterlimit="10" stroke-linecap="butt"`;
  return (
    `<rect x="0" y="0" width="64" height="64" fill="${bg}"/>` +
    // קונטור הבית: קירות וגג בקו אחד
    `<polyline points="15,51 15,31 32,16 49,31 49,51" stroke="${line}" ${join}/>` +
    // שכבת האיטום: קו גג בנחושת בתוך הבית
    `<polyline points="21.5,38.5 32,29.3 42.5,38.5" stroke="${COLORS.copper}" ${join}/>` +
    // בסיס
    `<line x1="11" y1="51" x2="53" y2="51" stroke="${line}" stroke-width="${sw}"/>`
  );
}

export const markSvg = (o = {}, size = 512) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}" width="${size}" height="${size}">${markSvgInner(o)}</svg>`;

// פאביקון: גרסה מודגשת של הסימן, לגדלים קטנים (לשונית דפדפן, תוצאות החיפוש בגוגל).
// רקע נחושת מלא (בולט מול רוב הפאביקונים הכחולים/לבנים), בית מלא בגוון נייר וקו האיטום כחריץ בנחושת.
// הצורה כולה בתוך אזור בטוח עגול - גוגל חותך את הפאביקון לעיגול.
/** @param {{ rounded?: boolean }} o */
export function faviconSvgInner(o = {}) {
  const r = o.rounded ? 12 : 0;
  return (
    `<rect x="0" y="0" width="64" height="64" rx="${r}" fill="${COLORS.copper}"/>` +
    `<polygon points="14,51 14,30 32,14 50,30 50,51" fill="${COLORS.paper}"/>` +
    `<polyline points="21.5,41.5 32,32 42.5,41.5" fill="none" stroke="${COLORS.copper}" stroke-width="6.2" stroke-linejoin="miter" stroke-miterlimit="10" stroke-linecap="butt"/>`
  );
}

export const faviconSvg = (o = {}, size = 64) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}" width="${size}" height="${size}">${faviconSvgInner(o)}</svg>`;
