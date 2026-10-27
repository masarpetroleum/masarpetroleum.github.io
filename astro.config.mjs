// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://masarpetroleum.github.io',
	trailingSlash: 'ignore',
	build: { format: 'directory' },
});
