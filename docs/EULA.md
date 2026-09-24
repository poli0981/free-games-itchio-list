# End-User License Agreement (EULA)

Last updated: 2026-09-24

Applies from: the release of version 4.1.0.

This EULA applies **only to the desktop and Android apps** of Itch.io Free Games DB: the installers (`.msi`, `.exe`, `.dmg`, `.pkg`, `.app.tar.gz`, `.deb`, `.rpm`, `.AppImage`) and the Android `.apk` published on GitHub Releases. It does **not** cover:

- the website <https://freeitchgames.win>, which is covered by the [Terms of Use](ToS.md);
- the source code, which is under the [MIT License](../LICENSE);
- the catalog data, which is under CC BY 4.0 (see [`data_game/LICENSE.md`](../data_game/LICENSE.md) and the [full legal code](../LICENSES/CC-BY-4.0.txt));
- the games themselves, which are licensed separately by their developers via itch.io.

> **TL;DR**: The apps are free, MIT-licensed, read-only viewers for the catalog. No account, no ads, no telemetry. Get them only from GitHub Releases, update them by hand, and use them at your own risk. The games are not yours just because they're listed here.

## 1. Definitions

- **"The App"**: the Tauri 2 builds of Itch.io Free Games DB, meaning the desktop apps for Windows, macOS and Linux and the Android app (arm64-v8a, Android 11 or later), as published by the Maintainer on the [GitHub Releases page](https://github.com/poli0981/free-games-itchio-list/releases).
- **"The Website"**: <https://freeitchgames.win>.
- **"The Catalog"**: the free-game metadata in `data_game/` that the Website publishes at <https://freeitchgames.win/data> and the App displays.
- **"The Repository"**: `free-games-itchio-list` on GitHub at <https://github.com/poli0981/free-games-itchio-list>, which holds the App's source code.
- **"The Maintainer"**: the GitHub user `poli0981` (a.k.a. SkullMute), an individual in Vietnam who maintains the project as a hobby.
- **"You"**: the person or organization that installs or uses the App.

## 2. Grant of license

The App is built from the source code in the Repository, which is licensed under the **MIT License** (see [`LICENSE`](../LICENSE) for the canonical text; `Copyright (c) 2025-2026 poli0981 (SkullMute)`). Under that license You may, free of charge:

- install and run the App on as many devices as You like, for any purpose, personal or commercial;
- copy and redistribute the installers or the APK, as long as You keep the copyright and license notice;
- build Your own version from the source code (section 8 explains how to keep it clearly separate from official releases).

Third-party components bundled in the App (React, Tauri and others) stay under their own licenses. See [`THIRD_PARTY.md`](THIRD_PARTY.md) or the About page in the App.

Nothing in this EULA takes away a permission the MIT License gives You over the source code. If the two ever conflict, the MIT License wins for the code.

## 3. What the App is (and is not)

- A **read-only viewer**: You can browse, search, filter and chart the Catalog. There are no accounts, no sign-in, no editing, no comments, no ads and no payments.
- Suggesting a game happens on the Website (<https://freeitchgames.win/suggest>). The App only links there.
- Games flagged as adult content (`nsfw: Yes`) are hidden by default, covers included. You can turn them on in Settings after confirming that You are 18 or older.
- The `safe_virus` field is a manual note by the Maintainer, not a guarantee. The project does not scan any game or download linked from the App.
- On first launch, the App shows the same legal screen as the Website and asks You to accept the project's terms. It asks again when those terms change.

## 4. Network connections and privacy

The App has **no telemetry**: no analytics, no crash reporting, no tracking. It connects to only two places:

- **freeitchgames.win**, to download the Catalog JSON from <https://freeitchgames.win/data>. The Website runs on Cloudflare, which processes ordinary request data (such as Your IP address and user agent) to deliver it, as described in the [Privacy Policy](PrivacyPolicy.md).
- **img.itch.zone**, itch.io's image server, to load cover images directly. itch.io receives ordinary request data for those images, as with any image loaded from the web (see the [itch.io privacy policy](https://itch.io/docs/legal/privacy-policy)).

When You click a game or another outside link, it opens in Your default browser (itch.io, GitHub or the Website). From then on, that site's own terms and privacy policy apply.

The App keeps Your preferences (language, theme, layout density, the 18+ choice, and which version of the legal terms You accepted) and a cached copy of the Catalog (kept up to 7 days) on Your device only. None of it is sent to the Maintainer.

## 5. Installation, updates and removal

- **Get the App only from the [GitHub Releases page](https://github.com/poli0981/free-games-itchio-list/releases).** Copies from anywhere else may have been modified, and the Maintainer is not responsible for them.
- **Android:** the APK is not on Google Play. It is sideloaded, so Android asks You to allow installs from the app You downloaded it with (for example Your browser or file manager). The APK is signed with the project's key. It needs Android 11 or later on an arm64-v8a device.
- **macOS:** the App needs Safari/WebKit 16.4 or later.
- **Updates are manual.** The App does not update itself or check for updates. To update, download and install a newer release. Only the latest release is supported.
- **Removal:** uninstall the App like any other app. Uninstalling removes the App and its local data. If a desktop uninstaller leaves the App's data folder behind (it is named `com.poli0981.freegamesitchio`), You can delete that folder yourself.
- The App depends on the Website for its data. If the Website is unavailable, the App can only show its cached copy, if it has one.

## 6. What this EULA does NOT cover

This EULA does not grant any rights to:

- **The games listed in the Catalog.** Each game belongs to its developer and is licensed by them via itch.io. The App shows a link and metadata only. Downloading, playing, modifying or redistributing a game is governed by the developer's own terms and by itch.io's terms.
- **Content created by others**: game names, descriptions and other text written by game creators, cover images and other media, logos and trademarks. They are shown so You can find and identify the games, and they remain the property of their owners. Game creators can ask for removal (see the [Terms of Use](ToS.md) or email takedown@freeitchgames.win).
- **itch.io's trademarks, logos or service marks.** The project is not affiliated with, endorsed by or sponsored by itch.io. The itch.io name is used for identification only.
- **Third-party libraries** bundled in the App, which keep their own licenses.
- **The Website, the Catalog data and the source code**, which are covered by the Terms of Use, CC BY 4.0 and the MIT License respectively.

## 7. Acceptance

You accept this EULA by installing or using the App, for example by accepting it in a Windows installer or by installing the APK. If You do not agree, do not install the App, or uninstall it.

## 8. Acceptable use

You agree not to:

- Present a modified build as an official release, for example by distributing it under the project's name and icon, or with the official app identifier `com.poli0981.freegamesitchio`, without clearly marking it as unofficial. Forks are welcome under the MIT License; just make it obvious they are Yours.
- Use the Maintainer's name, the GitHub handle `poli0981`, or the alias "SkullMute" to endorse or promote derivative works without prior written permission.
- Use the App, or a modified version of it, in a way that breaks the Website's [Terms of Use](ToS.md), for example automated bulk requests beyond the published `/data` files, or attempts to reach the admin area or the ingest API without authorization.
- Use the App or its installers to host, distribute or facilitate malware, phishing, or content that violates applicable law.

These rules are about how You use the App and the project's name and services. They sit alongside the MIT License and do not limit the rights it grants over the source code.

## 9. No warranty and limitation of liability

The App is provided **"as is"** and **"as available"**, without warranty of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, accuracy or completeness of the Catalog, uninterrupted operation, and non-infringement.

To the extent permitted by applicable law, the Maintainer and contributors are not liable for any damages arising from installing or using the App, from being unable to use it, or from games and pages You reach through it. See the [Disclaimer](DISCLAIMER.md) for details.

## 10. Changes and termination

The Maintainer may change or stop the App, its releases or the Website at any time. Published releases stay on GitHub Releases unless explicitly withdrawn.

New versions of this EULA are published in the Repository and included with later releases, and the App's legal screen asks You again when the project's terms change.

Your rights under this EULA end automatically if You materially breach it. You can end it at any time by uninstalling the App. The MIT License grant over the source code survives termination of this EULA to the extent the MIT terms permit.

## 11. Governing law

This EULA is governed by the laws of the **Socialist Republic of Vietnam**, without regard to conflict-of-law principles. Any dispute that cannot be resolved informally shall be brought before the competent courts of Vietnam.

Nothing in this EULA limits mandatory consumer-protection rights that the law of Your country of residence gives You.

The MIT License itself is internationally portable and is interpreted as such.

## 12. Severability

If any provision of this EULA is held invalid or unenforceable in a jurisdiction, the remaining provisions remain in full force, and the invalid provision is replaced (only as to that jurisdiction) with one that most closely matches the original intent.

## 13. Contact

- Questions about this EULA, or anything else legal: legal@freeitchgames.win
- Privacy requests: privacy@freeitchgames.win
- Content removal and copyright: takedown@freeitchgames.win
- Security vulnerabilities in the App: security@freeitchgames.win or GitHub private vulnerability reporting (see [SECURITY.md](../SECURITY.md)). Please don't open public issues for vulnerabilities.

## 14. Not legal advice

This EULA is a hobby-project document drafted by a non-lawyer with AI assistance. It is not a substitute for professional legal advice. If You need legal certainty for a serious deployment, consult a licensed attorney.

## 15. Final vibes

This is still a hobby project born from unemployment, boredom, and a stubborn refusal to delete the repo. Install the app, fork it, ignore it. Build something cooler. Have fun hunting free games, or don't. Nobody's judging (except maybe the Maintainer, judging their own code).

Built with zero budget, too much free time, and two AI buddies. 🚀

**P/S:** Nobody reads EULAs. You're probably the first :D
