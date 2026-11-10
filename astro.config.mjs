// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// אתר סטטי לחלוטין (SSG). כתובת האתר נקבעת ב-SITE_URL; ברירת המחדל היא הדומיין האמיתי.
const site = process.env.SITE_URL || 'https://itumhouse.co.il';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: (p) => !p.includes('/search/') && !p.includes('/thanks/') })],
  compressHTML: true,
});
