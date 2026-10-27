import { getCollection, type CollectionEntry } from 'astro:content';

export type Section = 'articles' | 'events' | 'careers' | 'team' | 'pages';

/** A flattened view of any entry, used for cards, search and legacy-id lookups. */
export interface EntrySummary {
	section: Section;
	legacyId?: number;
	title: string;
	subtitle?: string;
	excerpt: string;
	image?: string;
	url: string;
}

const PAGE_URLS: Record<string, string> = { company: '/company/', operations: '/operations/' };

export const byOrder = <T extends { data: { order: number } }>(a: T, b: T) => a.data.order - b.data.order;

export async function getArticles() {
	return (await getCollection('articles')).sort(byOrder);
}
export async function getEvents() {
	return (await getCollection('events')).sort(byOrder);
}
export async function getCareers() {
	return (await getCollection('careers')).sort(byOrder);
}
export async function getTeam() {
	return (await getCollection('team')).sort(byOrder);
}

export async function getAllSummaries(): Promise<EntrySummary[]> {
	const summarize = <S extends Exclude<Section, 'team' | 'pages' | 'careers'>>(section: S, e: CollectionEntry<S>): EntrySummary => ({
		section,
		legacyId: e.data.legacyId,
		title: e.data.title,
		subtitle: e.data.subtitle,
		excerpt: e.data.excerpt,
		image: e.data.image,
		url: `/${section}/${e.id}/`,
	});
	const [articles, events, careers, team, pages] = await Promise.all([
		getArticles(),
		getEvents(),
		getCareers(),
		getTeam(),
		getCollection('pages'),
	]);
	return [
		...pages.map((e) => ({
			section: 'pages' as const,
			legacyId: e.data.legacyId,
			title: e.data.title,
			excerpt: e.data.excerpt,
			image: e.data.image,
			url: PAGE_URLS[e.id] ?? `/${e.id}/`,
		})),
		...events.map((e) => summarize('events', e)),
		...articles.map((e) => summarize('articles', e)),
		...careers.map((e) => ({
			section: 'careers' as const,
			legacyId: e.data.legacyId,
			title: e.data.title,
			subtitle: e.data.status,
			excerpt: e.data.excerpt,
			image: e.data.image,
			url: `/careers/${e.id}/`,
		})),
		...team.map((e) => ({
			section: 'team' as const,
			legacyId: e.data.legacyId,
			title: e.data.name,
			subtitle: e.data.role,
			excerpt: e.data.excerpt,
			image: e.data.image,
			url: `/team/${e.id}/`,
		})),
	];
}

export async function getByLegacyId() {
	const map = new Map<number, EntrySummary>();
	for (const s of await getAllSummaries()) if (s.legacyId !== undefined) map.set(s.legacyId, s);
	return map;
}

/** Resolve "Related topics" groups to linkable entries. */
export async function resolveRelated(groups: Array<{ topic: string; ids: number[] }>) {
	const map = await getByLegacyId();
	return groups
		.map((g) => ({ topic: g.topic, items: g.ids.map((id) => map.get(id)).filter((x): x is EntrySummary => !!x) }))
		.filter((g) => g.items.length);
}
