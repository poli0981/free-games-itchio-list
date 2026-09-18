# Security Policy

Last updated: 2026-09-18

Applies from: the release of version 4.0.0.

Yo — this is a hobby project run by one person, poli0981 (SkullMute), called "the Maintainer" below: a curated catalog of free itch.io games. Since v4 it is made of a **read-only website** at https://freeitchgames.win (served by a Cloudflare Worker), a **Python data pipeline** on GitHub Actions, and **read-only desktop and Android apps**. There are no public accounts, no sign-in and no payments; the only login is the Maintainer's own admin page, protected by Cloudflare Access. Small attack surface — but if you find a hole, the Maintainer really wants to hear about it.

## 1. Reporting a vulnerability

Please **don't** report vulnerabilities in public issues, discussions, pull requests or Discord. Report them privately instead:

- **GitHub private vulnerability reporting**: the repository's **Security** tab → **Report a vulnerability** ([direct link](https://github.com/poli0981/free-games-itchio-list/security/advisories/new)), or
- email **security@freeitchgames.win**.

A good report includes:

- what is affected (URL or endpoint, workflow, or app version and platform);
- steps to reproduce, or a working proof of concept;
- the impact you think it has;
- whether, and how, you would like to be credited.

## 2. Scope

**In scope**

- The website https://freeitchgames.win and its Cloudflare Worker, including the image proxy (`/img`), the Suggest API (`/api/suggest`), the ingest API used by the Maintainer's browser extension (`/api/ingest`), and the admin app and API (`/admin`, `/api/admin`).
- The data pipeline (`scripts/`) and the GitHub Actions workflows (`.github/workflows/`).
- The desktop apps and the Android APK published on [GitHub Releases](https://github.com/poli0981/free-games-itchio-list/releases).
- The published data (`data_game/`, `scripts/deleted_games.json`, and https://freeitchgames.win/data) — for example, a way to get content into the catalog without the Maintainer's approval.

**Out of scope**

- itch.io itself — report to itch.io.
- Platform issues in Cloudflare or GitHub — report to them through their own programs.
- The games linked from the catalog. A game that contains malware is not a vulnerability in this project, but please still tell the Maintainer at **takedown@freeitchgames.win** so it can be flagged or removed.
- Volumetric denial-of-service (DoS/DDoS) and load testing.
- Reports from automated scanners without a working proof of concept.

The browser extension (poli0981/itch-f2p-extension) lives in its own repository; report issues in the extension itself there. Issues in the ingest API it talks to are in scope here.

## 3. Supported versions

| Component | Supported |
|---|---|
| The live website (https://freeitchgames.win) | Yes |
| The latest release (4.x) of the desktop and Android apps | Yes |
| Older releases (including all 3.x and earlier) | No — please update |

Fixes to the website go live when they are deployed. The apps do not update themselves: fixes ship in a new release, which you download from GitHub Releases.

## 4. What to expect

- **Acknowledgement**: target within **7 days**. This is a solo hobby project, so that is a target rather than a guarantee, and often it will be much sooner.
- The Maintainer will check whether the issue is valid, work on a fix, and keep you updated.
- Please keep the details private until a fix is out, or until you and the Maintainer agree on a disclosure date.
- **Credit**: if you want it, you will be credited in the release notes.
- There is no bug bounty (bank account < $50), just credit and eternal thanks.

## 5. Safe harbor

If you research security in good faith and follow this policy, the Maintainer will consider that research authorized, will not take or support legal action against you for it, and will not treat it as a breach of the [Terms of Use](docs/ToS.md) rules on unauthorized access or automated use. To stay within safe harbor:

- **Avoid privacy violations.** Do not access, change, keep or share data that isn't yours beyond the minimum needed to show the issue (for example, notes submitted through the Suggest page, the review queue, or the admin audit log). If you come across personal data, stop and report it.
- **Avoid service disruption.** No denial-of-service, no high-volume automated scanning or scraping, no spamming the Suggest form, and no attempts to exhaust rate limits.
- **Don't change anything.** Do not modify or delete catalog data, the review queue or the repository, and do not approve or reject items, push commits or trigger releases, even if you find a way to.
- **No social engineering, phishing or physical attacks** against the Maintainer or anyone else, and no attacks on anyone's Cloudflare, GitHub or itch.io accounts.
- **Give the Maintainer reasonable time** to fix the issue before you disclose it publicly.

This safe harbor covers only the Maintainer's own claims. It cannot authorize testing of Cloudflare, GitHub or itch.io; their own policies apply. If you are unsure whether something is OK, ask first at **security@freeitchgames.win**.

## 6. Dependency and supply-chain security

What the repository actually does:

- **Dependabot** ([`.github/dependabot.yml`](.github/dependabot.yml)) is configured to keep npm, pip, GitHub Actions and cargo dependencies current.
- Every third-party **GitHub Action is pinned by full commit SHA**, and each workflow declares least-privilege `permissions`.
- Writes to the repository from the website's admin go through a **GitHub App** (verified commits), and the admin page is behind Cloudflare Access (GitHub login or one-time email PIN) and limited to the Maintainer.
- The Suggest form is protected by Cloudflare Turnstile and rate limiting.
- The Android APK is signed with the project's key. Install it, and the desktop apps, only from the project's [GitHub Releases](https://github.com/poli0981/free-games-itchio-list/releases) page.

If a known vulnerability in a dependency actually affects a deployed component (the website, the Worker, the pipeline or the apps), report it privately as in [§1](#1-reporting-a-vulnerability). If it is just an outdated dependency with no practical impact, a normal issue or pull request is fine.

## 7. Scams and impersonation

The project has no accounts and takes no payments, so nobody from the project will ever ask for your password, a token or payment details. The only official website is https://freeitchgames.win (the old github.io address only redirects there), and the only official downloads are on GitHub Releases. If you see something pretending to be this project, please tell the Maintainer at **security@freeitchgames.win**.

## 8. Final vibes

Stay safe out there — especially when downloading random free games. Thanks for reporting responsibly. You're better at security than the Maintainer already. 🚀
