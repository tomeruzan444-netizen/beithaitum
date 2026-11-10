/** הטלה איזומטרית פשוטה לאיורי SVG. x ימינה-מטה, y שמאלה-מטה, z למעלה. */
export const P = (x: number, y: number, z: number): [number, number] => [(x - y) * 0.866, (x + y) * 0.5 - z];
const pts = (a: [number, number, number][]) => a.map(([x, y, z]) => P(x, y, z).map((n) => n.toFixed(1)).join(',')).join(' ');

/** קופסה: מחזיר מצולעים לפאה העליונה, השמאלית-קדמית והימנית-קדמית */
export function box(x: number, y: number, z: number, w: number, d: number, h: number) {
  const t = z + h;
  return {
    top: pts([[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]]),
    left: pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]]),
    right: pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t]]),
  };
}

/** מצולע כללי במישור עליון בגובה z */
export const flat = (z: number, a: [number, number][]) => pts(a.map(([x, y]) => [x, y, z]));

export const C = {
  top: '#ECE8DF', left: '#BDB5A6', right: '#A39A8A',
  dark: '#23272E', dark2: '#15181D', copper: '#A65A2E', copperL: '#C7784A',
  water: '#9DB4C6', white: '#F8F7F2', line: '#15181D', peach: '#E39A6B',
};
