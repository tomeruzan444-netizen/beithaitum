// אייקונים איזומטריים מפורטים (כרטיסים, סיידבר): כל אייקון הוא דגם קטן - שכבות, חומרים ופרטים.
// כל הגיאומטריה בתלת-ממד (x ימינה-מטה, y שמאלה-מטה, z למעלה), מוטלת ב-P ומצוירת לפי סדר הצייר.
import { P } from './iso';

export type IsoName = 'concrete' | 'membrane' | 'liquid' | 'tiles' | 'metal' | 'terrace' | 'leak' | 'wall' | 'gutter' | 'building';
export const ISO_NAMES: IsoName[] = ['concrete', 'membrane', 'liquid', 'tiles', 'metal', 'terrace', 'leak', 'wall', 'gutter', 'building'];

type V3 = [number, number, number];
type Pt = [number, number];
export interface Shape { d: string; fill?: string; stroke?: string; sw?: number; op?: number; cap?: 'round' | 'butt'; dash?: string }
interface Faces { top: string; left: string; right: string }

/** מספר קצר: ספרה אחת אחרי הנקודה, בלי אפסים מיותרים */
const f = (n: number) => String(Math.round(n * 10) / 10);

const HL = 'rgba(255,255,255,.55)';
const K = {
  ink: '#15181D', copper: '#A65A2E', copperL: '#B8683A', copperD: '#7E4220', copperDD: '#6E3818', copperS: '#94512A',
  water: '#9DB4C6', glass: '#A9C3D6', glassD: '#8FAAC0', frame: '#5C626A', dark: '#2E333A', dark2: '#23272E',
};
const WALL: Faces = { top: '#CFC9BD', left: '#D9D3C7', right: '#BFB8AA' };
const PARAPET: Faces = { top: '#F4F1EA', left: '#DDD7CB', right: '#C6BFB1' };
const HOUSE: Faces = { top: '#E5DED1', left: '#F1ECE2', right: '#D9D1C2' };
const PIPE: Faces = { top: K.copperDD, left: K.copperL, right: K.copperS };

class Ctx {
  shapes: Shape[] = [];
  pts: Pt[] = [];
  private path(p: Pt[], close: boolean) {
    this.pts.push(...p);
    return p.map((q, i) => `${i ? 'L' : 'M'}${f(q[0])} ${f(q[1])}`).join('') + (close ? 'Z' : '');
  }
  poly(a: V3[], fill: string, o: Partial<Shape> = {}) { this.shapes.push({ d: this.path(a.map((v) => P(...v)), true), fill, ...o }); }
  line(a: V3[], stroke: string, sw: number, o: Partial<Shape> = {}) { this.shapes.push({ d: this.path(a.map((v) => P(...v)), false), stroke, sw, ...o }); }
  /** קופסה: פאה שמאלית (y+d), ימנית (x+w), עליונה עם קו הדגשה */
  box(x: number, y: number, z: number, w: number, d: number, h: number, c: Faces, hl = true) {
    const t = z + h;
    this.poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]], c.left);
    this.poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t]], c.right);
    this.poly([[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]], c.top, hl ? { stroke: HL, sw: 0.3 } : {});
  }
  /** מלבן על מישור הפאה השמאלית y=Y */
  fy(Y: number, x0: number, x1: number, z0: number, z1: number, fill: string, o: Partial<Shape> = {}) {
    this.poly([[x0, Y, z0], [x1, Y, z0], [x1, Y, z1], [x0, Y, z1]], fill, o);
  }
  /** מלבן על מישור הפאה הימנית x=X */
  fx(X: number, y0: number, y1: number, z0: number, z1: number, fill: string, o: Partial<Shape> = {}) {
    this.poly([[X, y0, z0], [X, y1, z0], [X, y1, z1], [X, y0, z1]], fill, o);
  }
  /** מלבן אופקי בגובה z */
  fz(z: number, x0: number, x1: number, y0: number, y1: number, fill: string, o: Partial<Shape> = {}) {
    this.poly([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], fill, o);
  }
  curve(fn: (t: number) => V3, fill: string, o: Partial<Shape> = {}, n = 28) {
    this.poly(Array.from({ length: n }, (_, i) => fn((i / n) * Math.PI * 2)), fill, o);
  }
  /** עיגול במסך (לא על מישור) סביב נקודה תלת-ממדית */
  circ(c: V3, r: number, fill: string, o: Partial<Shape> = {}) {
    const [cx, cy] = P(...c);
    const p: Pt[] = Array.from({ length: 18 }, (_, i) => { const t = (i / 18) * Math.PI * 2; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; });
    this.shapes.push({ d: this.path(p, true), fill, ...o });
  }
  /** טיפת מים, חוד למעלה */
  drop(c: V3, s: number, fill = K.water) {
    const [cx, cy] = P(...c);
    const p: Pt[] = Array.from({ length: 20 }, (_, i) => { const t = (i / 20) * Math.PI * 2; return [cx + s * 0.85 * Math.sin(t) * Math.sin(t / 2), cy - s * Math.cos(t)]; });
    this.shapes.push({ d: this.path(p, true), fill });
  }
  shadow(x0: number, y0: number, x1: number, y1: number) { this.fz(0, x0 - 1, x1 + 2, y0 - 1, y1 + 2, '#000', { op: 0.12 }); }
}

