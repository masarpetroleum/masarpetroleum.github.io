import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const news = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
	schema: z.object({
		lang: z.enum(['en', 'ar']),
		title: z.string(),
		excerpt: z.string(),
		kicker: z.string(),
		date: z.coerce.date(),
	}),
});

const articles = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
	schema: z.object({
		lang: z.enum(['en', 'ar']),
		title: z.string(),
		excerpt: z.string(),
		kicker: z.string(),
		date: z.coerce.date(),
	}),
});

const careers = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/careers' }),
	schema: z.object({
		lang: z.enum(['en', 'ar']),
		title: z.string(),
		location: z.string(),
		employmentType: z.string(),
		excerpt: z.string(),
		date: z.coerce.date(),
	}),
});

const events = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
	schema: z.object({
		lang: z.enum(['en', 'ar']),
		title: z.string(),
		location: z.string(),
		excerpt: z.string(),
		date: z.coerce.date(),
	}),
});

export const collections = { news, articles, careers, events };
