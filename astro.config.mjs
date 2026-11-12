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
		plugins: [
			{
				// GitHub Pages serves /admin/ and /admin/messages from the files in public/admin.
				// The dev server doesn't resolve those short addresses on its own, so map them here.
				name: 'admin-dev-urls',
				configureServer(server) {
					server.middlewares.use((req, _res, next) => {
						const [path, query = ''] = (req.url ?? '').split('?');
						const file = { '/admin': '/admin/index.html', '/admin/': '/admin/index.html', '/admin/messages': '/admin/messages.html' }[path];
						if (file) req.url = file + (query && `?${query}`);
						next();
					});
				},
			},
		],
		// The React renderer is loaded from node_modules in dev, so its
		// react-dom/client import has to be pre-bundled explicitly (it is CJS).
		optimizeDeps: { include: ['react-dom/client'] },
	},
	markdown: {
		rehypePlugins: [rehypeSections],
	},
});
