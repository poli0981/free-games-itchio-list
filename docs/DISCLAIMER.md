# Disclaimer

Last updated: 2026-09-18

Applies from: the release of version 4.0.0.

This project — the `free-games-itchio-list` repository and the website **[freeitchgames.win](https://freeitchgames.win)** — is a hobby project: a curated, auto-updating catalog of free games hosted on [itch.io](https://itch.io). It is run by one unemployed Vietnamese dev, poli0981 (SkullMute), called "the Maintainer" below, with AI buddies doing a lot of the heavy lifting. Built for vibes, indie discovery and boredom relief. No grand promises — but the legal-shaped wording below is real.

> **TL;DR**: The website, the apps and the data are provided as-is. The project only links to games; it does not make, host or scan them, and it is not affiliated with itch.io. Adult games are hidden unless you turn them on. Scan everything you download. If you made a game and want it gone, email **takedown@freeitchgames.win**.

## 1. What this Disclaimer covers

This Disclaimer applies to (together, "the Project"):

- the website **https://freeitchgames.win**, including the public Suggest page — read-only for everyone, with no accounts;
- the desktop apps (Windows, macOS, Linux) and the Android APK published on GitHub Releases;
- the catalog data: `data_game/`, `scripts/deleted_games.json`, and the files served under https://freeitchgames.win/data;
- the code, the data pipeline and the documentation in this repository.

It sits alongside the [Terms of Use](ToS.md), the [Privacy Policy](PrivacyPolicy.md) and, for the desktop and Android apps, the [EULA](EULA.md).

## 2. "AS IS" basis

The Project — including the catalog data, the Python pipeline (`scripts/`) and its GitHub Actions workflows, the website and its server code (`webapp/`), the desktop and Android apps (`webapp/src-tauri/`), and the documentation — is provided **"AS IS"** and **"AS AVAILABLE"**, without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, completeness, non-infringement, or uninterrupted or error-free operation.

## 3. Not affiliated with itch.io

The Project is independent. It is **not affiliated with, endorsed by, or sponsored by** itch.io, itch corp or Leaf Corcoran, nor by any developer or publisher whose game appears in the catalog. The name "itch.io" and all game names, logos and trademarks belong to their respective owners; they are used only to identify the games and where they are hosted. A game being listed does not mean its creator supports, or even knows about, the Project.

## 4. A directory of links, not a game host

The Project **does not make, host, distribute, sell or endorse** the games it lists. Every game links to its own page on itch.io, and any download happens there, under itch.io's terms and the creator's own terms or license.

Games reach the catalog through the public Suggest page, the Maintainer's browser extension, or itch.io's public RSS feeds, and nothing is added until the Maintainer approves it. That approval is **not** a security audit, a quality check or an endorsement.

## 5. No warranty as to the games

The Maintainer makes no warranty about any listed game's:

- **Quality, enjoyment or playability** — some titles are gems, others are jank, plenty are in between. Your taste, your call.
- **Safety, integrity or freedom from malware** — the Project does **not** scan downloads. The `safe_virus` field (`?`, `Yes`, `No`, `Caution`) is a manual note written by the Maintainer, not a guarantee, and new games start at `?`. Treat every download as untrusted until you have checked it yourself with reputable anti-malware tools.
- **Content** — see [§6](#6-adult-nsfw-content) for adult content.
- **Accuracy of metadata** — names, developers, descriptions, genres, tags, ratings, platforms and other fields are copied from public itch.io pages and reflect each page as it was at the last check. The daily refresh re-checks about one seventh of the catalog each day, so each game roughly once a week; changes on itch.io (renames, removals, price changes) can take that long to show up.
- **Free-to-play status** — checked when a game is added and at each re-check, but a game can become paid or disappear from itch.io at any time. To avoid removing games because of a temporary glitch, the Project removes a game only when the same problem (the page is gone — HTTP 404/410 — or the game is now paid) is seen again at least 20 hours later. A listed game can therefore be out of date for a while.
- **Statistics and charts** — counts, charts and other figures are derived from the catalog and are for information only.

## 6. Adult (NSFW) content

- Games flagged `nsfw: Yes` are **hidden by default** (their covers are not shown either). You can opt in to 18+ content in **Settings** only after confirming that you are 18 or older. That choice is stored only on your device (your browser's local storage) and is never sent to the Project.
- The flag is best-effort. It is first set automatically from the game's itch.io tags and description when the game is added, and the Maintainer can correct it. A game can still be mislabelled in either direction, so check the itch.io page (and its own content warnings) before you download if this matters to you. To report a wrong flag, use the request process in [§8](#8-removal-and-correction-requests).
- The Project is not directed at children under 16, and adult content is meant only for adults who choose to see it.

## 7. Third-party content and ownership

For each game, the Project copies from its public itch.io page: the name, developer, description text, genre, tags and other metadata, and the cover image URL. The website shows resized copies of cover images, stored on Cloudflare R2 and served from freeitchgames.win; the desktop and Android apps load covers directly from itch.io's image CDN (`img.itch.zone`).

Game descriptions and any other text written by game creators, cover images and other media, game names, logos and trademarks **remain the property of their creators and owners**. The Project does not license them to anyone: the CC BY 4.0 license on the catalog data ([`data_game/LICENSE.md`](../data_game/LICENSE.md)) covers only the Maintainer's own contribution — the selection and arrangement of the collection, the three Maintainer-written fields (`safe_virus`, `notes`, `nsfw`), the removal records, and the structure and derived statistics — and expressly excludes that third-party material. If you reuse the data, clearing rights in the excluded material is up to you.

If you are a creator or rights holder and do not want your content shown, see [§8](#8-removal-and-correction-requests).

## 8. Removal and correction requests

Anyone — game creators and rights holders especially — can ask for a game to be removed or for its data to be corrected:

- email **takedown@freeitchgames.win**, or
- open a ["Remove a game" issue](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml) on GitHub (it also covers copyright claims). GitHub issues are public, so use email for anything you would rather keep private.

Please include the game's itch.io URL, who you are (the creator or rights holder, or someone authorized to act for them), and the reason for the request.

What happens next:

- The Maintainer removes the record from the catalog. The removal is logged with a reason in the public list of removed games (`scripts/deleted_games.json`, shown at https://freeitchgames.win/removed).
- The resized cover copies stored on Cloudflare R2 are deleted, and cached copies expire from Cloudflare's cache.
- Past versions of the data remain in the public git history of the repository. The Maintainer cannot rewrite public history except in exceptional cases of legal necessity.
- Target: within 7 days; urgent legal requests are handled sooner.

The full process is described in the [Terms of Use](ToS.md). Removing a game from the catalog does not remove it from itch.io.

## 9. Availability and third-party services

The website runs on Cloudflare; the code, the data and the app downloads live on GitHub; and the catalog depends on itch.io's public pages and feeds. Any of these can be slow, unavailable, changed or blocked at any time. The Maintainer may change, pause or discontinue any part of the Project at any time and does not promise that it will stay online.

## 10. No liability

To the maximum extent permitted by applicable law, the Maintainer and any contributors shall not be liable for any direct, indirect, incidental, consequential, special, exemplary or punitive damages arising out of or in connection with:

- use of the website, the apps, the catalog data, or any code or documentation in the Project;
- inability to use any of the above (for example site downtime, a failed deploy, or a broken installer or APK);
- any game reached through a link in the catalog (crashes, lost saves, data loss, hardware damage, malware, compromise of accounts on third-party platforms, regret);
- errors, omissions or inaccuracies in the catalog data.

This applies even if the Maintainer has been advised of the possibility of such damages. Nothing in this Disclaimer excludes or limits any liability that cannot be excluded or limited by law, or any mandatory consumer-protection rights you have under the law of your country of residence.

## 11. Governing law and severability

This Disclaimer is governed by the laws of the **Socialist Republic of Vietnam**, without regard to conflict-of-law principles, and disputes are handled as described in the [Terms of Use](ToS.md). Nothing in this section limits the mandatory consumer-protection rights of your country of residence. If any provision is held unenforceable in a particular jurisdiction, the remaining provisions remain in effect.

## 12. Contact

- Removal, correction and copyright requests: **takedown@freeitchgames.win**
- Privacy questions and requests: **privacy@freeitchgames.win**
- Anything else legal: **legal@freeitchgames.win**

These addresses are forwarded to the Maintainer.

## 13. No legal advice

Nothing in this document is legal advice. It is a hobby-project disclaimer drafted by a non-lawyer with AI assistance, and how enforceable it is depends on your jurisdiction. If you actually need legal certainty for something, hire a real lawyer.

## 14. Final vibes

It's still just a list of free games made by a tired dev and some LLMs. Have fun, stay safe, scan your downloads, and remember: life's too short to take random GitHub repos to court.

Built with boredom, AI buddies, and a deep wish to never see a real lawsuit. 🚀
