-- 4.4: ingest outcomes, maintainer settings, watched itch.io collections.
-- Additive only. Apply by hand BEFORE deploying the code that uses it:
--   npx wrangler d1 migrations apply freeitchgames --remote

-- How a queued game's ingest ended (scripts/state/ingest_outcomes.json, written
-- by the pipeline): added, duplicate, paid, dead, private, deleted, gave_up, or
-- timeout (nothing within 3 days). Kept when the row is reopened for review.
ALTER TABLE candidates ADD COLUMN outcome TEXT;
ALTER TABLE candidates ADD COLUMN outcome_at TEXT;

-- Maintainer settings as JSON values: 'automation' (auto-approve rules) and
-- 'automation_last_run' (what the last cron run did, shown in the admin).
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_by TEXT
);

-- itch.io collections the cron reads; their new free games are queued for ingest.
CREATE TABLE watched_collections (
  id TEXT PRIMARY KEY,                    -- the number in itch.io/c/<id>/<slug>
  slug TEXT NOT NULL,                     -- canonical slug (itch.io redirects any other)
  enabled INTEGER NOT NULL DEFAULT 1,
  added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  added_by TEXT,
  last_polled_at TEXT,
  last_status INTEGER,                    -- HTTP status, 0 network error, 422 unreadable page
  backoff_until TEXT,
  next_page INTEGER NOT NULL DEFAULT 1,   -- where the next poll continues
  last_found INTEGER,
  last_added INTEGER
);

-- The admin's Activity page filters the audit log by action, newest first.
CREATE INDEX idx_audit_action ON audit_log (action, id);
