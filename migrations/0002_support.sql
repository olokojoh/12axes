CREATE TABLE support_requests (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER
);
CREATE INDEX support_email_idx ON support_requests(email_hash, created_at);
