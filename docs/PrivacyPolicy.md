# Privacy Policy

Last updated: 2026-05-10

This Privacy Policy describes how the Repository, the Webapp, and the Desktop App handle Your data. The short version: the Maintainer collects nothing on any server he controls. Everything that persists, persists locally on Your device.

> **TL;DR**: No backend, no analytics, no cookies, no tracking, no telemetry. The Webapp keeps a few items in `localStorage` (theme, sidebar state, optional encrypted PAT) and an IndexedDB cache of the public catalog. The Desktop App fetches itch.io and GitHub directly to bypass CORS. That's the entire data story.

## 1. Definitions

The defined terms in [EULA §1](EULA.md#1-definitions) apply here as well.

## 2. Maintainer-side data collection

**The Maintainer collects, stores, and processes zero personal data on any server he controls.** There is no backend, no database, no analytics service, no error-reporting endpoint, no telemetry, no advertising, no fingerprinting.

The Repository runs entirely on:

- **GitHub** (source hosting, Actions, raw file CDN, Pages hosting for the Webapp).
- **Your device** (the Webapp in Your browser, or the Desktop App in a Tauri 2 webview).
- **itch.io** (game pages, fetched on demand by the scraper or the Desktop App's preview feature).

The Maintainer has no infrastructure that could collect Your data even if he wanted to.

## 3. GitHub

This Repository, the Webapp deployment (GitHub Pages), and the Desktop App release artifacts are hosted on GitHub. GitHub may log standard HTTP request data (IP address, user agent, referrer) per their own policies. The Maintainer has no access to those logs beyond GitHub's repository insights (aggregate clone / view counts).

GitHub's privacy policy: <https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement>

When You contribute (open an issue, comment, fork, submit a PR), You publish that information on GitHub under Your account. The Maintainer sees only what GitHub makes public.

## 4. itch.io

All game links in the Catalog point directly to itch.io pages. Clicking a link takes You to itch.io; what happens there is governed by itch.io's terms and privacy policy:

- itch.io Privacy Policy: <https://itch.io/docs/legal/privacy-policy>
- itch.io Terms of Service: <https://itch.io/docs/legal/terms>

The Repository's `update.yml` GitHub Action also makes server-to-server requests to itch.io to scrape page metadata; those requests come from GitHub's IP ranges, not from Your device.

## 5. What the Webapp stores in Your browser

The Webapp persists the following items locally and never transmits them to any server controlled by the Maintainer.

| Storage | Key | Contents | When written |
|---|---|---|---|
| `localStorage` | `webapp.pat.encrypted` | Your GitHub PAT, encrypted with AES-GCM 256-bit. Encryption key is derived from Your passphrase via PBKDF2-SHA256 (100,000 iterations) with a per-token random salt. The plaintext PAT is **never** persisted to disk. | When You enable write access in Settings. |
| `localStorage` | `webapp.theme` | One of `'light'`, `'dark'`, `'system'`. | When You toggle the theme. |
| `localStorage` | `webapp.prefs` | UI preferences (sidebar collapsed, density, language, notification settings, optional commit-author override) and the version of the legal terms You accepted (`acceptedLegalVersion`). | When You change a UI preference or accept the legal terms. |
| `IndexedDB` (via `idb-keyval`) | TanStack Query cache keys | Cached copies of the public catalog JSON for fast reload and limited offline reads. | Automatic, on first fetch. |

You can erase all of the above at any time by:

- Clicking **Settings → Remove saved PAT** (clears the PAT entry only).
- Using Your browser's "Clear site data" / "Clear cookies and storage" for `poli0981.github.io` (clears everything).
- Uninstalling the Desktop App and removing its WebView2 / WebKit profile directory (Desktop only; locations vary by OS).

## 6. PAT (Personal Access Token) handling — in depth

The Webapp's optional write features (edit annotations, dispatch the scraper workflow, bulk delete) require a GitHub fine-grained PAT. The PAT lifecycle is entirely client-side:

1. **Creation** — You generate a fine-grained PAT on github.com, scoped to `poli0981/free-games-itchio-list` only, with `Contents: Read & write` and `Actions: Read & write`. The Maintainer never sees this step.
2. **Encryption** — You paste the PAT into Settings + a passphrase. The Webapp derives an AES-GCM key from the passphrase via PBKDF2-SHA256 (100k rounds, 16-byte random salt). The PAT is encrypted; the resulting ciphertext + salt + IV is stored in `localStorage` under `webapp.pat.encrypted`. The plaintext PAT and the passphrase are never written to any storage.
3. **Unlock** — On a later session, You enter the passphrase. The Webapp re-derives the key and decrypts the PAT into a Zustand in-memory store. The decrypted PAT exists only in JavaScript memory.
4. **Use** — Octokit calls to `api.github.com` include the PAT as `Authorization: Bearer <pat>` over HTTPS. The PAT is sent only to `api.github.com` and never to any other host.
5. **Lock** — Clicking Lock (or closing the tab) discards the in-memory PAT. The encrypted blob remains in `localStorage` for the next unlock.
6. **Removal** — Clicking Remove saved PAT deletes the `webapp.pat.encrypted` entry from `localStorage`.

If You suspect Your PAT is compromised:

- Lock or remove it immediately.
- Revoke it on github.com (Settings → Developer settings → Personal access tokens → Fine-grained tokens).
- Generate a new one with a fresh passphrase.

See also: [SECURITY.md](../SECURITY.md).

## 7. Network requests

When running, the Webapp and Desktop App make requests to the following endpoints — and only these:

| Endpoint | Purpose | Auth |
|---|---|---|
| `raw.githubusercontent.com/poli0981/free-games-itchio-list/main/data_game/*.json` | Read public catalog data. | None (public). |
| `api.github.com/repos/poli0981/free-games-itchio-list/...` | Write operations: edit, delete, dispatch workflows, list runs. | PAT (only when unlocked). |
| `*.itch.io/*`, `img.itch.zone/*` | (Desktop App only) Direct itch.io fetches for the in-app game preview, bypassing browser CORS. | None (public). |

No third-party CDN, no analytics endpoint, no telemetry collector, no font CDN. Tailwind, Radix, lucide-react, etc. are bundled at build time.

## 8. Cookies

The Webapp and Desktop App **do not set any cookies.** GitHub Pages may issue cookies as part of its CDN behavior; those are GitHub's, not the Maintainer's.

## 9. Children's privacy

The Repository indexes games hosted on itch.io, which include adult content. The `nsfw` flag is best-effort (see [DISCLAIMER §2](DISCLAIMER.md#2-no-warranty-as-to-the-games)). The Webapp does not gate access by age. If You are under the age of majority in Your jurisdiction, please use the Repository under the supervision of a parent or guardian and respect itch.io's own age-gating where applicable.

The Maintainer does not knowingly collect personal data from children. (He doesn't collect personal data from anyone — see §2.)

## 10. Your rights

Because the Maintainer holds no personal data, requests under GDPR, CCPA, Vietnam's PDPD (Decree 13/2023/ND-CP), or similar regimes that target the Maintainer have nothing to act on. For data on Your device:

- **Right to access**: open Your browser's DevTools → Application → Storage → Local Storage / IndexedDB.
- **Right to erasure**: clear site data as described in §5.
- **Right to portability**: export `localStorage` via DevTools (it's plain JSON; the PAT is encrypted).

For data held by GitHub or itch.io about Your interactions with their platforms, contact those providers directly using the privacy contacts in their policies.

## 11. Third-party services

| Service | Used for | Policy |
|---|---|---|
| GitHub | Repo, CI, Pages, Releases, API | <https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement> |
| itch.io | Game pages, scrape source | <https://itch.io/docs/legal/privacy-policy> |

The webapp does **not** integrate any analytics provider, ad network, error-reporting service (no Sentry, no Datadog), social media SDK, or font CDN.

## 12. Changes to this Policy

The Maintainer may update this Policy. The `Last updated` date at the top reflects the most recent change. Material changes will additionally be noted in [CHANGELOG.md](../CHANGELOG.md). Continued use after a change constitutes acceptance.

## 13. Contact

For questions about this Policy:

- Open a `[General]` or `[Feedback]` issue.
- DM via any channel listed on the [About page](https://poli0981.github.io/free-games-itchio-list/app/#/about).

## 14. Final vibes

No tracking, no analytics, no telemetry, no spying. The Maintainer is too lazy and too unemployed to build a data pipeline even if he wanted one. Browse freely.

## 15. Telegram bot — optional contribution path

[`CONTRIBUTING.md`](../CONTRIBUTING.md) describes an optional flow for
submitting games via [@my_skull_bot](https://t.me/my_skull_bot). The flow
involves voluntarily sharing a Telegram numeric ID with the Maintainer
(operator: poli0981). This section explains how that ID is handled.

| Item | Stored where | Lifetime | Synchronized off-device | In this repo |
|---|---|---|---|---|
| Your Telegram numeric ID | Operator's local machine, in a Docker volume or local file used by the bot's whitelist | Until You request removal, or the operator rotates the whitelist | No | **No** |
| Telegram messages You send to the bot | Telegram's servers (per Telegram's policy) + transient memory of the bot process while parsing | Telegram's retention rules; bot does not persist beyond the in-flight request | No (bot does not log message bodies to disk) | No |
| itch.io URLs You submit through the bot | Repository file [`scripts/temp_link.json`](../scripts/temp_link.json), then daily-merged into [`data_game/*.json`](../data_game/) | Permanent (Git history); becomes part of the public catalog | Yes — public via GitHub | **Yes (URL only, no Telegram metadata)** |
| Workflow run ID + commit messages of bot-ingested batches | GitHub Actions logs (subject to GitHub's retention) and Git history (`bot-ingest: run NNN` commits) | GitHub default retention (90 days for logs); Git history is permanent | Yes — GitHub | Yes (commit messages only; no Telegram ID) |

**Removal**: DM the Maintainer with "remove me from whitelist". The next
bot start drops Your ID; in-flight requests already accepted are not
retroactively reverted (the URLs You submitted remain in the catalog as
public data, identical to URLs submitted via the GitHub Issue path).

**Bot source code + operational notes**:
[poli0981/telegram-scraper-bot](https://github.com/poli0981/telegram-scraper-bot)
([USER_GUIDE.md](https://github.com/poli0981/telegram-scraper-bot/blob/main/docs/USER_GUIDE.md)).

The legal basis for processing in this flow is **Your explicit consent**
under Vietnam's PDPD (Decree 13/2023/ND-CP) and equivalent provisions of
GDPR / CCPA. You may withdraw consent at any time per the removal step
above; withdrawal does not affect the lawfulness of processing prior to
withdrawal.

Built with boredom and zero data harvesting. 🚀
