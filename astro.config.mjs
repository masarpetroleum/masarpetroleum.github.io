// @ts-check
import { defineConfig } from 'astro/config';
import rehypeSections from './src/lib/rehype-sections.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://masarpetroleum.github.io',
	trailingSlash: 'ignore',
	build: { format: 'directory' },
	markdown: {
		rehypePlugins: [rehypeSections],
	},
});