/** גוש גג שטוח עם מעקות - בסיס לגג בטון ולפוליאוריתן */
function flatRoofBase(c: Ctx) {
  c.shadow(0, 0, 40, 28);
  c.box(0, 0, 0, 40, 28, 9, WALL, false);
  c.fy(28, 0, 40, 7.6, 9, '#C9C2B5');
  c.fx(40, 0, 28, 7.6, 9, '#ADA597');
  c.box(0, 0, 9, 40, 2, 3.5, PARAPET);
  c.box(0, 0, 9, 2, 28, 3.5, PARAPET);
}
const frontParapets = (c: Ctx) => { c.box(38, 0, 9, 2, 26, 3.5, PARAPET); c.box(0, 26, 9, 40, 2, 3.5, PARAPET); };

function windowY(c: Ctx, Y: number, x0: number, x1: number, z0: number, z1: number, glass = K.glass) {
  c.fy(Y, x0, x1, z0, z1, glass, { stroke: K.frame, sw: 0.45 });
  c.line([[x0 + 0.6, Y, z1 - 0.8], [x0 + (x1 - x0) * 0.45, Y, z0 + 0.8]], 'rgba(255,255,255,.6)', 0.4);
}
function windowX(c: Ctx, X: number, y0: number, y1: number, z0: number, z1: number, glass = K.glassD) {
  c.fx(X, y0, y1, z0, z1, glass, { stroke: K.frame, sw: 0.45 });
}

