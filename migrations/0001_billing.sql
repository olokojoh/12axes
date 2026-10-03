CREATE TABLE shared_results (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  locale TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  checkout_session_id TEXT UNIQUE,
  payment_intent_id TEXT UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  token_payload TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','paid','revoked','failed')),
  payload TEXT NOT NULL,
  locale TEXT NOT NULL,
  variant TEXT NOT NULL,
  quiz_length INTEGER NOT NULL,
  customer_email TEXT,
  amount_total INTEGER,
  currency TEXT,
  refunded_amount INTEGER NOT NULL DEFAULT 0,
  email_sent_at INTEGER,
  recovery_sent_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  fulfilled_at INTEGER,
  revoked_at INTEGER
);
CREATE TABLE webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE recovery_requests (
  email_hash TEXT PRIMARY KEY,
  requested_at INTEGER NOT NULL
);
CREATE INDEX orders_email_idx ON orders(customer_email);
