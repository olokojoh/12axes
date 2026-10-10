CREATE TABLE share_cards (
  share_id TEXT PRIMARY KEY REFERENCES shared_results(id) ON DELETE CASCADE,
  upload_token_hash TEXT NOT NULL,
  base_url TEXT NOT NULL,
  image_payload TEXT,
  image_bytes INTEGER,
  ready_at INTEGER
);
