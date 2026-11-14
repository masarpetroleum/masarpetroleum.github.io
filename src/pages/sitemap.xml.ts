import type { APIRoute } from 'astro';
import { DEFAULT_LANG, LOCALES, localizePath, stripLang } from '../i18n';
import { getAllSummaries } from '../lib/content';

const STATIC = ['/', '/about/', '/company/', '/team/', '/operations/', '/careers/', '/events/', '/articles/', '/news/', '/contact/'];

// Every page is listed once per language, each pointing at its translations.
export const GET: APIRoute = async ({ site }) => {
	const paths = new Set([...STATIC, ...(await getAllSummaries(DEFAULT_LANG)).map((s) => stripLang(s.url))]);
	const abs = (path: string, lang: (typeof LOCALES)[number]) => new URL(localizePath(path, lang), site).href;
	const urls = [...paths].flatMap((path) =>
		LOCALES.map(
			(lang) => `  <url>
    <loc>${abs(path, lang)}</loc>
${LOCALES.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(path, l)}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(path, DEFAULT_LANG)}"/>
  </url>`,
		),
	);
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
	return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
