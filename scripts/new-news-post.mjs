#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const newsDir = path.join(rootDir, 'src', 'content', 'news');

const usage = `Create a new bilingual Masar Petroleum news post.

Usage:
  npm run new-post -- --title-en "..." --title-ar "..." [options]

Options:
  --title-en <text>     Post title in English (required)
  --title-ar <text>     Post title in Arabic (required)
  --excerpt-en <text>   Short summary for the list card, English
  --excerpt-ar <text>   Short summary for the list card, Arabic
  --kicker-en <text>    Category label, English (default: "News")
  --kicker-ar <text>    Category label, Arabic (default: "الأخبار")
  --date <YYYY-MM-DD>   Publish date (default: today)
  --slug <text>         URL slug, shared by both languages (default: derived from --title-en)
  -h, --help            Show this help

Run with no options to answer the same questions interactively instead.
`;

const slugify = (value) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^\p{Letter}\p{Number}]+/gu, '-')
		.replace(/^-+|-+$/g, '');

const frontmatterBlock = ({ lang, title, kicker, excerpt, date }) =>
	[
		'---',
		`lang: ${lang}`,
		`title: ${title}`,
		`kicker: ${kicker}`,
		`excerpt: ${excerpt}`,
		`date: ${date}`,
		'---',
		'',
	].join('\n');

async function collectInteractively() {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const ask = async (question, fallback) => {
		const suffix = fallback ? ` (${fallback})` : '';
		const answer = (await rl.question(`${question}${suffix}: `)).trim();
		return answer || fallback || '';
	};

	try {
		console.log('New Masar Petroleum news post (interactive mode — press Enter to accept a default)\n');

		const today = new Date().toISOString().slice(0, 10);
		const date = await ask('Publish date (YYYY-MM-DD)', today);

		console.log('\n-- English --');
		const titleEn = await ask('Title (EN)');
		if (!titleEn) throw new Error('An English title is required.');
		const kickerEn = await ask('Kicker / category (EN)', 'News');
		const excerptEn = await ask('Excerpt (EN, 1-2 sentences for the list card)');

		console.log('\n-- Arabic --');
		const titleAr = await ask('Title (AR)');
		if (!titleAr) throw new Error('An Arabic title is required.');
		const kickerAr = await ask('Kicker / category (AR)', 'الأخبار');
		const excerptAr = await ask('Excerpt (AR, 1-2 sentences for the list card)');

		const slug = slugify(await ask('Slug (used in the URL, same for both languages)', slugify(titleEn)));

		return { date, titleEn, kickerEn, excerptEn, titleAr, kickerAr, excerptAr, slug };
	} finally {
		rl.close();
	}
}

function collectFromArgs(values) {
	if (!values['title-en'] || !values['title-ar']) {
		throw new Error('--title-en and --title-ar are both required in non-interactive mode.\n\n' + usage);
	}

	const today = new Date().toISOString().slice(0, 10);

	return {
		date: values.date ?? today,
		titleEn: values['title-en'],
		kickerEn: values['kicker-en'] ?? 'News',
		excerptEn: values['excerpt-en'] ?? '',
		titleAr: values['title-ar'],
		kickerAr: values['kicker-ar'] ?? 'الأخبار',
		excerptAr: values['excerpt-ar'] ?? '',
		slug: slugify(values.slug ?? values['title-en']),
	};
}

async function main() {
	const { values } = parseArgs({
		options: {
			'title-en': { type: 'string' },
			'title-ar': { type: 'string' },
			'excerpt-en': { type: 'string' },
			'excerpt-ar': { type: 'string' },
			'kicker-en': { type: 'string' },
			'kicker-ar': { type: 'string' },
			date: { type: 'string' },
			slug: { type: 'string' },
			help: { type: 'boolean', short: 'h' },
		},
	});

	if (values.help) {
		console.log(usage);
		return;
	}

	const hasArgs = Object.keys(values).length > 0;
	const post = hasArgs ? collectFromArgs(values) : await collectInteractively();

	if (!post.slug) {
		throw new Error('Could not derive a slug — please provide a title with letters or numbers, or pass --slug.');
	}

	const enPath = path.join(newsDir, 'en', `${post.slug}.md`);
	const arPath = path.join(newsDir, 'ar', `${post.slug}.md`);

	if (existsSync(enPath) || existsSync(arPath)) {
		throw new Error(`A post with slug "${post.slug}" already exists. Choose a different title or pass --slug.`);
	}

	await mkdir(path.dirname(enPath), { recursive: true });
	await mkdir(path.dirname(arPath), { recursive: true });

	await writeFile(
		enPath,
		frontmatterBlock({ lang: 'en', title: post.titleEn, kicker: post.kickerEn, excerpt: post.excerptEn, date: post.date }) +
			'\nWrite the full English story here.\n',
		'utf8',
	);

	await writeFile(
		arPath,
		frontmatterBlock({ lang: 'ar', title: post.titleAr, kicker: post.kickerAr, excerpt: post.excerptAr, date: post.date }) +
			'\nاكتب هنا نص الخبر الكامل باللغة العربية.\n',
		'utf8',
	);

	console.log('\nCreated:');
	console.log(`  ${path.relative(rootDir, enPath)}`);
	console.log(`  ${path.relative(rootDir, arPath)}`);
	console.log('\nOpen both files and write the full story body — the post then appears on /en/news/ and /ar/news/ automatically.');
}

main().catch((error) => {
	console.error(`\nError: ${error.message}`);
	process.exitCode = 1;
});
