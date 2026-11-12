-- Messages sent from the website's contact form.
CREATE TABLE IF NOT EXISTS messages (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	created_at TEXT NOT NULL,          -- ISO 8601, UTC
	name TEXT NOT NULL,
	phone TEXT NOT NULL DEFAULT '',
	email TEXT NOT NULL DEFAULT '',
	message TEXT NOT NULL,
	read INTEGER NOT NULL DEFAULT 0,   -- 0 = unread, 1 = read
	ip_hash TEXT NOT NULL DEFAULT ''   -- salted hash of the sender's IP, for rate limiting only
);

CREATE INDEX IF NOT EXISTS messages_created_at ON messages (created_at);
CREATE INDEX IF NOT EXISTS messages_ip_hash ON messages (ip_hash, created_at);