const draw: Record<IsoName, (c: Ctx) => void> = {
  // גג בטון: חתך שכבות פינתי - בטון, שכבת איטום בנחושת, ציפוי גמר לבן. ניקוז ומעקות.
  concrete(c) {
    flatRoofBase(c);
    c.fz(9, 2, 38, 2, 26, '#B9B2A4');
    c.poly([[2, 2, 9.7], [31, 2, 9.7], [31, 7, 9.7], [38, 7, 9.7], [38, 26, 9.7], [2, 26, 9.7]], K.copperL);
    c.fx(31, 2, 7, 9, 9.7, K.copperS);
    c.fy(7, 31, 38, 9, 9.7, K.copper);
    c.poly([[2, 2, 10.6], [24, 2, 10.6], [24, 12, 10.6], [38, 12, 10.6], [38, 26, 10.6], [2, 26, 10.6]], '#F2EFE8');
    c.fx(24, 2, 12, 9.7, 10.6, '#D3CDC1');
    c.fy(12, 24, 38, 9.7, 10.6, '#E2DDD2');
    c.curve((t) => [8 + 2.4 * Math.cos(t), 19 + 2.4 * Math.sin(t), 10.62], '#8E959D');
    c.curve((t) => [8 + 1.4 * Math.cos(t), 19 + 1.4 * Math.sin(t), 10.64], K.dark2);
    frontParapets(c);
  },
  // יריעות ביטומניות: גג מכוסה ברצועות עם חפיפות, היריעה יורדת על השוליים, וגליל פתוח.
  membrane(c) {
    c.shadow(0, 0, 40, 28);
    c.box(0, 0, 0, 40, 28, 9, WALL, false);
    c.fz(9, 0, 40, 0, 28, K.dark);
    c.fz(9.01, 0, 40, 9.3, 18.6, '#363B43');
    for (const y of [9.3, 18.6]) c.line([[0, y, 9.02], [40, y, 9.02]], '#4E545D', 0.8);
    c.fy(28, 0, 40, 7.3, 9, '#2A2E35');
    c.fx(40, 0, 28, 7.3, 9, '#1F2329');
    c.line([[6, 23, 11.4], [28, 23, 11.4]], '#1C1F24', 5.8, { cap: 'butt' });
    c.line([[6, 21.9, 13.4], [28, 21.9, 13.4]], '#4E545D', 0.7);
    c.curve((t) => [28, 23 + 2.4 * Math.cos(t), 11.4 + 2.4 * Math.sin(t)], '#3D434C');
    c.curve((t) => [28.01, 23 + 1.6 * Math.cos(t), 11.4 + 1.6 * Math.sin(t)], 'none', { stroke: '#262A30', sw: 0.4 });
    c.curve((t) => [28.02, 23 + 0.8 * Math.cos(t), 11.4 + 0.8 * Math.sin(t)], '#1C1F24');
  },
  // פוליאוריתן: חצי גג כבר מצופה (מבריק), חצי בטון חשוף, ורולר באמצע העבודה.
  liquid(c) {
    flatRoofBase(c);
    c.fz(9.05, 2, 38, 2, 26, '#BDB6A8');
    c.fz(9.4, 2, 25, 2, 26, '#CFDCE5');
    c.poly([[5, 4, 9.42], [8.5, 4, 9.42], [18, 24, 9.42], [14.5, 24, 9.42]], '#FFFFFF', { op: 0.4 });
    c.line([[25, 2, 9.42], [25, 26, 9.42]], '#AFC2D0', 0.8);
    frontParapets(c);
    c.line([[26.5, 9, 11.1], [26.5, 19, 11.1]], '#CFDCE5', 4.2, { cap: 'butt' });
    c.curve((t) => [26.5 + 1.7 * Math.cos(t), 19, 11.1 + 1.7 * Math.sin(t)], '#E8EEF2', { stroke: '#9FB3C2', sw: 0.3 });
    c.curve((t) => [26.5 + 0.5 * Math.cos(t), 19.01, 11.1 + 0.5 * Math.sin(t)], K.frame);
    c.line([[26.5, 19, 11.1], [26.5, 20.8, 11.1], [29.5, 20.8, 17], [32.5, 19.2, 22.5]], K.dark2, 0.9);
    c.line([[32.5, 19.2, 22.5], [34.3, 18.2, 26]], K.copper, 2.2, { cap: 'round' });
  },
  // גג רעפים: בית עם גמלון, שורות רעפים, רכס, ארובה, חלונות ודלת.
  tiles(c) {
    c.shadow(2, 2, 36, 28);
    c.box(4, 4, 0, 30, 22, 13, HOUSE, false);
    windowY(c, 26, 7.5, 12, 4.5, 9.5);
    c.fy(26, 17.5, 21.5, 0, 9, K.copperD, { stroke: '#5C2F16', sw: 0.4 });
    windowY(c, 26, 26, 30.5, 4.5, 9.5);
    windowX(c, 34, 9, 13, 4.5, 9.5);
    windowX(c, 34, 17, 21, 4.5, 9.5);
    c.poly([[34, 4, 13], [34, 26, 13], [34, 15, 23.2]], HOUSE.right);
    const y = (t: number) => 28 - 13 * t, z = (t: number) => 12.2 + 11.8 * t;
    c.poly([[2, 2, 12.2], [36, 2, 12.2], [36, 15, 24], [2, 15, 24]], K.copperS);
    c.poly([[36, 15, 23.2], [36, 2, 11.4], [36, 2, 12.2], [36, 15, 24]], K.copperDD);
    const rows = 6;
    for (let k = 0; k < rows; k++) {
      const a = k / rows, b = (k + 1) / rows;
      c.poly([[2, y(a), z(a)], [36, y(a), z(a)], [36, y(b), z(b)], [2, y(b), z(b)]], k % 2 ? '#B0602F' : K.copper);
      if (k) c.line([[2, y(a), z(a)], [36, y(a), z(a)]], K.copperD, 0.6);
      for (let j = 1; j < 10; j++) {
        const x = 2 + 3.4 * j - (k % 2 ? 1.7 : 0);
        c.line([[x, y(a), z(a)], [x, y(b), z(b)]], K.copperD, 0.3, { op: 0.6 });
      }
    }
    c.fy(28, 2, 36, 11.4, 12.2, K.copperD);
    c.poly([[36, 28, 11.4], [36, 15, 23.2], [36, 15, 24], [36, 28, 12.2]], K.copperDD);
    c.line([[1.5, 15, 24.4], [36.5, 15, 24.4]], K.copperDD, 1.8, { cap: 'butt' });
    c.box(9, 17.5, 19, 3.6, 3, 8.5, { top: '#3A3F47', left: '#E8E1D4', right: '#CFC6B6' });
  },
  // איסכורית ופנלים: מחסן מפנלים, גג פח גלי עם פרופיל בקצה, ברגים ודלת גלילה.
  metal(c) {
    c.shadow(0, 0, 40, 28);
    c.box(2, 2, 0, 36, 24, 9, { top: '#C9CDD2', left: '#DDE0E3', right: '#BEC3C9' }, false);
    for (let j = 1; j < 8; j++) c.line([[2 + 4.5 * j, 26, 0], [2 + 4.5 * j, 26, 9]], '#C4C9CF', 0.35);
    for (let j = 1; j < 5; j++) c.line([[38, 2 + 4.8 * j, 0], [38, 2 + 4.8 * j, 9]], '#A9AFB6', 0.35);
    c.fy(26, 14, 24, 0, 7, '#B4BAC1');
    for (let z = 1; z < 7; z++) c.line([[14, 26, z], [24, 26, z]], '#9EA4AB', 0.3);
    for (let j = 0; j < 20; j++) c.fz(9.4, j * 2, j * 2 + 2, 0, 28, j % 2 ? '#E4E7EA' : '#BCC1C7');
    const zig: V3[] = Array.from({ length: 21 }, (_, j) => [j * 2, 28, 9.4 + (j % 2 ? 0.9 : 0)]);
    c.poly([[0, 28, 8.8], ...zig, [40, 28, 8.8]], '#9EA4AB');
    c.fx(40, 0, 28, 8.8, 9.4, '#8E959D');
    for (let j = 1; j < 20; j += 2) for (const y of [4, 14, 24]) c.circ([j * 2 + 1, y, 9.4], 0.35, K.frame);
  },
  // מרפסת: ריצוף, מעקה זכוכית, ניקוז, עציץ, וקיר הבית עם דלת הזזה.
  terrace(c) {
    c.shadow(0, -3, 40, 28);
    c.box(0, -3, 0, 40, 3, 22, { top: '#D9D3C7', left: '#EDE8DE', right: '#D6CFC1' });
    c.fy(0, 6, 20, 6, 19, K.glass, { stroke: K.frame, sw: 0.5 });
    c.line([[13, 0, 6], [13, 0, 19]], K.frame, 0.5);
    c.line([[7.5, 0, 17], [11, 0, 8]], 'rgba(255,255,255,.6)', 0.5);
    windowY(c, 0, 26, 34, 11, 17);
    c.box(0, 0, 0, 40, 28, 6, { top: '#E7DDCB', left: '#D3CABA', right: '#BDB3A2' }, false);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) c.fz(6.01, i * 8, i * 8 + 8, j * 7, j * 7 + 7, '#DFD2BC');
    for (let i = 1; i < 5; i++) c.line([[i * 8, 0, 6.02], [i * 8, 28, 6.02]], '#C8BAA0', 0.35);
    for (let j = 1; j < 4; j++) c.line([[0, j * 7, 6.02], [40, j * 7, 6.02]], '#C8BAA0', 0.35);
    c.fz(6.03, 17, 23, 22.5, 24.5, '#8E959D');
    for (const x of [18.5, 20, 21.5]) c.line([[x, 22.5, 6.04], [x, 24.5, 6.04]], K.dark2, 0.3);
    c.box(31, 3, 6, 5, 5, 5, { top: '#5A3A22', left: K.copperL, right: K.copperS });
    c.circ([32.5, 6, 12], 2.6, '#7F9C6C');
    c.circ([35, 4.5, 12.4], 2.4, '#5F7A51');
    c.circ([33.6, 5.4, 13.6], 2.8, '#6E8B5E');
    c.poly([[40, 0, 6], [40, 28, 6], [40, 28, 13], [40, 0, 13]], '#BFD6E6', { op: 0.35 });
    c.poly([[0, 28, 6], [40, 28, 6], [40, 28, 13], [0, 28, 13]], '#BFD6E6', { op: 0.35 });
    for (const x of [10, 20, 30]) c.line([[x, 28, 6], [x, 28, 13]], '#8FB0C8', 0.35);
    for (const y of [9.3, 18.6]) c.line([[40, y, 6], [40, y, 13]], '#8FB0C8', 0.35);
    c.line([[0, 28, 6.4], [40, 28, 6.4], [40, 0, 6.4]], '#8E959D', 0.6);
    c.line([[0, 28, 13.4], [40, 28, 13.4], [40, 0, 13.4]], K.frame, 1);
  },
  // איתור נזילות: פינת חדר, כתם רטיבות מסומן בקיר, טפטוף, שלולית ומד לחות על הרצפה.
  leak(c) {
    c.shadow(-2, -2, 40, 28);
    c.box(-2, -2, -2.5, 42, 30, 2.5, { top: '#E3DACA', left: '#CFC6B5', right: '#B8AE9C' }, false);
    for (let i = 1; i < 6; i++) c.line([[i * 7, 0, 0.01], [i * 7, 28, 0.01]], '#D2C7B4', 0.35);
    for (let j = 1; j < 4; j++) c.line([[0, j * 7, 0.01], [40, j * 7, 0.01]], '#D2C7B4', 0.35);
    c.box(-2, -2, 0, 2, 30, 26, { top: '#C9C2B5', left: '#D8D1C4', right: '#E7E1D6' });
    c.box(0, -2, 0, 40, 2, 26, { top: '#C9C2B5', left: '#EEE9DF', right: '#D6CFC1' });
    const blob = (s: number) => (t: number): V3 => {
      const f = 1 + 0.12 * Math.sin(3 * t) + 0.08 * Math.cos(5 * t);
      return [0.02, 12 + 7.5 * s * Math.cos(t) * f, 16 + 5.5 * s * Math.sin(t) * f];
    };
    c.curve(blob(1), '#B08A55', { op: 0.3 });
    c.curve(blob(0.6), '#B08A55', { op: 0.35 });
    c.curve(blob(0.28), '#8C6A3E', { op: 0.35 });
    c.line([[0.02, 9.5, 11.2], [0.02, 9.5, 6.5]], '#B08A55', 0.9, { op: 0.4, cap: 'round' });
    c.line([[0.02, 14.5, 10.8], [0.02, 14.5, 8.2]], '#B08A55', 0.9, { op: 0.4, cap: 'round' });
    c.curve((t) => [0.03, 12 + 10 * Math.cos(t), 16 + 7.6 * Math.sin(t)], 'none', { stroke: K.copper, sw: 0.8, dash: '2 1.4' });
    c.curve((t) => [6 + 5 * Math.cos(t) * (1 + 0.1 * Math.sin(3 * t)), 16 + 3.4 * Math.sin(t), 0.02], K.water, { op: 0.8 });
    c.curve((t) => [5 + 1.8 * Math.cos(t), 15 + 1 * Math.sin(t), 0.03], '#FFFFFF', { op: 0.45 });
    c.drop([1.5, 14.5, 5], 1.5);
    c.box(18, 16, 0, 6.5, 3.5, 1.6, { top: '#2B2F36', left: '#3A3F47', right: K.dark2 });
    c.fz(1.62, 19, 22.5, 16.7, 18.8, '#E39A6B');
    c.line([[24.5, 17.2, 0.8], [27.5, 17.2, 0.8]], '#8E959D', 0.45);
    c.line([[24.5, 18.4, 0.8], [27.5, 18.4, 0.8]], '#8E959D', 0.45);
  },
  // קיר חיצוני: חצי קיר עם רטיבות עולה בתחתית, חצי מצופה בחומר דוחה מים שהמים נאספים עליו בטיפות. גשם.
  wall(c) {
    c.shadow(4, 8, 36, 20);
    c.box(2, 6, -1.5, 36, 16, 1.5, { top: '#D6CEBF', left: '#C2B9A8', right: '#A99F8D' }, false);
    c.box(6, 10, 0, 28, 8, 27, { top: '#E2DCD0', left: '#EFE9DE', right: '#D6CFC1' });
    c.fy(18, 21, 34, 0, 27, '#DCE5EC');
    c.line([[21, 18, 0], [21, 18, 27]], '#B9CAD6', 0.6);
    c.poly([[6, 18, 0], [21, 18, 0], [21, 18, 5.2], [19, 18, 6.4], [16.5, 18, 5.4], [14, 18, 7], [11, 18, 5.8], [8.5, 18, 6.8], [6, 18, 5.6]], '#C9B994', { op: 0.6 });
    c.poly([[6, 18, 0], [21, 18, 0], [21, 18, 2.6], [17, 18, 3.4], [12, 18, 2.4], [6, 18, 3]], '#B8A47A', { op: 0.45 });
    windowY(c, 18, 10, 17, 13, 21);
    windowY(c, 18, 25, 31, 13, 21);
    for (const [x, z] of [[23, 5], [27, 9], [31.5, 4], [29, 24], [23.5, 24.5], [32.5, 11]] as [number, number][]) c.circ([x, 18.05, z], 0.6, K.water);
    c.box(5.4, 9.4, 27, 29.2, 9.2, 1.3, PARAPET);
    for (const [x, z] of [[12, 25], [18, 22], [24, 26], [30, 23], [15, 12], [27, 15], [33, 8]] as [number, number][]) {
      c.line([[x, 19.5, z], [x - 1.4, 19.5, z - 4]], K.water, 0.55, { cap: 'round' });
    }
  },
  // מרזבים: בית עם גג משופע, מרזב נחושת בשולי הגג, צינור יורד, ומים יוצאים ממנו.
  gutter(c) {
    const zr = (y: number) => 24 - y * 0.27;
    c.shadow(2, 0, 38, 30);
    c.box(4, 2, 0, 32, 22, 15, HOUSE, false);
    c.poly([[36, 2, 15], [36, 24, 15], [36, 24, zr(24)], [36, 2, zr(2)]], HOUSE.right);
    windowY(c, 24, 8, 14, 5, 11);
    windowY(c, 24, 19, 25, 5, 11);
    windowX(c, 36, 9, 15, 5, 11);
    c.poly([[2, -1, zr(-1)], [38, -1, zr(-1)], [38, 26, zr(26)], [2, 26, zr(26)]], '#3A3F47');
    for (let j = 1; j < 12; j++) c.line([[2 + 3 * j, -1, zr(-1) + 0.05], [2 + 3 * j, 26, zr(26) + 0.05]], '#4E545D', 0.5);
    c.fy(26, 2, 38, zr(26) - 0.9, zr(26), K.dark2);
    c.poly([[38, -1, zr(-1) - 0.9], [38, 26, zr(26) - 0.9], [38, 26, zr(26)], [38, -1, zr(-1)]], '#2A2E35');
    c.box(34.6, 26.6, 1.6, 2, 2, 13, PIPE, false);
    c.fy(28.6, 34.6, 36.6, 6, 6.6, K.copperD);
    c.fy(28.6, 34.6, 36.6, 11, 11.6, K.copperD);
    c.box(34.6, 26.6, 0.4, 2, 4.2, 1.6, PIPE, false);
    c.box(2, 26, 14.6, 36, 2.8, 2.2, PIPE, false);
    c.line([[2, 28.8, 16.8], [38, 28.8, 16.8]], '#D9895A', 0.5);
    c.curve((t) => [35.6 + 2.2 * Math.cos(t), 33.4 + 1.4 * Math.sin(t), 0.02], K.water, { op: 0.75 });
    c.drop([35.6, 31.4, 0.4], 1.1);
  },
  // מבנים: שני בניינים עם חלונות, גג עם שכבת איטום בנחושת, וגג יריעות עם מזגן.
  building(c) {
    c.shadow(2, 6, 38, 22);
    const T: Faces = { top: '#E2DCD0', left: '#EDE8DE', right: '#D3CCBE' };
    c.box(2, 6, 0, 18, 16, 30, T);
    c.fz(30.05, 3.2, 18.8, 7.2, 20.8, K.copper);
    for (const z of [4, 10, 16, 22]) {
      for (const x of [4.5, 9.5, 14.5]) c.fy(22, x, x + 3, z, z + 3.6, K.glass);
      for (const y of [8.5, 13, 17.5]) c.fx(20, y, y + 2.6, z, z + 3.6, K.glassD);
    }
    c.box(22, 6, 0, 16, 16, 20, T);
    c.fz(20.05, 23.2, 36.8, 7.2, 20.8, K.dark);
    for (const z of [3, 8.5, 14]) {
      for (const x of [24.5, 29, 33.5]) c.fy(22, x, x + 3, z, z + 3.6, K.glass);
      for (const y of [8.5, 13, 17.5]) c.fx(38, y, y + 2.6, z, z + 3.6, K.glassD);
    }
    c.box(28, 10, 20.05, 5, 4, 2.4, { top: '#E4E7EA', left: '#C9CDD2', right: '#AEB4BB' });
  },
};

