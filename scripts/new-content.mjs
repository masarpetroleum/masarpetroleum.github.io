#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const contentDir = path.join(rootDir, 'src', 'content');

const bodyPlaceholder = { en: 'Write the full English story here.\n', ar: 'اكتب هنا نص الخبر الكامل باللغة العربية.\n' };

// Fields beyond title/excerpt/date, per content type. Order here is also the frontmatter order.
const typeConfigs = {
	news: {
		dir: 'news',
		label: 'news post',
		extraFields: [
			{ key: 'kicker', flag: 'kicker', prompt: { en: 'Kicker / category (EN)', ar: 'Kicker / category (AR)' }, fallback: { en: 'News', ar: 'الأخبار' } },
		],
	},
	articles: {
		dir: 'articles',
		label: 'article',
		extraFields: [
			{ key: 'kicker', flag: 'kicker', prompt: { en: 'Kicker / category (EN)', ar: 'Kicker / category (AR)' }, fallback: { en: 'Articles', ar: 'المقالات' } },
		],
	},
	careers: {
		dir: 'careers',
		label: 'job posting',
		extraFields: [
			{ key: 'location', flag: 'location', prompt: { en: 'Location (EN)', ar: 'Location (AR)' }, fallback: { en: 'Sahmah, Oman', ar: 'صحمه، عُمان' } },
			{
				key: 'employmentType',
				flag: 'employment-type',
				prompt: { en: 'Employment type (EN, e.g. Full-time)', ar: 'Employment type (AR)' },
				fallback: { en: 'Full-time', ar: 'دوام كامل' },
			},
		],
	},
	events: {
		dir: 'events',
		label: 'event',
		extraFields: [
			{ key: 'location', flag: 'location', prompt: { en: 'Location (EN)', ar: 'Location (AR)' }, fallback: { en: 'Sahmah, Oman', ar: 'صحمه، عُمان' } },
		],
	},
};

const usage = `Create new bilingual Masar Petroleum content (news, articles, careers, or events).

Usage:
  npm run new-content -- --type <news|articles|careers|events> --title-en "..." --title-ar "..." [options]

Shared options:
  --type <type>          Content type: news, articles, careers, or events (required)
  --title-en <text>      Title in English (required)
  --title-ar <text>      Title in Arabic (required)
  --excerpt-en <text>    Short summary for the list card, English
  --excerpt-ar <text>    Short summary for the list card, Arabic
  --date <YYYY-MM-DD>    Date (default: today)
  --slug <text>          URL slug, shared by both languages (default: derived from --title-en)
  -h, --help             Show this help

Type-specific options:
  news, articles          --kicker-en, --kicker-ar (category label)
  careers                 --location-en, --location-ar, --employment-type-en, --employment-type-ar
  events                  --location-en, --location-ar

Run with no options to answer the same questions interactively instead.

Shortcuts: npm run new-post (news), npm run new-article, npm run new-job, npm run new-event
`;

const slugify = (value) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^\p{Letter}\p{Number}]+/gu, '-')
		.replace(/^-+|-+$/g, '');

const frontmatterBlock = (lang, fields) =>
	['---', `lang: ${lang}`, ...Object.entries(fields).map(([key, value]) => `${key}: ${value}`), '---', ''].join('\n');

async function collectInteractively(config) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const ask = async (question, fallback) => {
		const suffix = fallback ? ` (${fallback})` : '';
		const answer = (await rl.question(`${question}${suffix}: `)).trim();
		return answer || fallback || '';
	};

	try {
		console.log(`New Masar Petroleum ${config.label} (interactive mode — press Enter to accept a default)\n`);

		const today = new Date().toISOString().slice(0, 10);
		const date = await ask('Date (YYYY-MM-DD)', today);

		const collected = { en: {}, ar: {} };

		for (const lang of ['en', 'ar']) {
			console.log(`\n-- ${lang === 'en' ? 'English' : 'Arabic'} --`);
			const title = await ask(`Title (${lang.toUpperCase()})`);
			if (!title) throw new Error(`A ${lang === 'en' ? 'English' : 'Arabic'} title is required.`);
			collected[lang].title = title;
			collected[lang].excerpt = await ask(`Excerpt (${lang.toUpperCase()}, 1-2 sentences for the list card)`);

			for (const field of config.extraFields) {
				collected[lang][field.key] = await ask(field.prompt[lang], field.fallback[lang]);
			}
		}

		const slug = slugify(await ask('Slug (used in the URL, same for both languages)', slugify(collected.en.title)));

		return { date, slug, en: collected.en, ar: collected.ar };
	} finally {
		rl.close();
	}
}

