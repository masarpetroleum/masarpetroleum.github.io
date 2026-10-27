import { getCollection } from 'astro:content';

export type Section = 'articles' | 'events' | 'careers' | 'team' | 'pages';

/** A flattened view of any entry, used for cards, search, related topics and legacy-id lookups. */
export interface EntrySummary {
	section: Section;
	legacyId?: number;
	title: string;
	subtitle?: string;
	excerpt: string;
	image?: string;
	url: string;
	tags: string[];
	featured?: number;
}

const PAGE_URLS: Record<string, string> = { company: '/company/', operations: '/operations/' };

/** Plain-text summary from an entry body, used when no `excerpt` is set. */
export function excerptFrom(html = '', length = 260) {
	const text = html
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&[a-z]+;|&#\d+;/gi, (m) => ({ '&amp;': '&', '&rsquo;': '’', '&lsquo;': '‘', '&quot;': '"' })[m] ?? ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return text.length <= length ? text : `${text.slice(0, length).replace(/\s+\S*$/, '')}…`;
}

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
	const [articles, events, careers, team, pages] = await Promise.all([
		getArticles(),
		getEvents(),
		getCareers(),
		getTeam(),
		getCollection('pages'),
	]);
	const story = (section: 'articles' | 'events') => (e: (typeof articles)[number] | (typeof events)[number]): EntrySummary => ({
		section,
		legacyId: e.data.legacyId,
		title: e.data.title,
		subtitle: e.data.subtitle,
		excerpt: e.data.excerpt || excerptFrom(e.body),
		image: e.data.image,
		url: `/${section}/${e.id}/`,
		tags: e.data.tags,
		featured: e.data.featured,
	});
	return [
		...pages.map((e) => ({
			section: 'pages' as const,
			legacyId: e.data.legacyId,
			title: e.data.title,
			excerpt: e.data.excerpt || excerptFrom(e.body),
			image: e.data.image ?? e.data.hero ?? e.data.gallery[0],
			url: PAGE_URLS[e.id] ?? `/${e.id}/`,
			tags: e.data.tags,
			featured: e.data.featured,
		})),
		...events.map(story('events')),
		...articles.map(story('articles')),
		...careers.map((e) => ({
			section: 'careers' as const,
			legacyId: e.data.legacyId,
			title: e.data.title,
			subtitle: e.data.status,
			excerpt: e.data.excerpt || excerptFrom(e.body),
			image: e.data.image,
			url: `/careers/${e.id}/`,
			tags: [],
		})),
		...team.map((e) => ({
			section: 'team' as const,
			legacyId: e.data.legacyId,
			title: e.data.name,
			subtitle: e.data.role,
			excerpt: e.data.excerpt || excerptFrom(e.body),
			image: e.data.image,
			url: `/team/${e.id}/`,
			tags: e.data.tags,
		})),
	];
}

/** Entries shown under "Recent News", ordered by their `featured` position. */
export async function getFeatured() {
	return (await getAllSummaries())
		.filter((s) => s.featured !== undefined)
		.sort((a, b) => a.featured! - b.featured!);
}

/** For each tag, the other entries that share it. */
export async function getRelated(tags: string[], selfUrl: string) {
	const all = await getAllSummaries();
	const norm = (t: string) => t.trim().toLowerCase();
	return tags
		.map((topic) => ({
			topic,
			items: all.filter((s) => s.url !== selfUrl && s.tags.some((t) => norm(t) === norm(topic))),
		}))
		.filter((g) => g.items.length);
}