/** מאחד צורות עוקבות עם אותו סגנון לנתיב אחד (סדר הציור נשמר) - פחות HTML */
function merge(shapes: Shape[]): Shape[] {
  const key = (s: Shape) => [s.fill, s.stroke, s.sw, s.op, s.cap, s.dash].join('|');
  const out: Shape[] = [];
  for (const s of shapes) {
    const last = out[out.length - 1];
    if (last && key(last) === key(s)) last.d += s.d;
    else out.push({ ...s });
  }
  return out;
}

const cache = new Map<IsoName, Shape[]>();
const allPts: Pt[] = [];
for (const n of ISO_NAMES) {
  const c = new Ctx();
  draw[n](c);
  cache.set(n, merge(c.shapes));
  allPts.push(...c.pts);
}
const PAD = 1.2;
const minX = Math.min(...allPts.map((p) => p[0])) - PAD, maxX = Math.max(...allPts.map((p) => p[0])) + PAD;
const minY = Math.min(...allPts.map((p) => p[1])) - PAD, maxY = Math.max(...allPts.map((p) => p[1])) + PAD;

/** viewBox משותף לכל האייקונים - אף אחד לא נחתך וכולם באותו קנה מידה */
export const ISO_VIEW = { vb: `${minX.toFixed(1)} ${minY.toFixed(1)} ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}`, ratio: (maxY - minY) / (maxX - minX) };
export const isoShapes = (n: IsoName) => cache.get(n) ?? [];
