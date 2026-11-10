import type { APIRoute } from 'astro';
import { allPages, urlOf, hubOf, childrenOf } from '../lib/pages';
import { silos } from '../data/silos';
import { business } from '../config/business';

// llms.txt - תיאור העסק ומפת התוכן למנועי AI (build-spec סעיף 7). נבנה אוטומטית מהתוכן.
export const GET: APIRoute = async ({ site }) => {
  const abs = (u: string) => new URL(u, site).href;
  const lines: string[] = [
    `# ${business.name}`,
    '',
    `> ${business.name} - ${business.teamLine}: איטום גגות, קירות, מרפסות, חדרים רטובים ומבנים, ואבחון רטיבות ונזילות בישראל. המדריכים באתר נכתבים ונבדקים על ידי הצוות, וטווחי המחירים מוצגים עם תאריך בדיקה.`,
    '',
  ];
  for (const s of silos) {
    const hub = await hubOf(s.id);
    if (!hub) continue;
    lines.push(`## ${s.name}`, '', `- [${hub.data.keyword}](${abs(urlOf(hub))}): ${hub.data.summary}`);
    for (const p of (await childrenOf(s.id)).filter((p) => p.data.type !== 'city')) {
      lines.push(`- [${p.data.keyword}](${abs(urlOf(p))}): ${p.data.summary}`);
    }
    lines.push('');
  }
  const cityPages = (await allPages()).filter((p) => p.data.type === 'city').sort((a, b) => a.data.order - b.data.order);
  if (cityPages.length) {
    lines.push('## עמודי ערים', '');
    for (const p of cityPages) lines.push(`- [${p.data.keyword}](${abs(urlOf(p))}): ${p.data.summary}`);
    lines.push('');
  }
  lines.push('## טקסט מלא', '', `- [כל התוכן באתר בקובץ אחד](${abs('/llms-full.txt')}): הטקסט המלא של כל המדריכים, כולל שאלות ותשובות.`, '');
  const refs = (await allPages()).filter((p) => p.data.type === 'reference');
  if (refs.length) {
    lines.push('## מידע נוסף', '');
    for (const p of refs) lines.push(`- [${p.data.keyword}](${abs(urlOf(p))}): ${p.data.summary}`);
    lines.push('');
  }
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
