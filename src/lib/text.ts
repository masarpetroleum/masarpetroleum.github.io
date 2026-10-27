// Minimal, safe renderer for the short Markdown texts in src/data/*.json:
// blank-line paragraphs, **bold**, *italic*, [links](url) and line breaks.
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const inline = (s: string) =>
	escape(s)
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => {
			const external = /^https?:/.test(url);
			return `<a href="${url}"${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
		})
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/\n/g, '<br />');

export function renderText(md = ''): string {
	return md
		.trim()
		.split(/\n\s*\n/)
		.filter(Boolean)
		.map((p) => `<p>${inline(p.trim())}</p>`)
		.join('\n');
}
