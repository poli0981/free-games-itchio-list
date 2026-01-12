# Changelog

All notable changes to this project will be documented here. I'm a noob dev, so versions are "when I feel like it".

## [1.0.5] - 2026-01-12 (Hotfix 🔧)
### Fixed
- UTF-8 decode issue when run `scripts/update_info.py`., see details in [#16](https://github.com/poli0981/free-games-itchio-list/issues/16)


## [1.0.4] - 2026-01-11 (Added Games + New Features ⭐)

### Added Games
Added 33 games. (See [#22](https://github.com/poli0981/free-games-itchio-list/issues/22) and [#23](https://github.com/poli0981/free-games-itchio-list/issues/23) for details) .

### New features
- Delete game with correct link in [`delete_game.py`](/scripts/delete_game.py), see details in [#20](https://github.com/poli0981/free-games-itchio-list/issues/20) .
- Export JSON -> `.csv`/`.xlsx` in [`export_csv.py`](/scripts/export_csv.py), see details in [#21](https://github.com/poli0981/free-games-itchio-list/issues/21).
- Check duplicate data in JSON file in [`check_duplicate.py`](/scripts/check_duplicate.py), see details in [#19](https://github.com/poli0981/free-games-itchio-list/issues/19).

## [1.0.3] - I forgot the date again (Improvements ⚙️)

### Improvements
- Improved: optimize workflow.

## [1.0.2] - I forgot the date (Hotfix 🔧)

### Fixed
- Fixed: fix file [`temp_file.json`](/scripts/temp_link.json) don't automatically reset to `[]` after run github actions.

## [1.0.1] - 2025-12-31 (Hotfix 🔧)

### Fixed
- Rewrite and add 2 issue template.
- Update [CONTRIBUTING](CONTRIBUTING.md).

## [1.0.0] - 2025-12-28 (Initial Release 🚀)

### Added
- Full curated list of free itch.io games with auto-daily updates via GitHub Actions.
- Scraping script ([`update_info.py`](scripts/update_info.py)): add links → scrape title/dev/genre/desc/nsfw/thumbnail.
- MD table generator ([`generate_md.py`](scripts/generate_md.py)): split by genre, 300 max per file, in `/lists/`.
- Columns: 
  > No | Thumb | Name | Dev | Short Desc | Link | Safe | Notes | NSFW.
- [`temp_link.json`](/scripts/temp_link.json) for easy manual adds (Actions process daily).
- Full docs: [DISCLAIMER](/docs/DISCLAIMER.md), [PRIVACY](/docs/PrivacyPolicy.md), [TERMS](/docs/ToS.md), [EULA](/docs/EULA.md), 
  [SECURITY](SECURITY.md), 
  [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md), 
  [CONTRIBUTING](CONTRIBUTING.md), [ACKNOWLEDGEMENTS](/docs/ACKNOWLEDGEMENTS.md), 
  [MY_STUFF](docs/My_Stuff.md).
- Issue & PR templates for ***bugs/features/add games***.
- Badges, TOC, example in [README](README.md).

---

### Fixed
- Multiple scrape bugs (itch.io HTML changes — thanks Grok for fixes).
- Description too long → now short + "(see more on itch.io)".
- Tables reset No. per file, primary genre first.

### Thanks
- Grok (xAI): Carried 99% of this repo. True buddy.
- itch.io: For all the free gems.
- Future contributors: You're legends already.

Built during unemployment peak. More updates when boredom strikes again :D