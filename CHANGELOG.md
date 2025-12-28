# Changelog

All notable changes to this project will be documented here. I'm a noob dev, so versions are "when I feel like it".

## [1.0.0] - 2025-12-28 (Initial Release 🚀)

### Added
- Full curated list of free itch.io games with auto-daily updates via GitHub Actions.
- Scraping script (`update_games.py`): add links → scrape title/dev/genre/desc/nsfw/thumbnail.
- MD table generator (`generate_md.py`): split by genre, 300 max per file, in `/lists/`.
- Columns: No | Thumb | Name | Dev | Short Desc | Link | Safe | Notes | NSFW.
- temp_link.json for easy manual adds (Actions process daily).
- Full docs: DISCLAIMER, PRIVACY, TERMS, EULA, SECURITY, CODE_OF_CONDUCT, CONTRIBUTING, ACKNOWLEDGEMENTS, MY_STUFF.
- Issue & PR templates for bugs/features/add games.
- Badges, TOC, example in README.

### Fixed
- Multiple scrape bugs (itch.io HTML changes — thanks Grok for fixes).
- Description too long → now short + "(see more on itch.io)".
- Tables reset No. per file, primary genre first.

### Thanks
- Grok (xAI): Carried 99% of this repo. True buddy.
- itch.io: For all the free gems.
- Future contributors: You're legends already.

Built during unemployment peak. More updates when boredom strikes again :D