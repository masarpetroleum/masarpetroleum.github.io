import { getCollection, type CollectionEntry } from 'astro:content';
import { DEFAULT_LANG, localizePath, type Lang } from '../i18n';

export type Section = 'articles' | 'events' | 'careers' | 'team' | 'pages';

/**
 * An entry in the language of the page. `data` is the English entry with the
 * translated fields laid over it; `source` is the file whose body is shown.
 */
export interface Localized<S extends Section> {
	id: string;
	data: CollectionEntry<S>['data'];
	source: CollectionEntry<S> | CollectionEntry<`${S}Ar`>;
	/** The English tags: entries are matched on these in every language. */
	tagKeys: string[];
	/** False when the page is in Arabic but this entry has no Arabic file yet. */
	translated: boolean;
}

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
	tagKeys: string[];
	featured?: number;
	/** The text of the body, for the search index. */
	body: string;
}

const PAGE_URLS: Record<string, string> = { company: '/company/', operations: '/operations/' };

const ENTITIES: Record<string, string> = { '&amp;': '&', '&rsquo;': '’', '&lsquo;': '‘', '&quot;': '"', '&ndash;': '–', '&mdash;': '—' };

/** The text of an HTML body, without its tags. */
export const plainText = (html = '') =>
	html
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&[a-z]+;|&#\d+;/gi, (m) => ENTITIES[m] ?? ' ')
		.replace(/\s+/g, ' ')
		.trim();

/** Plain-text summary from an entry body, used when no `excerpt` is set. */
export function excerptFrom(html = '', length = 260) {
	const text = plainText(html);
	return text.length <= length ? text : `${text.slice(0, length).replace(/\s+\S*$/, '')}…`;
}

const byOrder = <T extends { data: { order?: number } }>(a: T, b: T) => (a.data.order ?? 100) - (b.data.order ?? 100);

/** Drops the keys a translation leaves empty, so they don't hide the English value. */
const filled = (data: Record<string, unknown>) =>
	Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)));

async function load<S extends Section>(section: S, lang: Lang): Promise<Localized<S>[]> {
	const english = (await getCollection(section)) as CollectionEntry<S>[];
	const arabic =
		lang === DEFAULT_LANG
			? new Map<string, CollectionEntry<`${S}Ar`>>()
			: new Map(((await getCollection(`${section}Ar`)) as CollectionEntry<`${S}Ar`>[]).map((e) => [e.id, e]));

	return english.map((entry) => {
		const tagKeys = 'tags' in entry.data ? entry.data.tags : [];
		const translation = arabic.get(entry.id.toLowerCase());
		if (!translation) return { id: entry.id, data: entry.data, source: entry, tagKeys, translated: lang === DEFAULT_LANG };
		const data = { ...entry.data, ...filled(translation.data) } as CollectionEntry<S>['data'];
		// A summary written for the English text must not stand in for the Arabic one.
		if (!translation.data.excerpt) (data as { excerpt: string }).excerpt = excerptFrom(translation.body);
		return { id: entry.id, data, source: translation, tagKeys, translated: true };
	});
}

export const getArticles = async (lang: Lang) => (await load('articles', lang)).sort(byOrder);
export const getEvents = async (lang: Lang) => (await load('events', lang)).sort(byOrder);
export const getCareers = async (lang: Lang) => (await load('careers', lang)).sort(byOrder);
export const getTeam = async (lang: Lang) => (await load('team', lang)).sort(byOrder);
export const getPage = async (id: 'company' | 'operations', lang: Lang) => (await load('pages', lang)).find((p) => p.id === id)!;

export async function getAllSummaries(lang: Lang): Promise<EntrySummary[]> {
	const [articles, events, careers, team, pages] = await Promise.all([
		getArticles(lang),
		getEvents(lang),
		getCareers(lang),
		getTeam(lang),
		load('pages', lang),
	]);
	const url = (path: string) => localizePath(path, lang);
	const common = (e: Localized<Section>) => ({
		legacyId: e.data.legacyId,
		excerpt: e.data.excerpt || excerptFrom(e.source.body),
		tagKeys: e.tagKeys,
		body: plainText(e.source.body),
	});
	const story = (section: 'articles' | 'events') => (e: Localized<'articles'> | Localized<'events'>): EntrySummary => ({
		...common(e),
		section,
		title: e.data.title,
		subtitle: e.data.subtitle,
		image: e.data.image,
		url: url(`/${section}/${e.id}/`),
		tags: e.data.tags,
		featured: e.data.featured,
	});
	return [
		...pages.map((e) => ({
			...common(e),
			section: 'pages' as const,
			title: e.data.title,
			image: e.data.image ?? e.data.hero ?? e.data.gallery[0],
			url: url(PAGE_URLS[e.id] ?? `/${e.id}/`),
			tags: e.data.tags,
			featured: e.data.featured,
		})),
		...events.map(story('events')),
		...articles.map(story('articles')),
		...careers.map((e) => ({
			...common(e),
			section: 'careers' as const,
			title: e.data.title,
			subtitle: e.data.status,
			image: e.data.image,
			url: url(`/careers/${e.id}/`),
			tags: [],
		})),
		...team.map((e) => ({
			...common(e),
			section: 'team' as const,
			title: e.data.name,
			subtitle: e.data.role,
			image: e.data.image,
			url: url(`/team/${e.id}/`),
			tags: e.data.tags,
		})),
	];
}

/** Entries shown under "Recent News", ordered by their `featured` position. */
export async function getFeatured(lang: Lang) {
	return (await getAllSummaries(lang)).filter((s) => s.featured !== undefined).sort((a, b) => a.featured! - b.featured!);
}

/** For each tag, the other entries that share it. `labels` are the tags as shown, in the same order as `tagKeys`. */
export async function getRelated(tagKeys: string[], labels: string[], selfUrl: string, lang: Lang) {
	const all = await getAllSummaries(lang);
	const norm = (t: string) => t.trim().toLowerCase();
	const self = selfUrl.endsWith('/') ? selfUrl : `${selfUrl}/`;
	return tagKeys
		.map((key, i) => ({
			topic: labels[i] ?? key,
			items: all.filter((s) => s.url !== self && s.tagKeys.some((t) => norm(t) === norm(key))),
		}))
		.filter((g) => g.items.length);
}
