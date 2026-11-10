// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// תאריך עדכון לכל עמוד (lastmod במפת האתר), מתוך שדה updated בתוכן
const lastmod = {};
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.md')) {
      const m = readFileSync(p, 'utf8').match(/^updated:\s*['"]?(\d{4}-\d{2}-\d{2})/m);
      const slug = p.replace(/^src\/content\/pages\/?/, '').replace(/\.md$/, '').replace(/(^|\/)index$/, '');
      if (m) lastmod['/' + (slug ? slug + '/' : '')] = m[1];
    }
  }
};
walk('src/content/pages');

// אתר סטטי לחלוטין (SSG). כתובת האתר נקבעת ב-SITE_URL; ברירת המחדל היא הדומיין האמיתי.
const site = process.env.SITE_URL || 'https://itumhouse.co.il';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [sitemap({
    filter: (p) => !p.includes('/search/') && !p.includes('/thanks/'),
    serialize: (item) => {
      const d = lastmod[new URL(item.url).pathname];
      return d ? { ...item, lastmod: new Date(d).toISOString() } : item;
    },
  })],
  compressHTML: true,
});
