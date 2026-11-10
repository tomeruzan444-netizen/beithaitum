// מייצר את קבצי המותג: SVG לסימן, ו-PNG ללוגו המלא (עם הפונט Assistant) דרך Chrome headless.
// שימוש: node scripts/brand/build.mjs <path-to-playwright-core>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { markSvg, markSvgInner, MARK_VIEWBOX, COLORS } from './mark.mjs';

const OUT = 'public/brand';
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'logo-mark.svg'), markSvg({}, 256));
fs.writeFileSync(path.join(OUT, 'logo-mark-dark.svg'), markSvg({ onDark: true }, 256));

// פונט מוטמע (base64) כדי שהצילום ישתמש ב-Assistant בדיוק כמו האתר
const fontFile = 'node_modules/@fontsource-variable/assistant/files/assistant-hebrew-wght-normal.woff2';
const font = fs.readFileSync(fontFile).toString('base64');

const page = (body, bg = 'transparent') => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>
@font-face { font-family: A; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 200 800; }
html,body { margin:0; background:${bg}; }
.lockup { display:inline-flex; align-items:center; gap:22px; padding:24px 28px; font-family:A; }
.lockup svg { height:118px; width:auto; display:block; }
.t { display:flex; flex-direction:column; }
.n { font-weight:800; font-size:78px; line-height:.95; letter-spacing:-.02em; }
.s { display:flex; align-items:center; gap:10px; font-weight:600; font-size:23px; letter-spacing:.06em; margin-top:12px; }
.s i { display:block; width:34px; height:4px; background:${COLORS.copper}; }
</style></head><body>${body}</body></html>`;

const lockup = (dark) => `<div class="lockup" id="x">
  <svg viewBox="${MARK_VIEWBOX}">${markSvgInner({ onDark: dark })}</svg>
  <div class="t"><span class="n" style="color:${dark ? COLORS.paper : COLORS.ink}">בית האיטום</span>
  <span class="s" style="color:${dark ? '#B9BDC3' : '#5C626A'}"><i></i>שכבה אחרי שכבה</span></div></div>`;

const icon = (bg, size, pad) => `<div id="x" style="width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg};border-radius:${Math.round(size * 0.18)}px">
  <svg viewBox="${MARK_VIEWBOX}" style="height:${size - pad * 2}px;width:auto">${markSvgInner({})}</svg></div>`;

const og = `<div id="x" style="width:1200px;height:630px;background:${COLORS.mist};position:relative;font-family:A;overflow:hidden">
  <div style="position:absolute;inset:0;clip-path:polygon(0 78%,100% 62%,100% 100%,0 100%);background:${COLORS.paper}"></div>
  <div style="position:absolute;top:70px;right:80px">${lockup(false).replace('id="x"', '')}</div>
  <div style="position:absolute;top:300px;right:108px;font-weight:800;font-size:64px;line-height:1.05;color:${COLORS.ink};letter-spacing:-.02em">איטום גגות, קירות ומרפסות<br><span style="color:${COLORS.copper}">שכבה אחרי שכבה.</span></div>
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
await shot(`<div id="x" style="width:512px;height:512px;display:grid;place-items:center"><svg viewBox="${MARK_VIEWBOX}" style="height:460px;width:auto">${markSvgInner({})}</svg></div>`, 'logo-mark.png');
await shot(icon(COLORS.mist, 180, 20), 'apple-touch-icon.png');
await shot(icon(COLORS.mist, 512, 50), 'icon-512.png');
await shot(icon(COLORS.mist, 192, 20), 'icon-192.png');
await shot(og, 'og-default.png');
await b.close();
