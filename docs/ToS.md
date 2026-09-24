# Terms of Use

Last updated: 2026-09-24

Applies from: the release of version 4.1.0.

These Terms of Use ("Terms") govern your use of the website **https://freeitchgames.win**, the desktop and Android apps, and the public catalog data of `free-games-itchio-list`. They are written in plain language, but they are a real agreement. They replace the older Terms and also cover what the old web-app "EULA" used to say; the [EULA](EULA.md) now covers only the app installers and the Android APK.

> **TL;DR**: Browse, share, fork the code (MIT) and reuse the data with credit (CC BY 4.0). Don't bulk-scrape the site (use the `/data` files), don't hotlink `/img`, don't spam the Suggest form, don't poke at `/admin`, and don't pretend to be itch.io or the Maintainer. Game creators can get a game removed or corrected. Adult content stays hidden unless you opt in.

## 1. Definitions

- **"The Website"**: https://freeitchgames.win, including its pages and endpoints (such as `/data`, `/img`, `/suggest` and `/api/…`). The old address https://poli0981.github.io/free-games-itchio-list/ only redirects to it.
- **"The Apps"**: the desktop apps (Windows, macOS, Linux) and the Android APK built from the same code and distributed on GitHub Releases. They are read-only viewers of the Catalog.
- **"The Catalog"**: the list of games and their data: `data_game/`, `scripts/deleted_games.json`, and the files derived from them and served under https://freeitchgames.win/data.
- **"The Repository"**: https://github.com/poli0981/free-games-itchio-list, including its code, data, documentation, issues and discussions.
- **"The Project"**: the Website, the Apps, the Catalog and the Repository together.
- **"Games"**: the games on itch.io that the Catalog lists and links to.
- **"The Maintainer"**: poli0981 (SkullMute), an individual in Vietnam who runs the Project as a hobby.
- **"You"**: any person, or any automated agent, that uses the Project.

## 2. Acceptance and age

- By using the Website or the Apps, you agree to these Terms and to the policies they refer to: the [Privacy Policy](PrivacyPolicy.md), the [Disclaimer](DISCLAIMER.md) and, for the Apps, the [EULA](EULA.md).
- On your first visit, the Website and the Apps show a legal gate that lists these documents. You accept them by ticking the box and choosing "Accept & continue". If you decline, the Website and the Apps stay locked; in that case, please don't use them.
- You must be **at least 16 years old** to use the Website or the Apps; the legal gate asks you to confirm this. Adult content requires you to be **18 or older** (see section 8).
- When you contribute through GitHub (issues, pull requests, comments, discussions), these Terms apply to your contribution alongside GitHub's own terms and the [Code of Conduct](../CODE_OF_CONDUCT.md).

## 3. What the Project is (and is not)

- A curated, automatically updated catalog of free games on itch.io. Most of each game's data is copied from its public itch.io page and re-checked on a schedule; only three fields (`safe_virus`, `notes`, `nsfw`) are written by the Maintainer.
- The Website is **read-only for everyone**: there are no accounts, no sign-in, no comments, no ads and no payments. The admin area is for the Maintainer only.
- The Project does **not** host, sell or distribute any game. Every game link goes to itch.io, where downloading and playing are governed by itch.io's terms and each creator's own terms.
- The Project is provided free of charge, as a hobby. There is no service-level agreement.

## 4. What you may do

- Browse the Website and the Apps, and follow links to itch.io.
- Share links to the Website and to game pages.
- Download and reuse the Catalog data under **CC BY 4.0**, with credit (see section 11). For programmatic access, use the published JSON files under https://freeitchgames.win/data or the Repository; please cache them instead of downloading them again on every request.
- Use, fork, modify and redistribute the code under the **MIT License**.
- Suggest a free itch.io game on the Suggest page (see section 5).
- Report bugs, give feedback and open pull requests through the Repository's templates.
- Ask for a game to be removed or its data corrected (see section 7).

## 5. Suggestions and contributions

