# Changelog — 4.3.x

Release notes for 4.3.0. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [4.3.0] - 2026-10-10 (AI disclosure, accessibility, refreshed catalog)

Version 4.3 reads the rows itch.io has added to game pages (the creator's generative-AI disclosure and
the accessibility features) into the catalog, its filters and its charts, uses the creator's own
tagline as the description, and re-scrapes the whole catalog once.

### Upgrade notes

- **Nothing to accept**: the policies have not changed.
- **The catalog is re-scraped after the release**, in a few batches over a few hours. Until a game has
  been checked again, its AI disclosure shows as "Not disclosed" and its accessibility list is empty.
- **Reusing the data?** Every record gains three optional fields (`ai_disclosure`, `ai_content`,
  `accessibility`), and `description` now holds the creator's tagline when there is one. The 20
  existing fields keep their names and types, and apps 4.0–4.2 ignore the new ones.

### Added

- **Generative AI**: what the creator disclosed on itch.io. "No AI used" means the page's Content row
  says "No generative AI was used". "AI-assisted" comes with what the AI was used for (Graphics, Text,
  Code, Sounds). Otherwise it is "Not disclosed". It appears on the game page, as a filter on Games
  (`?ai=…`) and as a chart (Charts → Overview); a second chart shows what AI-assisted games used AI
  for (Charts → Discovery).
- **Accessibility**: the features itch.io lists, such as Subtitles, Configurable controls, Color-blind
  friendly, High-contrast, One button and Interactive tutorial. They appear on the game page, as a
  filter (`?access=…`) and as a chart (Charts → Discovery).

### Changed

- **Descriptions are the creator's tagline** (itch.io's "short description or tagline", set for about
  87 % of games). Games without one keep the first sentence of their page's description, as before
  (200 characters at most). 18+ suggestions for newly added games still look at that first sentence
  too.
- **The whole catalog is re-scraped once** (`force_update.yml`). Besides the new fields, this picks up
  the tags, platforms, engines, covers, names, authors and publishers that changed on itch.io since
  the games were added.
- **The daily refresh keeps the AI disclosure and accessibility current**, as it already does for the
  status and rating.
- **Re-scrapes keep a known release date and cover.** itch.io shows the "Published" row only for a few
  weeks after a game comes out, so a later re-scrape no longer replaces a known date with N/A.

### Fixed

- **Text from pages that break lines inside a title or link** is read with single spaces: a tag such
  as "Meaningful Choices" no longer carries an embedded line break.
