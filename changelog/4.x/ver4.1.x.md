# Changelog — 4.1.x

Release notes for 4.1.0, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [4.1.0] - 2026-09-24 (Verification check, readable charts, changelog folder)

Version 4.1 puts a quick Cloudflare Turnstile check in front of the website, makes the charts'
hover tooltips readable again, and moves this changelog into one file per version.

### Upgrade notes

- **Updated Privacy Policy, Terms of Use and EULA** (the new verification cookie; `.rpm` listed):
  the site and the apps ask you to accept them again once.
- **Website**: the first visit, then about once every 48 hours, shows a short "Quick check" page run
  by Cloudflare Turnstile. It usually passes by itself, and the page you opened loads right after.
- **Desktop and Android apps** have no check. Install 4.1.0 over 4.0.0 as usual.

### Added

- **Verification gate** (web only). Until a browser passes a Turnstile check, the Worker answers app
  pages with a self-contained verification page ([`webapp/worker/gate-page.ts`](../../webapp/worker/gate-page.ts))
  and `/img` covers with 403, so nothing of the site loads before the check. Passing sets
  `__Host-fig_gate` (HttpOnly, host-only, an HMAC-signed issue time) for `BOT_GATE_TTL_HOURS` (48),
  and the page reloads into the link that was asked for. `/data`, `/assets`, robots, sitemap, the
  social image, `/api/*` and `/admin*` stay open. Verified search and link-preview bots pass with the
  token a Cloudflare Transform Rule adds; clients that only claim to be a crawler get a 503. The gate
  stays off until it is configured, and deleting `GATE_SECRET` switches it off at once
  ([`webapp/worker/gate.ts`](../../webapp/worker/gate.ts), [`docs/operations.md`](../../docs/operations.md)).
- `GET /api/verify` reports the pass. A tab whose pass ran out checks again when it is shown (or when a
  cover fails) and reloads into the verification page.

### Fixed

- **Chart hover was hard to read**: the band behind the hovered bar was black and tooltips had no
  background, because the chart colours wrapped the hex design tokens in `hsl()`. Tooltips now use the
  popover colours, translated series names ("Games" instead of `count`), locale-formatted numbers,
  each slice's share on the pies that cover the whole, and formatted dates on the game-count chart.
  Clicking a chart no longer draws a black focus ring or pins the tooltip on the first item; keyboard
  focus keeps the purple ring. Pie seams and treemap cells follow the theme.
- **Suggest form**: the Turnstile check now also requires this site's hostname and the `suggest`
  action (a token from one page can't be spent on another), and answers 503 instead of "failed" when
  Turnstile is unreachable.
- **Admin approvals** (live since 2026-09-20): the Worker accepts the GitHub App private key as GitHub
  downloads it (PKCS#1), not only PKCS#8.

### Changed

- The changelog is split per version under [`changelog/`](../); [`CHANGELOG.md`](../../CHANGELOG.md)
  is now the index, and old links to its entries still land on the right row.
- Docs brought up to date: the operations runbook (verification gate setup, Web Analytics injected by
  the zone, a release checklist), the development setup, the READMEs, `CLAUDE.md` and the Tauri notes.
- [`webapp/public/_headers`](../../webapp/public/_headers): caching for the favicon and the web manifest.
