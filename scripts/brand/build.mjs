// מייצר את קבצי המותג: SVG לסימן, ו-PNG ללוגו המלא (עם הפונט Assistant) דרך Chrome headless.
// שימוש: node scripts/brand/build.mjs <path-to-playwright-core>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { markSvg, markSvgInner, faviconSvg, faviconSvgInner, MARK_VIEWBOX, COLORS } from './mark.mjs';

const OUT = 'public/brand';
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'logo-mark.svg'), markSvg({}, 256));
fs.writeFileSync(path.join(OUT, 'logo-mark-dark.svg'), markSvg({ onDark: true }, 256));
fs.writeFileSync('public/favicon.svg', faviconSvg({ rounded: true }));

// פונט מוטמע (base64) כדי שהצילום ישתמש ב-Assistant בדיוק כמו האתר
const fontFile = 'node_modules/@fontsource-variable/assistant/files/assistant-hebrew-wght-normal.woff2';
const font = fs.readFileSync(fontFile).toString('base64');

const page = (body, bg = 'transparent') => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>
@font-face { font-family: A; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 200 800; }
html,body { margin:0; background:${bg}; }
.lockup { display:inline-flex; align-items:center; gap:26px; padding:28px 32px; font-family:A; }
.lockup svg { height:96px; width:96px; display:block; }
.div { width:1.5px; height:84px; }
.t { display:flex; flex-direction:column; }
.n { font-weight:700; font-size:74px; line-height:.92; letter-spacing:-.015em; }
.s { font-weight:500; font-size:21px; letter-spacing:.08em; margin-top:14px; }
</style></head><body>${body}</body></html>`;

const lockup = (dark) => `<div class="lockup" id="x">
  <svg viewBox="${MARK_VIEWBOX}">${markSvgInner({ onDark: dark })}</svg>
  <span class="div" style="background:${dark ? 'rgba(248,247,242,.25)' : 'rgba(21,24,29,.18)'}"></span>
  <div class="t"><span class="n" style="color:${dark ? COLORS.paper : COLORS.ink}">בית האיטום</span>
  <span class="s" style="color:${dark ? '#B9BDC3' : COLORS.grey}">שכבה אחרי שכבה</span></div></div>`;

const icon = (size) => `<div id="x" style="width:${size}px;height:${size}px"><svg viewBox="${MARK_VIEWBOX}" style="width:${size}px;height:${size}px;display:block">${markSvgInner({})}</svg></div>`;

const fav = (size) => `<div id="x" style="width:${size}px;height:${size}px"><svg viewBox="${MARK_VIEWBOX}" style="width:${size}px;height:${size}px;display:block">${faviconSvgInner({})}</svg></div>`;

const og = `<div id="x" style="width:1200px;height:630px;background:${COLORS.paper};position:relative;font-family:A;overflow:hidden">
  <div style="position:absolute;top:0;right:0;width:14px;height:630px;background:${COLORS.copper}"></div>
  <div style="position:absolute;top:96px;right:84px">${lockup(false).replace('id="x"', '')}</div>
  <div style="position:absolute;top:330px;right:116px;font-weight:700;font-size:58px;line-height:1.15;color:${COLORS.ink};letter-spacing:-.015em">איטום גגות, קירות ומרפסות</div>
  <div style="position:absolute;top:410px;right:116px;font-weight:500;font-size:28px;color:${COLORS.grey}">אבחון, שיטות, מחירים ומדריכים מקצועיים</div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:10px;background:${COLORS.ink}"></div>
</div>`;

const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2]);
const b = await chromium.launch({ channel: 'chrome' });
async function shot(html, file, { scale = 1, bg = 'transparent' } = {}) {
  const p = await b.newPage({ deviceScaleFactor: scale, viewport: { width: 1400, height: 900 } });
  await p.setContent(page(html, bg));
  await p.evaluate(() => document.fonts.ready);
  const el = await p.$('#x');
  await el.screenshot({ path: path.join(OUT, file), omitBackground: bg === 'transparent' });
  await p.close();
  console.log('wrote', file);
}
await shot(lockup(false), 'logo.png', { scale: 2 });
await shot(lockup(true), 'logo-white.png', { scale: 2 });
await shot(lockup(false), 'logo-on-light.png', { scale: 2, bg: COLORS.paper });
await shot(icon(512), 'logo-mark.png');
// אייקונים לדפדפן, לגוגל (כפולות של 48) ולמסך הבית - כולם מהפאביקון המודגש
await shot(fav(180), 'apple-touch-icon.png');
await shot(fav(512), 'icon-512.png');
await shot(fav(192), 'icon-192.png');
await shot(fav(96), 'favicon-96.png');
await shot(fav(48), 'favicon-48.png');
await shot(fav(32), 'favicon-32.png');
await shot(fav(16), 'favicon-16.png');
await shot(og, 'og-default.png');
await b.close();

// favicon.ico בשורש (גוגל ודפדפנים ישנים בודקים אותו) - ICO עם PNG מוטמעים 16/32/48
const icoSizes = [16, 32, 48];
const pngs = icoSizes.map((s) => fs.readFileSync(path.join(OUT, `favicon-${s}.png`)));
const head = Buffer.alloc(6 + 16 * pngs.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
let off = head.length;
pngs.forEach((png, i) => {
  const e = 6 + 16 * i, s = icoSizes[i];
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(png.length, e + 8); head.writeUInt32LE(off, e + 12);
  off += png.length;
});
fs.writeFileSync('public/favicon.ico', Buffer.concat([head, ...pngs]));
for (const s of [16, 48]) fs.unlinkSync(path.join(OUT, `favicon-${s}.png`));
console.log('wrote favicon.ico');
