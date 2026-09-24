# Changelog — 1.0.x

Release notes for 1.0.0 – 1.0.5, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [1.0.5] - 2026-01-12 (Hotfix 🔧)
### Fixed
- UTF-8 decode issue when running `scripts/update_info.py`. See [#16](https://github.com/poli0981/free-games-itchio-list/issues/16).

---

## [1.0.4] - 2026-01-11 (Added Games + New Features ⭐)

### Added Games
Added 33 games. See [#22](https://github.com/poli0981/free-games-itchio-list/issues/22) and [#23](https://github.com/poli0981/free-games-itchio-list/issues/23).

### New Features
- Delete game with correct link in `delete_game.py`. See [#20](https://github.com/poli0981/free-games-itchio-list/issues/20).
- Export JSON → `.csv`/`.xlsx` in `export_csv.py`. See [#21](https://github.com/poli0981/free-games-itchio-list/issues/21).
- Check duplicate data in JSON file in `check_duplicate.py`. See [#19](https://github.com/poli0981/free-games-itchio-list/issues/19).

---

## [1.0.3] - 2026-01-01 (Improvements ⚙️)

### Improved
- Optimized workflow scheduling.

---

## [1.0.2] - 2026-01-01 (Hotfix 🔧)

### Fixed
- `temp_link.json` not resetting to `[]` after GitHub Actions run.

---

## [1.0.1] - 2025-12-31 (Hotfix 🔧)

### Fixed
- Rewrote and added 2 issue templates.
- Updated [CONTRIBUTING](../../CONTRIBUTING.md).

---

## [1.0.0] - 2025-12-28 (Initial Release 🚀)

### Added
- Full curated list of free itch.io games with auto-daily updates via GitHub Actions.
- Scraping script ([`update_info.py`](../../scripts/update_info.py)): add links → scrape title, dev, genre, description, NSFW flag, thumbnail.
- MD table generator (`generate_md.py`): split by genre, 300 max per file, in `/lists/`.
- Columns: No | Thumb | Name | Dev | Short Desc | Link | Safe | Notes | NSFW.
- [`temp_link.json`](/scripts/temp_link.json) for easy manual adds (Actions process daily).
- Full docs: [DISCLAIMER](/docs/DISCLAIMER.md), [PRIVACY](/docs/PrivacyPolicy.md), [TERMS](/docs/ToS.md), [EULA](/docs/EULA.md), [SECURITY](../../SECURITY.md), [CODE_OF_CONDUCT](../../CODE_OF_CONDUCT.md), [CONTRIBUTING](../../CONTRIBUTING.md), [ACKNOWLEDGEMENTS](/docs/ACKNOWLEDGEMENTS.md).
- Issue and PR templates for bugs, features, and game submissions.
- Badges, TOC, and example table in [README](../../README.md).

### Fixed
- Multiple scrape bugs (itch.io HTML structure changes).
- Description length overflow → truncated to first sentence + "(see more on itch.io)".
- Table numbering resets per file, primary genre used for grouping.
