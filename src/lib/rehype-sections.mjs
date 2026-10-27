// Splits a rendered Markdown body at top-level <hr> elements and wraps each
// part in <section class="entry-section">, so editors start a new content box
// by inserting a horizontal line in the CMS.
const HR = /<hr\s*\/?>/i;
const isBlank = (node) => (node.type === 'text' || node.type === 'raw') && !node.value.trim();
const isRule = (node) => node.type === 'element' && node.tagName === 'hr';

// Raw HTML blocks reach rehype as `raw` nodes, and the CMS may save a whole
// body on one line, so split raw nodes at their <hr> tags as well.
function* expand(node) {
	if (node.type !== 'raw' || !HR.test(node.value)) {
		yield node;
		return;
	}
	const parts = node.value.split(/<hr\s*\/?>/gi);
	for (const [i, value] of parts.entries()) {
		if (i > 0) yield { type: 'element', tagName: 'hr', properties: {}, children: [] };
		if (value.trim()) yield { type: 'raw', value };
	}
}

export default function rehypeSections() {
	return (tree) => {
		const groups = [[]];
		for (const node of tree.children.flatMap((n) => [...expand(n)])) {
			if (isRule(node)) groups.push([]);
			else groups[groups.length - 1].push(node);
		}
		tree.children = groups
			.filter((g) => g.some((n) => !isBlank(n)))
			.map((children) => ({
				type: 'element',
				tagName: 'section',
				properties: { className: ['entry-section'] },
				children,
			}));
	};
}
