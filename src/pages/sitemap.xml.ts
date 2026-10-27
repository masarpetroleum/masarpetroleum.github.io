import type { APIRoute } from 'astro';
import { getAllSummaries } from '../lib/content';

const STATIC = ['/', '/about/', '/company/', '/team/', '/operations/', '/careers/', '/events/', '/articles/', '/news/', '/contact/'];

export const GET: APIRoute = async ({ site }) => {
	const urls = new Set([...STATIC, ...(await getAllSummaries()).map((s) => s.url)]);
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls].map((u) => `  <url><loc>${new URL(u, site).href}</loc></url>`).join('\n')}
</urlset>`;
	return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
