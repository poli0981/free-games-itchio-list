# Terms of Use

Last updated: 2026-05-05

These Terms of Use ("Terms") govern Your use of the Repository, the Webapp, and the Desktop App. They are written in plain language with deliberate humor — but they apply.

> **TL;DR**: Don't break things, don't spam, don't add malware, don't abuse the GitHub API or itch.io. Use the webapp's PAT feature responsibly. The Maintainer can remove anything for any reason.

## 1. Definitions

The defined terms in [EULA §1](EULA.md#1-definitions) apply here as well: "The Repository", "The Webapp", "The Desktop App", "The Catalog", "The Maintainer", "You".

## 2. Acceptance

By viewing, cloning, forking, starring, contributing to, opening an issue against, deploying, running, or otherwise interacting with the Repository, the Webapp, or the Desktop App, You agree to these Terms. If You do not agree, do not use them.

## 3. Permitted uses

You are welcome to:

- Browse the Catalog, on GitHub or via the Webapp / Desktop App.
- Click through to itch.io pages and download games (subject to itch.io's terms and each developer's terms).
- Submit new game URLs via the **[Add Games]** issue template.
- Submit removal requests via **[Remove Games]**.
- Report bugs, suggest features, give feedback via the corresponding templates.
- Open Pull Requests with code, data, or documentation improvements.
- Self-host the Webapp or build the Desktop App for personal, educational, or commercial use under the MIT License.

## 4. Contributor obligations

If You contribute to the Repository (issues, PRs, edits via the Webapp), You represent that:

- The content You submit (code, text, game URLs) is either Your own work or properly attributed and licensed for inclusion.
- Game URLs You submit point to genuinely **free-to-play** games on itch.io. Demos of paid games, "name your own price (minimum > 0)" titles, and timed-free promos do not qualify.
- The submission contains no malware, no phishing, no doxxing, no copyright infringement, and nothing that would embarrass the Maintainer's poor mother.
- You grant the Maintainer the right to incorporate Your contribution into the Repository under the MIT License.

## 5. Prohibited activities

You agree **not** to:

### 5.1 Catalog & content

- Submit games that are not free, that are scams, that distribute malware, or that violate itch.io's terms.
- Spam the issue tracker with low-effort, duplicate, or off-topic posts.
- Submit removal requests for games You do not own (use **Bug Report** or **Feedback** templates instead).
- Post personal information about the Maintainer or any contributor.

### 5.2 Webapp

- Use the Webapp's PAT (Personal Access Token) feature with a token granting access to repositories You are not authorized to write to.
- Attempt to extract another user's PAT from a shared device by exploiting browser-storage access (this is also a violation of GitHub's terms).
- Bypass or attempt to bypass the AES-GCM encryption applied to PATs in `localStorage` to gain unauthorized access.
- Use the Webapp as a relay to perform automated, large-scale GitHub API calls against repositories or organizations You are not authorized to interact with.

### 5.3 itch.io and scraping

- Repeatedly trigger the `update.yml` workflow against URLs in a way that produces unreasonable load on itch.io (the Webapp's Add page rate-limits client-side; do not script around it).
- Fork the scraper, remove the rate-limiting (`scraper.py` already pauses 2.5–5 s between requests + 15–30 s every 20), and run it at high frequency. Itch.io's terms govern automated access; the Maintainer disclaims responsibility for forks that violate them.

### 5.4 Desktop App

- Repackage the signed installers and redistribute them as if they were produced by a different vendor.
- Strip the About page or attribution before redistributing the Desktop App publicly.

### 5.5 General

- Use the Repository, Webapp, or Desktop App for any unlawful purpose under the laws of Your jurisdiction or the Maintainer's (Vietnam).
- Harass, threaten, or impersonate others through any channel related to this project (issues, PRs, Discord servers, social media).

## 6. Personal Access Tokens (PAT) — Your responsibility

The Webapp's optional write features require a GitHub fine-grained PAT. **You** are solely responsible for:

- Choosing a PAT scope that is no broader than what You actually need (typically `Contents: Read & write` + `Actions: Read & write`, scoped to a single repository).
- Choosing a strong passphrase for AES-GCM encryption at rest.
- Locking the PAT (Settings → Lock) when stepping away from a shared device.
- Removing the PAT (Settings → Remove saved PAT) when no longer needed.
- Rotating the PAT if You suspect compromise.

The Maintainer never sees, transmits, or stores Your PAT. See [Privacy Policy](PrivacyPolicy.md) and [Security Policy](../SECURITY.md) for details on the PAT lifecycle.

## 7. Intellectual property

- The code, data structures, scripts, generated tables, webapp source, and documentation are © the Maintainer (poli0981 / SkullMute), licensed under the [MIT License](../LICENSE).
- Games and game metadata (names, descriptions, screenshots, tags) belong to their respective developers and itch.io. See [DISCLAIMER §4](DISCLAIMER.md#4-third-party-content).
- Third-party open-source dependencies are governed by their own licenses; see the **Third-party software** section of the [About page](https://poli0981.github.io/free-games-itchio-list/app/#/about).

## 8. Termination

The Maintainer may, at any time and without notice:

- Remove or modify any content (game entries, documentation, code).
- Reject, close, or hide issues, PRs, or comments that violate these Terms.
- Block users who repeatedly violate these Terms.
- Take down or archive the Repository, the Webapp deployment, or the Desktop App releases.

Tagged releases (`vX.Y.Z`) are intended to remain available, but no SLA is offered.

## 9. Changes to these Terms

The Maintainer may update these Terms. The `Last updated` date at the top reflects the most recent change. Continued use after a change constitutes acceptance. Material changes will additionally be noted in [CHANGELOG.md](../CHANGELOG.md).

## 10. Governing law and disputes

These Terms are governed by the laws of the **Socialist Republic of Vietnam**, without regard to conflict-of-law principles.

Disputes are to be resolved as follows, in order:

1. **Informal first**: open a `[Feedback]` or `[General]` issue or DM via any channel listed on the [About page](https://poli0981.github.io/free-games-itchio-list/app/#/about). Most disagreements end here.
2. **Mediation**: if informal contact fails, the parties may attempt mediation by mutual agreement.
3. **Court**: if all else fails, the competent courts of Vietnam have exclusive jurisdiction.

## 11. Severability

If any provision of these Terms is held invalid or unenforceable, the remaining provisions remain in full force.

## 12. Not legal advice

These Terms are a hobby-project document drafted by a non-lawyer with AI assistance. They are not a substitute for professional legal advice.

## 13. Final vibes

This is still a list of free games + a webapp + a desktop app, built by a tired dev and two LLMs. Be cool, don't break things, have fun, and we all get along.

Questions? Open an issue. Or DM via any channel on the About page. The Maintainer will try not to ghost.

Built with boredom, zero budget, and two AI buddies who actually read the EULA. 🚀
