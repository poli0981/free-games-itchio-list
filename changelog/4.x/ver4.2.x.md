# Changelog — 4.2.x

Release notes for 4.2.0. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [4.2.0] - 2026-10-03 (Compact catalog data, themed scrollbars)

Version 4.2 sends the catalog in a compact binary format that is about half the size on a first
visit, keeps the offline copy compressed, points everyone who wants the raw data to the GitHub
repository, and adds themed scrollbars with an option to hide them.

### Upgrade notes

- **Updated Privacy Policy, Terms of Use and EULA** (the data now comes from the repository; the
  compressed cache; the scrollbar setting): the site and the apps ask you to accept them again once.
- **Website**: the first visit after the update downloads the catalog once in the new format; after
  that only the parts that changed are fetched.
- **Desktop and Android apps 4.0–4.1.1 keep working**: they still get the older JSON files. Install
  4.2.0 over them as usual to get the smaller downloads.
- **Reusing the data?** `https://freeitchgames.win/data/*.json` now answers 410 in a browser or a
  script. Get the same files from the repository: [`data_game/`](../../data_game/) and
  [`scripts/deleted_games.json`](../../scripts/deleted_games.json) (CC BY 4.0, as before).

### Added

- **Themed scrollbars**: slim, rounded, in the site's greys (the accent while you drag), in light and
  dark mode, on the page and in every scrolling panel. Phones keep their own overlay scrollbars.
- **Hide scrollbars** (Settings → Appearance, and the display menu): hides every scrollbar, the page's
  included. Scrolling with the mouse wheel, touchpad, touch and keyboard still works.

### Changed

- **Catalog packs.** The site and the apps read `/data/pack/manifest-v1.json` plus small compressed
  `.bin` packs: the catalog stored by column with dictionaries, then deflated at build time
  ([`webapp/src/lib/data/pack-format.ts`](../../webapp/src/lib/data/pack-format.ts),
  [`webapp/vite-plugins/catalog-data.ts`](../../webapp/vite-plugins/catalog-data.ts)). A pack's name is a
  hash of its bytes, so it is cached for good and a returning visitor downloads only the packs that
  changed (usually 1–3 of 7 a day). First visit: about 264 KB instead of about 520 KB of JSON.
- **Descriptions load when needed**: they are about 40 % of the catalog, so they live in their own
  packs. A game page loads the descriptions of its chunk (about 25 KB); a search loads all of them
  and adds the matches found in descriptions when they arrive ("Searching descriptions…").
- **Offline copy compressed**: the catalog kept in IndexedDB (`webapp.query-cache`) is stored as
  compressed bytes instead of readable JSON, about 300 KB instead of 2 MB.
- **Readable JSON for the old apps only**: `/data/index.json`, `game_info_NNN.json`,
  `count_history.json`, `deleted_games.json` and `urls.json` are answered by the Worker, which passes
  them to the desktop/Android apps 4.0–4.1.1 (recognised by their `Origin`) and gives everyone else a
  410 with links to the repository ([`webapp/worker/legacy-data.ts`](../../webapp/worker/legacy-data.ts)).
- **Policies** (2026-10-03): programmatic access to the data goes through the repository; the
  compressed cache and the scrollbar setting are listed.
- Dependencies: `fflate` added (only loaded where the browser can't decompress by itself: Safari and
  iOS before 16.4); `@tanstack/query-async-storage-persister` removed (replaced by a small binary
  persister, [`webapp/src/lib/data/persister.ts`](../../webapp/src/lib/data/persister.ts)).

### Fixed

- **Cover images** (`/img`): other spellings of a width (`/img/0160/…`, `160.0`) no longer create
  duplicate cache entries; an original served while resizing was unavailable, and a missing image,
  are now kept at the edge for a day instead of being fetched again on every request; failed
  background writes to R2 or the edge cache are logged.
- **Chart cards** with a list (recently removed, tag cloud): their scrollbar can be dragged and their
  text selected again; clicks on the charts themselves still don't move focus.
