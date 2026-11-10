import type { APIRoute } from 'astro';
import { isTemporaryDomain } from '../config/business';

// דומיין זמני -> חוסם הכול. דומיין אמיתי -> פתוח לכל הבוטים הלגיטימיים, כולל בוטי חיפוש AI (build-spec סעיף 7).
const aiBots = ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'PerplexityBot', 'ClaudeBot', 'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended'];

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site).href;
  const body = isTemporaryDomain()
    ? `# דומיין זמני - לא לאינדקס\nUser-agent: *\nDisallow: /\n`
    : [
        'User-agent: *',
        'Allow: /',
        '',
        ...aiBots.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
        `Sitemap: ${sitemap}`,
        '',
      ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
