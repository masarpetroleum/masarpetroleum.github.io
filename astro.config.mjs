// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import rehypeSections from './src/lib/rehype-sections.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://masarpetroleum.github.io',
	trailingSlash: 'ignore',
	build: { format: 'directory' },
	// React powers the interactive islands (the site header, built on Animate UI).
	integrations: [react()],
	vite: {
		// The React renderer is loaded from node_modules in dev, so its
		// react-dom/client import has to be pre-bundled explicitly (it is CJS).
		optimizeDeps: { include: ['react-dom/client'] },
	},
	markdown: {
		rehypePlugins: [rehypeSections],
	},
});
