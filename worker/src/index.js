// Contact form backend for masarpetroleum.github.io.
//
//   POST   /messages        public: store a message from the contact form
//   GET    /messages        editors: list messages, newest first
//   PATCH  /messages/:id    editors: mark a message read or unread
//   DELETE /messages/:id    editors: delete a message
//
// "Editors" are people who can push to GITHUB_REPO. They sign in with GitHub on
// the admin page, which sends their GitHub token here as a Bearer token.

const LIMITS = { name: 100, phone: 40, email: 200, message: 5000 };
const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** Tokens already checked against GitHub, so each request doesn't re-check. */
const verified = new Map();
const VERIFY_TTL = 5 * 60 * 1000;

export default {
	async fetch(request, env) {
		const cors = corsHeaders(request, env);
		const reply = (data, status = 200) =>
			new Response(JSON.stringify(data), {
				status,
				headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cors },
			});

		try {
			if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

			const { pathname } = new URL(request.url);
			const id = pathname.match(/^\/messages\/(\d+)$/)?.[1];

			if (pathname === '/messages' && request.method === 'POST') return await submit(request, env, reply);

			if (pathname === '/messages' || id) {
				if (!(await isEditor(request, env))) return reply({ error: 'Sign in with a GitHub account that can edit the site.' }, 401);

				if (pathname === '/messages' && request.method === 'GET') {
					const { results } = await env.DB.prepare(
						'SELECT id, created_at, name, phone, email, message, read FROM messages ORDER BY created_at DESC LIMIT 500',
					).all();
					return reply({ messages: results });
				}
				if (id && request.method === 'PATCH') {
					const body = await request.json().catch(() => ({}));
					await env.DB.prepare('UPDATE messages SET read = ? WHERE id = ?')
						.bind(body.read ? 1 : 0, Number(id))
						.run();
					return reply({ ok: true });
				}
				if (id && request.method === 'DELETE') {
					await env.DB.prepare('DELETE FROM messages WHERE id = ?').bind(Number(id)).run();
					return reply({ ok: true });
				}
			}

			return reply({ error: 'Not found' }, 404);
		} catch (error) {
			console.error(error);
			return reply({ error: 'Something went wrong. Please try again.' }, 500);
		}
	},
};

function corsHeaders(request, env) {
	const origin = request.headers.get('Origin') ?? '';
	const allowed = String(env.ALLOWED_ORIGINS ?? '')
		.split(',')
		.map((o) => o.trim())
		.filter(Boolean);
	// Localhost is allowed so the form and the admin page can be tested with `astro dev`.
	if (!allowed.includes(origin) && !LOCALHOST.test(origin)) return { vary: 'Origin' };
	return {
		'access-control-allow-origin': origin,
		'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
		'access-control-allow-headers': 'authorization, content-type',
		'access-control-max-age': '86400',
		vary: 'Origin',
	};
}

async function submit(request, env, reply) {
	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') return reply({ error: 'Invalid request.' }, 400);

	const field = (key) => (typeof body[key] === 'string' ? body[key].trim() : '');
	const name = field('name');
	const phone = field('phone');
	const email = field('email');
	const message = field('message');

	// A hidden field people never see. Bots fill it in; pretend it worked.
	if (field('website')) return reply({ ok: true });

	if (!name || !message) return reply({ error: 'Please enter your name and a message.' }, 400);
	for (const [key, max] of Object.entries(LIMITS)) {
		if (field(key).length > max) return reply({ error: `The ${key} is too long.` }, 400);
	}
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: 'Please check the email address.' }, 400);

	const ipHash = await sha256(`${request.headers.get('CF-Connecting-IP') ?? ''}|${env.GITHUB_REPO}`);
	const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
	const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE ip_hash = ? AND created_at > ?')
		.bind(ipHash, hourAgo)
		.first('n');
	if (recent >= Number(env.MAX_PER_HOUR || 5)) {
		return reply({ error: 'You have sent several messages already. Please try again later.' }, 429);
	}

	await env.DB.prepare('INSERT INTO messages (created_at, name, phone, email, message, ip_hash) VALUES (?, ?, ?, ?, ?, ?)')
		.bind(new Date().toISOString(), name, phone, email, message, ipHash)
		.run();
	return reply({ ok: true }, 201);
}

/** True when the request carries a GitHub token whose owner can push to GITHUB_REPO. */
async function isEditor(request, env) {
	const token = (request.headers.get('Authorization') ?? '').match(/^Bearer\s+(\S+)$/i)?.[1];
	if (!token) return false;

	const key = await sha256(token);
	const hit = verified.get(key);
	if (hit && hit > Date.now()) return true;

	const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}`, {
		headers: {
			authorization: `Bearer ${token}`,
			accept: 'application/vnd.github+json',
			'user-agent': 'masar-messages-worker',
		},
	});
	if (!response.ok) return false;
	const repo = await response.json();
	if (!repo?.permissions?.push) return false;

	verified.set(key, Date.now() + VERIFY_TTL);
	return true;
}

async function sha256(text) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
