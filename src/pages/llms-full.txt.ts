import type { APIRoute } from 'astro';
import { allPages, urlOf } from '../lib/pages';
import { business } from '../config/business';

// llms-full.txt - כל התוכן באתר כטקסט אחד, למנועי AI. נבנה אוטומטית מהתוכן.
export const GET: APIRoute = async ({ site }) => {
  const abs = (u: string) => new URL(u, site).href;
  const out: string[] = [`# ${business.name}`, '', `> ${business.name} - ${business.teamLine}. איטום גגות, קירות, מרפסות, חדרים רטובים ומבנים בישראל.`, ''];
  const pages = (await allPages()).filter((p) => p.data.type !== 'reference' || p.id === 'glossary');
  for (const p of pages) {
    const d = p.data;
    const body = (p.body ?? '')
      .replace(/\]\((\/[^)]*)\)/g, (_m, u) => `](${abs(u)})`)
      .trim();
    out.push('---', '', `# ${d.title}`, '', `כתובת: ${abs(urlOf(p))}`, `עודכן: ${d.updated}`, '', d.summary, '', body, '');
    if (d.faq?.length) {
      out.push('## שאלות נפוצות', '');
      for (const f of d.faq) out.push(`### ${f.q}`, '', f.a, '');
    }
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
