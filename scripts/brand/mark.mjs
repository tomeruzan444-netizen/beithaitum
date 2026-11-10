// סימן הלוגו של בית האיטום: ערימה איזומטרית של 4 שכבות (גמר, יריעה, פריימר, בטון) עם טיפה שנעצרת על השכבה העליונה.
// מקור אמת אחד לגיאומטריה - משמש ליצירת public/brand/*.svg ו-PNG.
const P = (x, y, z) => [(x - y) * 0.866, (x + y) * 0.5 - z];
const f = (p) => p.map((n) => n.toFixed(2)).join(',');
function box(x, y, z, w, d, h) {
  const t = z + h;
  return {
    top: [[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]].map((a) => f(P(...a))).join(' '),
    left: [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]].map((a) => f(P(...a))).join(' '),
    right: [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t]].map((a) => f(P(...a))).join(' '),
  };
}

export const COLORS = { ink: '#15181D', copper: '#A65A2E', paper: '#F8F7F2', mist: '#E4E8EF' };

/** @param {{ onDark?: boolean }} o */
export function markSvgInner(o = {}) {
  const S = 40; // צלע הריבוע
  const layers = [
    { z: 0, h: 12, top: '#D9D3C7', left: '#BDB5A6', right: '#A39A8A' },          // בטון ושיפועים
    { z: 15, h: 3.5, top: '#C7784A', left: '#A65A2E', right: '#8F4B24' },         // פריימר
    { z: 21.5, h: 5, top: '#2B3038', left: '#1D2127', right: '#15181D' },         // יריעת איטום
    { z: 29.5, h: 3.5, top: o.onDark ? '#F8F7F2' : '#F3F0E8', left: '#DCD6CA', right: '#CFC8BA' }, // שכבת גמר
  ];
  const parts = layers.map((l) => {
    const b = box(0, 0, l.z, S, S, l.h);
    return `<polygon points="${b.left}" fill="${l.left}"/><polygon points="${b.right}" fill="${l.right}"/><polygon points="${b.top}" fill="${l.top}"/>`;
  });
  // מתאר דק לשכבת הגמר על רקע בהיר
  const top = box(0, 0, 29.5, S, S, 3.5).top;
  const outline = o.onDark ? '' : `<polygon points="${top}" fill="none" stroke="#15181D" stroke-opacity=".18" stroke-width=".6"/>`;
  // טיפה מתעגלת על השכבה העליונה (beading) - מים שלא חודרים
  const [cx, cy] = P(S * 0.5, S * 0.5, 33);
  const drop = `<ellipse cx="${(cx).toFixed(2)}" cy="${(cy + 0.6).toFixed(2)}" rx="5.2" ry="2.1" fill="#15181D" opacity=".12"/>` +
    `<path d="M${cx.toFixed(2)} ${(cy - 11).toFixed(2)} C ${(cx + 1.6).toFixed(2)} ${(cy - 7.2).toFixed(2)}, ${(cx + 4.4).toFixed(2)} ${(cy - 4.6).toFixed(2)}, ${(cx + 4.4).toFixed(2)} ${(cy - 2.2).toFixed(2)} A 4.4 4.4 0 0 1 ${(cx - 4.4).toFixed(2)} ${(cy - 2.2).toFixed(2)} C ${(cx - 4.4).toFixed(2)} ${(cy - 4.6).toFixed(2)}, ${(cx - 1.6).toFixed(2)} ${(cy - 7.2).toFixed(2)}, ${cx.toFixed(2)} ${(cy - 11).toFixed(2)} Z" fill="#7FA3BF"/>` +
    `<path d="M${(cx - 1.9).toFixed(2)} ${(cy - 4.2).toFixed(2)} q .4 -1.6 1.4 -2.6" stroke="#fff" stroke-opacity=".75" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
  return parts.join('') + outline + drop;
}

// גבולות: x בין -34.6 ל-34.6, y בין -44 (טיפה) ל-40
export const MARK_VIEWBOX = '-36 -46 72 88';
export const markSvg = (o = {}, size = 512) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}" width="${Math.round(size * 72 / 88)}" height="${size}">${markSvgInner(o)}</svg>`;
