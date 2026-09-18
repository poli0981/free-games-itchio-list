-- Review queue + bookkeeping for the admin Worker. The catalog itself stays
-- JSON in the GitHub repo; D1 only holds what is waiting for a decision.
-- Migrations are additive only (never edit or drop in a later file).

-- Games proposed for the catalog (RSS discovery, the public Suggest form, the
-- browser extension via /api/ingest, or the maintainer). `rejected` rows are
-- kept as a permanent blocklist (URL only is needed for that).
CREATE TABLE candidates (
  url TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('rss', 'form', 'ext', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'rejected', 'queued', 'ingested', 'failed')),
  title TEXT,
  image_url TEXT,
  genre_hint TEXT,
  flags TEXT NOT NULL DEFAULT '[]',     -- JSON array: previously_deleted, demo, nsfw_keyword
  note TEXT,                            -- Suggest form / extension note (<= 500 chars)
  submitter TEXT,                       -- service-token client id or 'form' / 'rss:<feed>'
  discovered_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  decided_at TEXT,
  decided_by TEXT
);
CREATE INDEX idx_candidates_status ON candidates (status, discovered_at);

-- Round-robin state for itch.io RSS discovery (one feed per cron run).
CREATE TABLE feed_state (
  feed TEXT PRIMARY KEY,
  last_polled_at TEXT,
  backoff_until TEXT,
  last_status INTEGER
);

-- Who changed what (admin actions, with the resulting commit).
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  commit_sha TEXT,
  detail TEXT
);

-- Replay protection for /api/ingest (Idempotency-Key header), kept 7 days.
CREATE TABLE idempotency (
  client TEXT NOT NULL,                 -- service-token client id
  key TEXT NOT NULL,                    -- Idempotency-Key header
  body_hash TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (client, key)
);
CREATE INDEX idx_idempotency_created ON idempotency (created_at);
