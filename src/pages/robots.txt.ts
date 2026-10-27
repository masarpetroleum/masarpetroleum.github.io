import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
	new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`, {
		headers: { 'Content-Type': 'text/plain' },
	});
