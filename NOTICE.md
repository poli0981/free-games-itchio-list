# Notice

Last updated: 2026-09-18

Applies from: the release of version 4.0.0.

This file explains who owns what in `free-games-itchio-list` and the website <https://freeitchgames.win>,
and which license applies to which part.

## 1. Not affiliated with itch.io

This is an independent, unofficial hobby project by **poli0981 (SkullMute)** ("the Maintainer"). It is
**not affiliated with, endorsed by, or sponsored by itch.io or Leaf Corcoran / itch corp**. The name
"itch.io" is used only to say where the listed games are published.

The games are hosted on itch.io and belong to their creators, who set their own licenses and terms.
The project does not host or distribute game files. Every game link goes to the game's itch.io page.

## 2. Trademarks

- "itch.io" and the itch.io logo are trademarks of their owner.
- Game names, logos and other marks belong to their respective creators or owners.
- Other product and company names in this repository (for example Cloudflare, GitHub, Discord, Tauri) are
  trademarks of their respective owners.

They are used only to identify the thing they name. That use does not suggest any endorsement.

## 3. Creator content

The catalog copies some material from each public itch.io game page: the game's name, developer,
description text, genre, tags and other metadata, and the cover image URL. **Descriptions and cover images
remain the property of their creators.** The project does not license them to anyone
(see [`data_game/LICENSE.md`](data_game/LICENSE.md), section 3).

Creators and rights holders can ask for a game to be removed or corrected. Email
**takedown@freeitchgames.win** or open the
["Remove a game" issue](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml).
The process is described in the [Terms of Use](docs/ToS.md).

## 4. License map

| Part | What it includes | License | Text |
|---|---|---|---|
| **Code** | Everything not listed below, including `scripts/`, `webapp/`, `bash/`, `.github/workflows/` and `tests/` | MIT, `Copyright (c) 2025-2026 poli0981 (SkullMute)` | [`LICENSE`](LICENSE) |
| **Catalog data** | `data_game/`, `scripts/deleted_games.json`, and the files built from them under <https://freeitchgames.win/data> | CC BY 4.0, for the Maintainer's contribution only. Creator descriptions, cover images, game names and trademarks are **excluded** | [`data_game/LICENSE.md`](data_game/LICENSE.md), [`LICENSES/CC-BY-4.0.txt`](LICENSES/CC-BY-4.0.txt) |
| **Documentation** | `*.md` files in the repository root and in `docs/` (README, policies, guides and their Vietnamese translations) | CC BY 4.0 | [`LICENSES/CC-BY-4.0.txt`](LICENSES/CC-BY-4.0.txt) |
| **Third-party components** | Libraries, frameworks and tools the project uses | Their own licenses | [`docs/THIRD_PARTY.md`](docs/THIRD_PARTY.md) and the [About page](https://freeitchgames.win/about) |
| **Browser extension** | [poli0981/itch-f2p-extension](https://github.com/poli0981/itch-f2p-extension), a separate repository | GPL-3.0 | That repository |

When you reuse the documentation, credit poli0981 (SkullMute), link to this repository and to CC BY 4.0,
and say if you changed it. For the data, use the credit line in
[`data_game/LICENSE.md`](data_game/LICENSE.md), section 4.

The license texts in [`LICENSE`](LICENSE) and [`LICENSES/`](LICENSES/) are reproduced as published by their
authors.

## 5. Code of Conduct attribution

The [Code of Conduct](CODE_OF_CONDUCT.md) and its
[Vietnamese translation](docs/i18n/vi/CODE_OF_CONDUCT.md) are adapted from the
[Contributor Covenant](https://www.contributor-covenant.org), version 2.1, available at
<https://www.contributor-covenant.org/version/2/1/code_of_conduct/>. The Contributor Covenant is licensed
under CC BY 4.0.

## 6. Third-party software

The website, the desktop and Android apps and the data pipeline are built with open-source software that
keeps its own licenses. The list, with licenses, is in [`docs/THIRD_PARTY.md`](docs/THIRD_PARTY.md). The
runtime libraries are also listed on the [About page](https://freeitchgames.win/about). The project's
licenses do not change those licenses.

## 7. Contributions

Contributions follow the rule "inbound = outbound":

- contributions to the **code** are licensed under the **MIT License**;
- contributions to the **data** or the **documentation** are licensed under **CC BY 4.0**.

Only contribute material you have the right to share under those terms.

## 8. Contact

- Content removal and copyright: **takedown@freeitchgames.win**
- Anything else legal: **legal@freeitchgames.win**

---

*This notice is written by a hobby maintainer, not a lawyer, and it is not legal advice. If this file and a
license text disagree, the license text wins.*
