import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every entry is written in English in `<name>.md`. Its Arabic translation, if
// there is one, sits beside it in `<name>.ar.md` and only needs the translated
// fields: the rest (images, order…) is taken from the English file. See
// src/lib/content.ts, which joins the two.

// Entries sharing a tag are listed under "Related topics" on each other's pages.
const tags = z.array(z.string()).default([]);
// Position in the homepage "Recent News" list (1 = first). Omit to leave it out.
const featured = z.number().optional();

const story = z.object({
	title: z.string(),
	subtitle: z.string().optional(),
	legacyId: z.number().optional(),
	order: z.number().default(100),
	image: z.string(),
	excerpt: z.string().default(''),
	tags,
	featured,
});

const schemas = {
	articles: story.extend({ carousel: z.number().optional() }),
	events: story.extend({ gallery: z.array(z.string()).default([]) }),
	careers: z.object({
		title: z.string(),
		status: z.string().optional(),
		legacyId: z.number().optional(),
		order: z.number().default(100),
		image: z.string(),
		excerpt: z.string().default(''),
	}),
	team: z.object({
		slug: z.string().optional(),
		name: z.string(),
		role: z.string(),
		legacyId: z.number().optional(),
		order: z.number().default(100),
		image: z.string(),
		photo: z.string().optional(),
		excerpt: z.string().default(''),
		tags,
	}),
	pages: z.object({
		title: z.string(),
		legacyId: z.number().optional(),
		hero: z.string().optional(),
		image: z.string().optional(),
		excerpt: z.string().default(''),
		gallery: z.array(z.string()).default([]),
		tags,
		featured,
	}),
};

type Name = keyof typeof schemas;

const english = <N extends Name>(name: N) =>
	defineCollection({
		loader: glob({ pattern: ['**/*.md', '!**/*.ar.md'], base: `./src/content/${name}` }),
		schema: schemas[name],
	});

/** The translation only has to carry what differs, so nothing is required and no defaults are filled in. */
const translationSchema = z.object({
	title: z.string().optional(),
	subtitle: z.string().optional(),
	name: z.string().optional(),
	role: z.string().optional(),
	status: z.string().optional(),
	excerpt: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

/** Arabic files are filed under the name of the English file they translate (`shale-oil.ar.md` → `shale-oil`). */
const arabic = (name: Name) =>
	defineCollection({
		loader: glob({
			pattern: '**/*.ar.md',
			base: `./src/content/${name}`,
			generateId: ({ entry }) => entry.replace(/\.ar\.md$/, '').toLowerCase(),
		}),
		schema: translationSchema,
	});

export const collections = {
	articles: english('articles'),
	events: english('events'),
	careers: english('careers'),
	team: english('team'),
	pages: english('pages'),
	articlesAr: arabic('articles'),
	eventsAr: arabic('events'),
	careersAr: arabic('careers'),
	teamAr: arabic('team'),
	pagesAr: arabic('pages'),
};
