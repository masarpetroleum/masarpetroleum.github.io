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

// The page title is the only <h1>, so headings in a body start at <h2>. Editors
// often begin lower (<h3>, <h4>), which leaves a gap in the outline that screen
// readers announce. Lift the body's headings so that its highest one is an <h2>.
const HEADING = /<(\/?)h([1-6])(?=[\s>])/gi;

function liftHeadings(nodes) {
	let top = 7;
	for (const node of nodes) {
		if (node.type === 'raw') for (const match of node.value.matchAll(HEADING)) top = Math.min(top, Number(match[2]));
		else if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) top = Math.min(top, Number(node.tagName[1]));
	}
	const shift = top - 2;
	if (top === 7 || shift === 0) return;
	const level = (n) => Math.min(6, Math.max(2, Number(n) - shift));
	for (const node of nodes) {
		if (node.type === 'raw') node.value = node.value.replace(HEADING, (_, slash, n) => `<${slash}h${level(n)}`);
		else if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) node.tagName = `h${level(node.tagName[1])}`;
	}
}

export default function rehypeSections() {
	return (tree) => {
		liftHeadings(tree.children);
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
