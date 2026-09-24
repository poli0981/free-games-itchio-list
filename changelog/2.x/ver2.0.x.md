# Changelog — 2.0.x

Release notes for 2.0.0, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [2.0.0] - 2026-03-26 (Major Rewrite 🔧⭐)

### Rewritten
- **`scraper.py`** — new shared module extracted from `update_info.py`. All scraping logic, session management, rate-limiting, and parsing utilities live here. Used by every script that touches itch.io.
- **`update_info.py`** — fully rewritten. Uses `scraper.py` module, `requests.Session` with automatic retry (backoff on 429/5xx), and random delays between requests.
- **`generate_md.py`** — fully rewritten with pipe-character escaping and all new data fields.

### Added
- **Free game detection** — `update_info.py` now checks if a game is free before scraping. Paid games are skipped automatically. Detection logic parses `div.buy_row` for price tags and button text.
- **`check_paid.py`** — new script. Re-checks every game in the list to see if it became paid. Paid games are removed and logged to `deleted_games.json` with reason and timestamp.
- **`check_alive.py`** — new script. Verifies that all game URLs still exist. Pages returning 404 or 410 are removed and logged. Transient errors (403, 5xx, timeouts) are kept.
- **`log_deleted.py`** — new script. Converts `deleted_games.json` → `deleted_games.txt` (human-readable log sorted by date).
- **`deleted_games.json`** — structured log of all removed games with URL, name, reason, and deletion timestamp.
- **New data fields** scraped from itch.io info table: `status`, `platforms`, `publisher`, `release_date`, `made_with`, `rating`, `rating_count`, `average_session`, `languages`, `inputs`. All fields default to `N/A` when not found.
- **Author/Authors handling** — scraper now checks both `Author` and `Authors` keys (itch.io uses either depending on the page).
- **Release date parsing** — extracted from `<abbr title="...">` for full datetime instead of abbreviated text.
- **NSFW detection** expanded — now also checks game description text and adds `sexual` keyword.

### Added (GitHub Actions)
- **`check_paid.yml`** — runs every 2 days at 04:00 UTC. Removes games that became paid.
- **`check_alive.yml`** — runs every 2 days at 07:00 UTC (staggered 3h after check_paid). Removes dead links.
- **`log_deleted.yml`** — runs after check_paid or check_alive completes. Exports deletion log.
- **`generate_table.yml`** — now triggers after update, check_paid, and check_alive workflows (not just update).
- **`update_csv.yml`** — now triggers after table generation (chained workflow).

### Improved
- **Rate limiting** — random delays (2.5–5s between requests, 15–30s batch pause every 20 requests) to avoid itch.io IP bans. Lighter delays (1–2.5s) for HEAD/status checks.
- **Retry logic** — `requests.Session` with `HTTPAdapter` + `Retry` (3 attempts, exponential backoff 2→4→8s) on 429/500/502/503/504.
- **Network error safety** — games are never deleted on transient network failures. Only confirmed 404/410 or confirmed paid status triggers removal.
- **Markdown table integrity** — pipe characters (`|`) in game data are escaped to prevent table breakage.
- **All fields use `N/A` consistently** — replaced mixed `""`, `"Unknown"`, `"No description"` with uniform `N/A` fallback.

### Changed
- Markdown table columns expanded: added Genre, Tags, Status, Platforms, Publisher, Release Date, Made With, Rating, Session, Languages, Inputs.
- README rewritten with updated architecture diagram, project structure, field documentation.
- Workflow action versions updated to `actions/checkout@v6` and `actions/setup-python@v6` with Python 3.14.
