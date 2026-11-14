import type { APIRoute } from 'astro';
import { langFromParam, langPaths } from '../../i18n';
import { getAllSummaries } from '../../lib/content';

export const getStaticPaths = langPaths;

// One index per language: /search-index.json and /ar/search-index.json.
export const GET: APIRoute = async ({ params }) => {
	const items = (await getAllSummaries(langFromParam(params.lang))).map(({ body, tagKeys, legacyId, featured, ...item }) => ({
		...item,
		text: `${body} ${item.tags.join(' ')}`.toLowerCase(),
	}));
	return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};
