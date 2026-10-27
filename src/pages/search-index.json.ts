import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getAllSummaries } from '../lib/content';

const strip = (html: string) =>
	html
		.replace(/<[^>]+>/g, ' ')
		.replace(/&[a-z]+;|&#\d+;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

export const GET: APIRoute = async () => {
	const bodies = new Map<number, string>();
	for (const name of ['articles', 'events', 'careers', 'team', 'pages'] as const) {
		for (const entry of await getCollection(name)) {
			if (entry.data.legacyId !== undefined) bodies.set(entry.data.legacyId, strip(entry.body ?? ''));
		}
	}
	const items = (await getAllSummaries()).map((s) => ({ ...s, text: s.legacyId !== undefined ? (bodies.get(s.legacyId) ?? '') : '' }));
	return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
};