function collectFromArgs(config, values) {
	if (!values['title-en'] || !values['title-ar']) {
		throw new Error('--title-en and --title-ar are both required in non-interactive mode.\n\n' + usage);
	}

	const today = new Date().toISOString().slice(0, 10);
	const en = { title: values['title-en'], excerpt: values['excerpt-en'] ?? '' };
	const ar = { title: values['title-ar'], excerpt: values['excerpt-ar'] ?? '' };

	for (const field of config.extraFields) {
		en[field.key] = values[`${field.flag}-en`] ?? field.fallback.en;
		ar[field.key] = values[`${field.flag}-ar`] ?? field.fallback.ar;
	}

	return {
		date: values.date ?? today,
		slug: slugify(values.slug ?? values['title-en']),
		en,
		ar,
	};
}

async function main() {
	const optionKeys = new Set(['title-en', 'title-ar', 'excerpt-en', 'excerpt-ar', 'date', 'slug']);
	for (const config of Object.values(typeConfigs)) {
		for (const field of config.extraFields) {
			optionKeys.add(`${field.flag}-en`);
			optionKeys.add(`${field.flag}-ar`);
		}
	}

	const options = { type: { type: 'string' }, help: { type: 'boolean', short: 'h' } };
	for (const key of optionKeys) options[key] = { type: 'string' };

	const { values } = parseArgs({ options });

	if (values.help) {
		console.log(usage);
		return;
	}

	const type = values.type;
	if (!type && Object.keys(values).length === 0) {
		throw new Error('Pass --type <news|articles|careers|events>, or use one of the npm run new-* shortcuts.\n\n' + usage);
	}
	if (!type || !typeConfigs[type]) {
		throw new Error(`Unknown or missing --type "${type ?? ''}". Choose one of: ${Object.keys(typeConfigs).join(', ')}.\n\n` + usage);
	}

	const config = typeConfigs[type];
	const hasArgs = Object.keys(values).some((key) => key !== 'type');
	const post = hasArgs ? collectFromArgs(config, values) : await collectInteractively(config);

	if (!post.slug) {
		throw new Error('Could not derive a slug — please provide a title with letters or numbers, or pass --slug.');
	}

	const typeDir = path.join(contentDir, config.dir);
	const enPath = path.join(typeDir, 'en', `${post.slug}.md`);
	const arPath = path.join(typeDir, 'ar', `${post.slug}.md`);

	if (existsSync(enPath) || existsSync(arPath)) {
		throw new Error(`A ${config.label} with slug "${post.slug}" already exists. Choose a different title or pass --slug.`);
	}

	await mkdir(path.dirname(enPath), { recursive: true });
	await mkdir(path.dirname(arPath), { recursive: true });

	await writeFile(enPath, frontmatterBlock('en', { ...post.en, date: post.date }) + '\n' + bodyPlaceholder.en, 'utf8');
	await writeFile(arPath, frontmatterBlock('ar', { ...post.ar, date: post.date }) + '\n' + bodyPlaceholder.ar, 'utf8');

	console.log(`\nCreated ${config.label}:`);
	console.log(`  ${path.relative(rootDir, enPath)}`);
	console.log(`  ${path.relative(rootDir, arPath)}`);
	console.log(`\nOpen both files and write the full body — it then appears on /en/${config.dir}/ and /ar/${config.dir}/ automatically.`);
}

main().catch((error) => {
	console.error(`\nError: ${error.message}`);
	process.exitCode = 1;
});
