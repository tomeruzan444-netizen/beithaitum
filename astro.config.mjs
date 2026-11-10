// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// אתר סטטי לחלוטין (SSG). כתובת האתר נקבעת ב-SITE_URL; ברירת המחדל היא הדומיין הזמני בהוסטינגר.
const site = process.env.SITE_URL || 'https://orangered-goshawk-401694.hostingersite.com';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: (p) => !p.includes('/search/') })],
  compressHTML: true,
});
