#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const contentDir = path.join(rootDir, 'src', 'content');

// Collections and the frontmatter each needs. `subtitle` is the small line under the title on cards.
const typeConfigs = {
	articles: { label: 'article', fields: ['title', 'subtitle', 'image', 'excerpt'] },
	events: { label: 'event / news item', fields: ['title', 'subtitle', 'image', 'excerpt'] },
	careers: { label: 'job posting', fields: ['title', 'status', 'image', 'excerpt'] },
	team: { label: 'team member', fields: ['name', 'role', 'image', 'photo', 'excerpt'] },
};

const usage = `Create new Masar Petroleum content.

Usage:
  npm run new-content -- --type <articles|events|careers|team> --title "..." [options]

Options:
  --type <type>       articles, events, careers, or team (required)
  --title <text>      Title (for team: the person's name) (required)
  --subtitle <text>   Card subtitle (articles/events), e.g. "May 2025"
  --status <text>     Job status shown as a badge, e.g. "Expired" (careers)
  --role <text>       Job title (team)
  --image <path>      Card image under public/, e.g. /images/thumbs/my-photo.jpg
  --photo <path>      Large portrait beside the bio (team)
  --excerpt <text>    Summary used on the homepage news list and in search
  --slug <text>       URL slug (default: derived from --title)
  -h, --help          Show this help

New entries are listed first. Put images in public/images/ and reference them with a leading slash.
Shortcuts: npm run new-article, npm run new-event, npm run new-job, npm run new-member
`;

const slugify = (value) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^\p{Letter}\p{Number}]+/gu, '-')
		.replace(/^-+|-+$/g, '');

async function main() {
	const { values } = parseArgs({
		options: Object.fromEntries(
			['type', 'title', 'subtitle', 'status', 'role', 'image', 'photo', 'excerpt', 'slug'].map((k) => [k, { type: 'string' }]).concat([['help', { type: 'boolean', short: 'h' }]]),
		),
	});
	if (values.help) return console.log(usage);

	const config = typeConfigs[values.type];
	if (!config) throw new Error(`Unknown or missing --type "${values.type ?? ''}".\n\n${usage}`);

	const data = { ...values };
	if (!data.title) {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		try {
			console.log(`New ${config.label} (press Enter to skip optional fields)\n`);
			for (const field of ['title', ...config.fields.filter((f) => f !== 'title' && f !== 'name')]) {
				data[field] ||= (await rl.question(`${field === 'title' && values.type === 'team' ? 'name' : field}: `)).trim();
			}
		} finally {
			rl.close();
		}
	}
	if (!data.title) throw new Error('A title is required.');

	const slug = slugify(data.slug ?? data.title);
	const file = path.join(contentDir, values.type, `${slug}.md`);
	if (existsSync(file)) throw new Error(`"${path.relative(rootDir, file)}" already exists. Pass a different --slug.`);

	// Place the new entry before all existing ones.
	const existing = (await readdir(path.dirname(file)).catch(() => [])).length;
	const frontmatter = { ...(values.type === 'team' ? { name: data.title } : { title: data.title }) };
	for (const f of config.fields) if (f !== 'title' && f !== 'name' && data[f]) frontmatter[f] = data[f];
	frontmatter.image ??= '/template/logo-og.png';
	frontmatter.order = -existing - 1;

	const body = ['---', ...Object.entries(frontmatter).map(([k, v]) => `${k}: ${JSON.stringify(v)}`), '---', '', '<section class="entry-section">', '<p>Write the content here. Markdown or HTML both work.</p>', '</section>', ''];
	await mkdir(path.dirname(file), { recursive: true });
	await writeFile(file, body.join('\n'), 'utf8');
	console.log(`\nCreated ${config.label}: ${path.relative(rootDir, file)}`);
	console.log(`It will appear at /${values.type}/${slug}/`);
}

main().catch((error) => {
	console.error(`\nError: ${error.message}`);
	process.exitCode = 1;
});
