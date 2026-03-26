# Changelog

All notable changes to this project will be documented here.

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

---

## [1.0.5] - 2026-01-12 (Hotfix 🔧)
### Fixed
- UTF-8 decode issue when running `scripts/update_info.py`. See [#16](https://github.com/poli0981/free-games-itchio-list/issues/16).

## [1.0.4] - 2026-01-11 (Added Games + New Features ⭐)

### Added Games
Added 33 games. See [#22](https://github.com/poli0981/free-games-itchio-list/issues/22) and [#23](https://github.com/poli0981/free-games-itchio-list/issues/23).

### New Features
- Delete game with correct link in [`delete_game.py`](/scripts/delete_game.py). See [#20](https://github.com/poli0981/free-games-itchio-list/issues/20).
- Export JSON → `.csv`/`.xlsx` in [`export_csv.py`](/scripts/export_csv.py). See [#21](https://github.com/poli0981/free-games-itchio-list/issues/21).
- Check duplicate data in JSON file in [`check_duplicate.py`](/scripts/check_duplicate.py). See [#19](https://github.com/poli0981/free-games-itchio-list/issues/19).

## [1.0.3] - Date unknown (Improvements ⚙️)

### Improved
- Optimized workflow scheduling.

## [1.0.2] - Date unknown (Hotfix 🔧)

### Fixed
- `temp_link.json` not resetting to `[]` after GitHub Actions run.

## [1.0.1] - 2025-12-31 (Hotfix 🔧)

### Fixed
- Rewrote and added 2 issue templates.
- Updated [CONTRIBUTING](CONTRIBUTING.md).

## [1.0.0] - 2025-12-28 (Initial Release 🚀)

### Added
- Full curated list of free itch.io games with auto-daily updates via GitHub Actions.
- Scraping script ([`update_info.py`](scripts/update_info.py)): add links → scrape title, dev, genre, description, NSFW flag, thumbnail.
- MD table generator ([`generate_md.py`](scripts/generate_md.py)): split by genre, 300 max per file, in `/lists/`.
- Columns: No | Thumb | Name | Dev | Short Desc | Link | Safe | Notes | NSFW.
- [`temp_link.json`](/scripts/temp_link.json) for easy manual adds (Actions process daily).
- Full docs: [DISCLAIMER](/docs/DISCLAIMER.md), [PRIVACY](/docs/PrivacyPolicy.md), [TERMS](/docs/ToS.md), [EULA](/docs/EULA.md), [SECURITY](SECURITY.md), [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md), [CONTRIBUTING](CONTRIBUTING.md), [ACKNOWLEDGEMENTS](/docs/ACKNOWLEDGEMENTS.md).
- Issue and PR templates for bugs, features, and game submissions.
- Badges, TOC, and example table in [README](README.md).

### Fixed
- Multiple scrape bugs (itch.io HTML structure changes).
- Description length overflow → truncated to first sentence + "(see more on itch.io)".
- Table numbering resets per file, primary genre used for grouping.