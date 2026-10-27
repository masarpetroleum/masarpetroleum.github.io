import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Groups of related entries, shown under "Related topics" on detail pages.
// `ids` are the legacy numeric ids from masarpetroleum.om (content/?id=N).
const related = z.array(z.object({ topic: z.string(), ids: z.array(z.number()) })).default([]);

const base = {
	title: z.string(),
	subtitle: z.string().optional(),
	legacyId: z.number().optional(),
	order: z.number().default(100),
	image: z.string(),
	excerpt: z.string().default(''),
	related,
};

const articles = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
	schema: z.object({ ...base, carousel: z.number().optional() }),
});

const events = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
	schema: z.object({ ...base, gallery: z.array(z.string()).default([]) }),
});

const careers = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/careers' }),
	schema: z.object({
		title: z.string(),
		status: z.string().optional(),
		legacyId: z.number().optional(),
		order: z.number().default(100),
		image: z.string(),
		excerpt: z.string().default(''),
	}),
});

const team = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
	schema: z.object({
		slug: z.string().optional(),
		name: z.string(),
		role: z.string(),
		legacyId: z.number().optional(),
		order: z.number().default(100),
		image: z.string(),
		photo: z.string().optional(),
		excerpt: z.string().default(''),
	}),
});

const pages = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
	schema: z.object({
		title: z.string(),
		legacyId: z.number().optional(),
		hero: z.string().optional(),
		image: z.string().optional(),
		excerpt: z.string().default(''),
		gallery: z.array(z.string()).default([]),
		related,
	}),
});

export const collections = { articles, events, careers, team, pages };
