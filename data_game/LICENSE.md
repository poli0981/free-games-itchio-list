# Catalog data license

Last updated: 2026-09-18

Applies from: the release of version 4.0.0.

> **TL;DR**: The catalog data is **CC BY 4.0**. Reuse it for anything, commercial or not, as long as you
> credit it. That covers only what the Maintainer made: the selection of games, the way the catalog is
> organised, the three Maintainer-written fields, the removal records and the statistics. Game descriptions,
> cover images, game names and trademarks belong to the game creators (and to itch.io for its own marks),
> and this license does not cover them.

## 1. What this file covers

"The Data" means:

- the JSON files in this folder, [`data_game/`](./): `game_info_NNN.json` (the catalog, split into chunks),
  `index.json` (the chunk manifest) and `count_history.json` (the games-over-time series);
- [`scripts/deleted_games.json`](../scripts/deleted_games.json), the public log of removed games and the
  reason each one was removed;
- the files built from them and published under <https://freeitchgames.win/data> (for example
  `https://freeitchgames.win/data/index.json`).

"The Maintainer" means poli0981 (SkullMute), the author of this collection and the licensor.

Source code is covered by the [MIT License](../LICENSE) and documentation by CC BY 4.0. The map of which
license applies to which part of the repository is in [`NOTICE.md`](../NOTICE.md).

## 2. License

The Maintainer's contribution to the Data is licensed under the
**Creative Commons Attribution 4.0 International License (CC BY 4.0)**. The full legal code is in
[`LICENSES/CC-BY-4.0.txt`](../LICENSES/CC-BY-4.0.txt). A plain-language summary is at
<https://creativecommons.org/licenses/by/4.0/>.

The Maintainer's contribution is:

1. **The selection and arrangement of the collection**: which games are in the catalog, which are left out
   or removed, and how the records are structured, organised and split into files.
2. **The three Maintainer-written fields** of every game record:
   - `safe_virus`: a manual note (`?`, `Yes`, `No` or `Caution`);
   - `notes`: free-text notes;
   - `nsfw`: the adult-content flag (`Yes` / `No`).
3. **The removal records** in `scripts/deleted_games.json` (which game was removed, when and why).
4. **The structure and derived statistics**: the record schema, `index.json`, `count_history.json` and other
   figures computed from the catalog.

Under CC BY 4.0 you may copy and redistribute the Data in any medium or format, and remix, transform and
build on it, for any purpose, including commercially, as long as you give credit (section 4).

## 3. Not covered by this license

The Maintainer does not own the following, so this license does not cover them. They belong to others.

- **Game descriptions** and any other text written by game creators (copied from public itch.io game pages).
- **Cover images, thumbnails and other media.** The `thumbnail` field only holds a link to an image that
  belongs to the game's creator.
- **Game names, logos and other trademarks** of the game creators.
- **itch.io's name, logo and other trademarks.**

To reuse any of these beyond what the law already allows where you are, you need permission from the
person who owns it. CC BY 4.0 itself says that it licenses only the rights the licensor holds.

Plain facts such as game URLs, prices, ratings, rating counts, release dates, platforms and tags are not
protected by copyright. You can use them without a license, and the Maintainer does not claim to own them.

The games themselves are hosted on itch.io and licensed by their creators. Nothing in the Data gives you
any right to a game.

## 4. How to give credit

Use this line, or something that carries the same information:

```text
Free itch.io games catalog by poli0981 (SkullMute) — https://freeitchgames.win — CC BY 4.0
```

As Markdown:

```markdown
[Free itch.io games catalog](https://freeitchgames.win) by poli0981 (SkullMute), licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
```

As CC BY 4.0 asks:

- **Link to the license** (the CC BY 4.0 link above is enough).
- **Say if you changed the Data**, for example "filtered to Windows games" or "merged with other data".
- **Do not suggest endorsement.** Do not imply that the Maintainer, itch.io or any game creator supports you
  or your project.

When you show creator material next to the Data (descriptions, cover images), credit the creator and link
to the game's itch.io page.

## 5. Where to get the Data

- **The published JSON**: <https://freeitchgames.win/data> (`index.json` lists the `game_info_NNN.json`
  chunks).
- **This repository**: clone or download [`data_game/`](./) and
  [`scripts/deleted_games.json`](../scripts/deleted_games.json). Git history holds past versions.

Please use these files rather than scraping the website page by page. The [Terms of Use](../docs/ToS.md)
do not allow automated bulk scraping of the website, and the files are cheaper for everyone.

## 6. No warranty

The Data is provided **as is**, without warranty of any kind, as described in CC BY 4.0 (section 5 of the
legal code). Most of it is collected automatically from public itch.io pages. It can be out of date or
wrong: a game can become paid, change or disappear between two checks. `safe_virus` is a manual note, not
a guarantee. The project does not scan downloads. See the [Disclaimer](../docs/DISCLAIMER.md).

## 7. Corrections and removals

Game creators and rights holders can ask for a game to be removed or its data corrected. Email
**takedown@freeitchgames.win** or open the
["Remove a game" issue](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml).
Include the game URL, who you are (creator, rights holder, or someone acting for them) and the reason. The
full process is in the [Terms of Use](../docs/ToS.md).

## 8. Contributions

Contributions follow the rule "inbound = outbound". By contributing to the Data (for example a suggested
correction to `notes`, `safe_virus` or `nsfw`, or game links added through a pull request), you agree that your contribution is licensed under
CC BY 4.0, the same as the Data. Code contributions are licensed under the MIT License.

## 9. Earlier versions

Before version 4.0.0 the whole repository, the catalog data included, was published under the
[MIT License](../LICENSE). Copies you obtained under those earlier terms stay under them. This file applies
to the Data from version 4.0.0 on.

---

*This is a plain-language summary written by a hobby maintainer, not a lawyer, and it is not legal advice.
If this file and the CC BY 4.0 legal code disagree, the legal code wins. Questions:
**legal@freeitchgames.win**.*
