# Changelog — 4.5.x

Release notes for 4.5.0, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [4.5.0] - 2026-10-27 (Rate limits for the whole site)

The website now limits how many requests one connection can send in a short time, on every page,
cover image and API address — not only on the Suggest form and the verification check. Normal
browsing never comes close to the limits; a script that floods the site gets HTTP 429 ("Too many
requests") and has to wait a minute. Nothing changes in the desktop and Android apps.

### Upgrade notes

- **Nothing to accept again**: no policy changed. The Privacy Policy already says that your IP
  address is used, without being stored, to count requests and limit abuse.
- **Desktop and Android apps**: install 4.5.0 over 4.4.3 as usual; they don't use the limited
  addresses (4.0–4.1.1 count against the site limit when they read the old catalog files).

### Added

- **Per-connection limits in the Worker**: every request that runs the site's server code counts,
  per minute and per address (an IPv6 connection by its /64): 120 for pages, the public API and the
  catalog files of the old apps, 600 for cover images (a Games page shows up to 100), 300 for the
  admin. The Suggest form (5 a minute) and the verification check (20 a minute) keep their own,
  stricter limits on top. Search engines that Cloudflare has verified are not counted.
- **The "Too many requests" answer**: pages get a short page in English or Vietnamese (no scripts),
  the API and cover images a JSON `{"error":"rate_limited"}`; both say when to retry
  (`Retry-After: 60`) and are never cached. The admin shows "Too many requests from this connection".
- **A first layer in front of the Worker**: the maintainer's runbook (`docs/operations.md`, section 1
  step 15) sets up a Cloudflare WAF rate-limiting rule that blocks floods before they reach the site's
  code, and covers the static files the Worker never sees.

### Changed

- **Security policy**: says how the site limits requests (EN + VI); no new obligations.