- **Suggest page** (https://freeitchgames.win/suggest): you can submit an itch.io game link and an optional note of up to 500 characters. The page uses Cloudflare Turnstile against spam and is rate limited.
- The note is seen only by the Maintainer and is deleted after 180 days. **Do not put personal data in it.** See the [Privacy Policy](PrivacyPolicy.md).
- Every suggestion goes into a **review queue**. Nothing enters the Catalog until the Maintainer approves it, and the Maintainer has no obligation to accept a suggestion or to reply. Approved links are then scraped by the pipeline, and games that turn out to be paid are dropped.
- Only genuinely **free-to-play** games on itch.io qualify. Demos of paid games, "name your own price" titles with a minimum above zero, and time-limited free promotions do not.
- By submitting anything to the Project (a suggestion, an issue, a pull request or a comment), you confirm that:
  - it is your own work, or you have the right to share it;
  - it contains no malware, phishing, scams, doxxing, copyright infringement or illegal content, and does not link to any;
  - you are not using it to send someone else's personal data.
- **Inbound = outbound**: contributions to the code are licensed under the MIT License, and contributions to the data and documentation under CC BY 4.0, the same licenses the Project uses.
- Issues, pull requests and comments are public on GitHub under your account.

## 6. What you may not do

You agree **not** to:

1. **Bulk-scrape** the Website or its API beyond the published `/data` files. Use the `/data` JSON files or the Repository instead; it is cheaper for everyone.
2. **Abuse the image proxy** (`/img`): it exists only to show cover images on the Website. Don't hotlink `/img` URLs from other sites or apps, and don't use it to fetch images in bulk.
3. **Access restricted areas without authorization**: `/admin`, the admin API (`/api/admin/…`) and the ingest API (`/api/ingest`) are for the Maintainer only. Good-faith security research is welcome under the rules of the [Security Policy](../SECURITY.md).
4. **Spam the Suggest form**, or circumvent the Website's verification check, Turnstile or the rate limits (for example with scripts, shared verification cookies or rotating IP addresses).
5. **Submit links to malware**, scams, phishing, or illegal content, anywhere in the Project.
6. **Misrepresent affiliation**: don't claim to be the Maintainer or the Project, don't present a fork or copy as the official Project, don't claim that the Project is run or endorsed by itch.io, and don't use the names "poli0981" or "SkullMute" to endorse your own work without prior written permission.
7. **Disrupt the Project**: don't attempt to overload, break or impair the Website (for example by denial-of-service), and don't use the Project to put unreasonable load on itch.io. If you run the pipeline code yourself, you are responsible for complying with itch.io's terms and for keeping its request pacing.
8. **Make false removal or copyright claims**, or claim to be a game's creator or rights holder when you are not.
9. **Harass, threaten, dox or impersonate** anyone through any channel related to the Project (issues, pull requests, discussions, Discord, social media).
10. Use the Project for any purpose that is unlawful where you are or in Vietnam.

## 7. Content removal and copyright

Anyone can ask for a game to be removed from the Catalog or for its data to be corrected. Game creators and rights holders are especially welcome to do so.

**How to ask**

- Email **takedown@freeitchgames.win**, or
- open a ["Remove a game" issue](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml) in the Repository (it includes a copyright-claim section). GitHub issues are public, so use email for anything you don't want published.

**Include**

- the game's itch.io URL (or its page on the Website);
- who you are: the creator, the rights holder, or someone authorized to act for them;
- the reason (for example: a copyright claim, you don't want the game listed, the data is wrong, or the game is no longer free). For a copyright claim, say which material (for example the description or the cover image) the claim is about.

**What happens**

- The Maintainer removes the record from the Catalog and logs the removal, with a reason, in the public list of removed games (https://freeitchgames.win/removed).
- The resized copies of the cover image stored on Cloudflare R2 are deleted, and cached copies expire from Cloudflare's cache.
- The Git history of the public Repository keeps past versions of the data. The Maintainer cannot rewrite public history, except where there is an exceptional legal necessity. Copies that others have already made (forks, downloaded data) are outside the Maintainer's control.
- Target: within **7 days**; urgent legal requests are handled sooner. If a request is unclear, the Maintainer may ask follow-up questions.

## 8. Adult (NSFW) content

- Games flagged `nsfw: Yes` are **hidden by default**, cover images included.
- You can opt in to 18+ content in Settings (https://freeitchgames.win/settings) after confirming that you are **18 or older**. By opting in, you also confirm that viewing such content is lawful where you are. The choice is stored only in your browser (`webapp.prefs`), and you can switch it off at any time.
- The `nsfw` flag is a best-effort label and may be wrong. Check the itch.io page yourself before downloading if this matters to you.

## 9. Games, safety and third-party services

- The Games belong to their creators and are provided by them through itch.io. The Project has no control over them.
- The Project does **not** scan downloads. The `safe_virus` field is a manual note, not a guarantee. Treat every download as untrusted until you have checked it yourself. See the [Disclaimer](DISCLAIMER.md).
- The Project relies on third-party services such as itch.io, GitHub and Cloudflare, which have their own terms and policies. The [Privacy Policy](PrivacyPolicy.md) explains what each of them processes.

## 10. No affiliation with itch.io

The Project is **not affiliated with, endorsed by, or sponsored by itch.io** or Leaf Corcoran / itch corp. "itch.io", game names, logos and other trademarks belong to their respective owners and are used only to identify the games and the platform. See [NOTICE.md](../NOTICE.md).

## 11. Intellectual property and licenses

- **Code** (everything in the Repository not listed below, such as `scripts/`, `webapp/`, `bash/`, workflows and tests): **MIT License**, Copyright (c) 2025-2026 poli0981 (SkullMute). See [`LICENSE`](../LICENSE).
- **Catalog data** (`data_game/`, `scripts/deleted_games.json`, and the derived files under https://freeitchgames.win/data): **CC BY 4.0** for the Maintainer's contribution, namely the selection and arrangement of the collection, the three Maintainer-written fields (`safe_virus`, `notes`, `nsfw`), the removal records, and the structure and derived statistics. See [`data_game/LICENSE.md`](../data_game/LICENSE.md) and the full legal code in [`LICENSES/CC-BY-4.0.txt`](../LICENSES/CC-BY-4.0.txt).
  - Suggested attribution: `Free itch.io games catalog by poli0981 (SkullMute) — https://freeitchgames.win — CC BY 4.0`
- **Not licensed by the Project** (owned by others): game descriptions and any other text written by game creators; cover images, thumbnails and other media; game names, logos and trademarks; and itch.io's trademarks. To reuse these, you need the owner's permission or a legal exception that applies to you. Facts such as URLs, prices and ratings are not protected by copyright anyway.
- The cover images shown on the Website are resized copies served for display only; they remain the property of their creators.
- **Documentation** (the `*.md` files in the repository root and in `docs/`, including the README and these policies): **CC BY 4.0**.
- **Third-party components** keep their own licenses. See the About page (https://freeitchgames.win/about) and [`docs/THIRD_PARTY.md`](THIRD_PARTY.md).

## 12. No warranty and limitation of liability

- The Project is provided **"as is" and "as available"**, without warranties of any kind, including accuracy, completeness, availability, a game's free status, or safety. Details are in the [Disclaimer](DISCLAIMER.md).
- To the extent permitted by law, the Maintainer and contributors are not liable for any damage arising from the use of the Project, from any Game or third-party site reached through it, from downtime, or from errors in the data.
- Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law.

## 13. Changes to the service, moderation and termination

The Maintainer may, at any time and without notice:

- change, suspend or discontinue the Website, the Apps or the published data;
- remove or change any content (game entries, documentation, code);
- reject suggestions, and close, lock or hide issues, pull requests or comments that break these Terms;
- block people who repeatedly break these Terms, and limit or block traffic that abuses the Website.

If you break these Terms, your permission to use the Website and the Apps ends. Any rights you have received under the MIT License or CC BY 4.0 are governed by those licenses. Tagged releases (`vX.Y.Z`) are intended to remain available on GitHub Releases, but this is not guaranteed.

## 14. Changes to these Terms

- The Maintainer may update these Terms. New versions are published in the Repository, with the `Last updated` date at the top, and material changes are noted in [CHANGELOG.md](../CHANGELOG.md).
- When a change requires your acceptance again, the `LEGAL_VERSION` value in the Website and the Apps changes, and the legal gate asks you to accept the updated documents before you continue. If you don't accept them, please stop using the Website and the Apps.

## 15. Governing law and disputes

- These Terms are governed by the laws of the **Socialist Republic of Vietnam**, without regard to conflict-of-law principles.
- Disputes are handled in this order:
  1. **Informally first**: email **legal@freeitchgames.win**, open an issue, or use a contact channel listed on the About page (https://freeitchgames.win/about). Most disagreements end here.
  2. **Mediation**: if informal contact fails, the parties may try mediation by mutual agreement.
  3. **Courts**: otherwise, the competent courts of Vietnam have jurisdiction.
- **Consumer rights**: nothing in these Terms limits the mandatory consumer-protection rights you have under the law of your country of residence, including any right that law gives you to bring a claim in your local courts.

## 16. Severability and translations

- If any provision of these Terms is held invalid or unenforceable, the remaining provisions remain in full force.
- Translations (such as the Vietnamese version in [`docs/i18n/vi/`](i18n/vi/ToS.md)) are provided for convenience. If a translation differs from this English version, the English version prevails.

## 17. Contact

These addresses are forwarded to the Maintainer by Cloudflare Email Routing.

- **legal@freeitchgames.win**: these Terms and anything else legal.
- **takedown@freeitchgames.win**: content removal and copyright.
- **privacy@freeitchgames.win**: privacy questions and requests.
- **security@freeitchgames.win**: vulnerabilities (or GitHub's private vulnerability reporting; see the [Security Policy](../SECURITY.md)).

## 18. Final vibes

This is still a list of free games plus a website and a few apps, built by a tired dev with zero budget and two AI buddies. Be cool, don't break things, credit the data, and have fun hunting free games.

Questions? Email legal@freeitchgames.win, open an issue, or use any channel on the About page. The Maintainer will try not to ghost.

## 19. Not legal advice

These Terms are a hobby-project document drafted by a non-lawyer with AI assistance. They are not a substitute for professional legal advice.
