# Operations runbook (maintainer)

How freeitchgames.win is wired together and how to set it up from scratch. Nothing in this file is
secret: secrets are only ever typed into Cloudflare (`wrangler secret put`) or a local, gitignored
`webapp/.dev.vars`.

## Architecture in one screen

| Piece | Where | What it does |
|---|---|---|
| Worker `free-games-itchio-list` | Cloudflare Workers, custom domain `freeitchgames.win` | Serves the built app + `/data` (static assets), `/img` (resized covers), the verification gate (`/api/verify`), `/api/suggest`, `/api/ingest`, `/api/admin/*`, `/admin`, and runs the RSS cron. Config: [`webapp/wrangler.jsonc`](../webapp/wrangler.jsonc). |
| Workers Builds | Cloudflare dashboard → the Worker → Settings → Build | Builds and deploys `main` on every push (data commits included). |
| R2 `freeitchgames-thumbs` | Cloudflare R2 | Resized WebP covers (`w160/…`, `w640/…`). |
| D1 `freeitchgames` | Cloudflare D1 | Review queue, feed state, audit log, idempotency keys ([`webapp/worker/migrations/`](../webapp/worker/migrations)). |
| Access apps "Admin" / "Ingest" | Cloudflare Zero Trust | Login for `/admin` + `/api/admin/*`; service token for `/api/ingest` (browser extension). |
| Turnstile widget | Cloudflare Turnstile | The verification gate in front of the web app (action `gate`) and anti-spam on `/suggest` (action `suggest`). |
| Transform Rule "Verified bots skip the gate" | Cloudflare → Rules → Transform Rules | Adds `x-fig-known-bot: <GATE_BOT_TOKEN>` to requests from Cloudflare-verified bots, so search engines and link previews skip the gate (section 1, step 14). |
| GitHub App | GitHub → Settings → Developer settings | The Worker's identity for commits (queue approvals, edits, removals). |
| GitHub Actions | [`.github/workflows/`](../.github/workflows) | Data pipeline (`refresh.yml`, `update.yml`, `force_update.yml`), CI, releases, build monitor. |
| Staging Worker `free-games-itchio-list-staging` | `staging.freeitchgames.win` (whole host behind Access) | Optional pre-release checks, deployed by hand from any branch with `npx wrangler deploy --env staging` (`wrangler.jsonc` → `env.staging`). |

## 1. Cloudflare

Do these once (and again with the `-staging` names for the staging Worker).

1. **Build settings** (Worker → Settings → Build): root directory `webapp`; build command
   `npm run build`; deploy command `npx wrangler deploy`; build variable `NODE_VERSION=24` (no
   `VITE_CF_BEACON_TOKEN`: the zone injects Web Analytics, step 10). The staging Worker, if you use
   it, is deployed by hand (`npx wrangler deploy --env staging`); turn its builds for non-production
   branches **off** (otherwise every push to `main` also gets a preview build there).
2. **Domains & routes** (Worker → Settings → Domains & Routes): keep the custom domains
   `freeitchgames.win` and `www.freeitchgames.win`; delete any `*freeitchgames.win/*` route; a Redirect
   Rule sends `www` to the apex. `workers.dev` and preview URLs stay off (`wrangler.jsonc` sets them;
   those hostnames would bypass Access).
3. **R2**: enable R2 for the account in the dashboard first (R2 Object Storage; the free tier still
   asks for a payment method), then `cd webapp && npx wrangler r2 bucket create freeitchgames-thumbs`
   (and `freeitchgames-thumbs-staging`). A deploy fails while its bucket is missing.
4. **Images → Transformations**: enable for the zone; allowed source origins: `img.itch.zone` only.
5. **D1**: production `freeitchgames` exists (created 2026-09-18 in APAC with
   `npx wrangler d1 create freeitchgames`; its id is in `wrangler.jsonc`; `0001_init.sql` applied).
   Staging: `cd webapp && npx wrangler d1 create freeitchgames-staging`, put the printed id in
   `env.staging.d1_databases`, then `npx wrangler d1 migrations apply freeitchgames-staging --remote --env staging`.
   Apply every new migration by hand (`npx wrangler d1 migrations apply freeitchgames --remote`)
   **before** deploying code that needs it.
6. **Zero Trust** (free plan is enough):
   - Settings → Authentication: add **GitHub** (OAuth App callback
     `https://<team>.cloudflareaccess.com/cdn-cgi/access/callback`) and **One-time PIN**.
   - Access → Applications → Self-hosted **"Admin"**: `freeitchgames.win/admin`,
     `freeitchgames.win/admin/*`, `freeitchgames.win/api/admin/*`; policy *Allow* → your email(s);
     session 24 h. Copy its **AUD** tag.
   - Self-hosted **"Ingest"**: `freeitchgames.win/api/ingest`; policy *Service Auth* → a service token
     (Access → Service credentials) named e.g. `itch-f2p-extension`, with an expiry; copy the AUD tag.
     The extension sends `CF-Access-Client-Id` / `CF-Access-Client-Secret`.
   - Staging: one self-hosted app covering all of `staging.freeitchgames.win`.
7. **Turnstile**: add a widget (Managed) for `freeitchgames.win` and `staging.freeitchgames.win`. The
   same widget serves the verification gate (action `gate`) and the Suggest form (action `suggest`);
   the Worker checks the token, the hostname and the action, so a token from one can't be used for
   the other.
8. **Fill in `wrangler.jsonc` vars** (not secret) and commit: `ACCESS_TEAM_DOMAIN`
   (`https://<team>.cloudflareaccess.com`, no trailing slash), `ACCESS_AUD_ADMIN`, `ACCESS_AUD_INGEST`,
   `GH_APP_ID`, `GH_APP_INSTALLATION_ID`, `TURNSTILE_SITEKEY` — in both the top level and
   `env.staging`. Then `npm run cf:types`. The production values are filled in (2026-09-18). Change
   them in the file, not only in the dashboard: every deploy — so every data commit — replaces the
   Worker's plain-text variables with the file's values. Secrets are not affected.
9. **Secrets** (`cd webapp`; add `--env staging` for staging):
   ```sh
   # The Worker converts GitHub's PKCS#1 key itself, so the downloaded .pem works as is:
   npx wrangler secret put GH_APP_PRIVATE_KEY < app.private-key.pem
   npx wrangler secret put ADMIN_EMAILS        # comma-separated
   npx wrangler secret put TURNSTILE_SECRET
   npx wrangler secret put GATE_BOT_TOKEN      # the verification gate, step 14
   openssl rand -base64 48 | npx wrangler secret put GATE_SECRET   # last: this switches the gate on
   ```
   Until a feature's settings exist it answers 503 (the gate simply stays off); the public site works
   without any of them.
10. **Web Analytics**: the site uses the **automatic** setup — the zone injects the beacon into every
    HTML response (checked on 2026-09-24), so the build needs no token. Don't also set
    `VITE_CF_BEACON_TOKEN`: every page view would count twice. The CSPs of the app, the admin page and
    the verification page allow the beacon.
11. **Email Routing**: create `legal@`, `privacy@`, `security@`, `takedown@freeitchgames.win` and forward
    them to your mailbox (the policies publish these addresses).
12. **Zone settings**: SSL/TLS Full (strict), Always Use HTTPS, minimum TLS 1.2, TLS 1.3 on; Smart
    Tiered Cache; Browser Cache TTL "Respect existing headers"; Rocket Loader and Email Obfuscation
    **off** (they rewrite HTML and break the CSP); WAF managed rules on; one rate-limiting rule for
    `/api/*`; Bot Fight Mode **off** (it can't be skipped for the extension or the apps; the
    verification gate covers the web app instead). Keep HSTS
    `preload` only if every subdomain (including `staging`) will always be HTTPS.
13. **Notifications**: enable the Workers Builds failure notification (independent of
    `deploy-status.yml`).
14. **Verification gate** ([`webapp/worker/gate.ts`](../webapp/worker/gate.ts)). A visitor must pass a
    Turnstile check before the app shell and `/img` are served; the pass is an HttpOnly cookie good for
    `BOT_GATE_TTL_HOURS` (1–168, default 48; lowering it also shortens passes already given out).
    `/data`, `/assets`, robots, sitemap, the social image, `/api/*` and `/admin*` stay open, and the
    desktop/Android apps are not affected. `BOT_GATE` is `"on"` in `wrangler.jsonc`, but the gate
    stays off (fails open) until both secrets below exist. In this order:
    1. Check the Workers plan: `/` now runs the Worker too (on the Free plan, Worker-first paths answer
       429 once the day's 100,000 requests are used up; `/img` already uses most of them).
    2. Generate the bot token (`openssl rand -hex 32`), keep it in your password manager, and
       `npx wrangler secret put GATE_BOT_TOKEN` it.
    3. Rules → Transform Rules → **Modify Request Header** → create "Verified bots skip the gate":
       custom filter `(cf.client.bot)` — or `(cf.client.bot and not cf.verified_bot_category in
       {"AI Crawler"})` to keep AI crawlers out — then *Set static* header `x-fig-known-bot` to the token.
    4. Check that the header reaches the Worker: add a temporary rule `(ip.src eq <your IP>)` that sets
       the same header, then `curl -s https://freeitchgames.win/api/verify` must say `"via":"bot"`.
       Delete the temporary rule. If it doesn't say so, stop here and don't set `GATE_SECRET`.
    5. `openssl rand -base64 48 | npx wrangler secret put GATE_SECRET` — the gate is on.
    6. Smoke test: `curl -sI https://freeitchgames.win/` shows `x-robots-tag: noindex, nofollow` and
       `cache-control: no-store` (the verification page); `/img/160/x` answers 403;
       `/data/index.json` answers 200 with `access-control-allow-origin: *`;
       `curl -sI -A 'Googlebot/2.1' https://freeitchgames.win/` answers 503 (only verified bots, via
       the rule, get through); a real browser passes and lands on the page it opened; Search Console →
       URL Inspection → *Test live URL* renders the real app. Watch Security → Events and Search
       Console for a week.

    **Off switch:** `npx wrangler secret delete GATE_SECRET` turns the gate off at once, and
    data-commit deploys don't bring it back; to keep it off, set `BOT_GATE` to `"off"` in
    `wrangler.jsonc`. Staging: set `TURNSTILE_SITEKEY` and `BOT_GATE: "on"` under `env.staging` and add
    both secrets with `--env staging`. Locally: put the Turnstile test keys,
    `SITE_ORIGIN=http://localhost:8787` and a 32+ character `GATE_SECRET` in `webapp/.dev.vars`, then
    `npm run build && npx wrangler dev` (on localhost the cookie is `fig_gate`, without `Secure`, and
    no bot token is needed).

## 2. GitHub

1. **GitHub App** (Settings → Developer settings → GitHub Apps → New): name e.g.
   `freeitchgames-admin`; webhook **off**; repository permissions **Contents: Read and write**,
   **Metadata: Read**; install it on this repository only. Note the App ID and the installation id (the
   number in the installation's URL); generate a private key (see step 9 above).
2. **Repository settings**: homepage `https://freeitchgames.win`; private vulnerability reporting on;
   Dependabot security updates on; CodeQL default setup and secret scanning if you want them (the
   policies don't claim them). Rulesets: target the default branch (block deletion and force
   pushes); protect tags `v*`. Merge PRs with squash or a merge commit — never fast-forward.
3. **Secrets**: keep `DISCORD_CI_WEBHOOK`, the release webhooks and the Android keystore secrets.
   `GH_TOKEN`, `TELEGRAM_BOT_TOKEN` and the three `DISCUSSION_*` secrets are still set but no workflow
   uses them any more (checked 2026-09-24): delete them.
4. **Signing key**: the old key `03F965C2E2DB5C6B` was exposed; sign with the replacement key.

## 3. Releasing a version

1. Bump the version everywhere it lives: `webapp/src/lib/about.ts` (`APP.version`),
   `webapp/package.json` + `package-lock.json` (`npm version X.Y.Z --no-git-tag-version`),
   `webapp/src-tauri/tauri.conf.json`, `webapp/src-tauri/Cargo.toml` + `Cargo.lock`, and the version
   badges of `README.md` / `README.vi.md`. Write the notes in
   `changelog/<major>.x/ver<major>.<minor>.x.md` and add the row to [`CHANGELOG.md`](../CHANGELOG.md).
2. Open a PR; when CI is green, merge it with squash or a merge commit — never fast-forward. A push
   that touches the changelog posts to Discussions → General unless the head commit says
   `[skip-discuss]` (the release announcement usually covers it).
3. Apply any new D1 migration and set any new secret **before** the merge deploys code that needs them.
4. Tag from `main`: `git fetch origin && git tag -s vX.Y.Z origin/main -m "…"`, then
   `git push origin vX.Y.Z`. `release_desktop.yml` opens one draft release and the desktop and Android
   jobs upload into it (12 assets for 4.x). Never create the release by hand first.
5. When every asset is there, edit the title and notes (from the changelog), then
   `gh release edit vX.Y.Z --draft=false` — that fires the Discord and Discussions announcements.

## 4. Routine

- **Mass-change alert** (Discord, "mass_change=true"): itch.io probably changed its page markup. Look at
  a few flagged games on itch.io. If the parser is wrong, fix `scripts/scraper.py`; if the removals
  are real, dispatch **Refresh catalog** with `allow_mass_removal`.
- **Removal / takedown request**: `/admin` → Catalog → the game → Remove (the reason is public). A
  wrongly removed game: Catalog → Removed → Restore.
- **Review queue**: `/admin` → Review queue. "Approve with override" is needed for games that were
  removed before.
- **Build failed** (Discord from `deploy-status.yml`): open the build log linked in the message; the
  site keeps serving the previous deployment meanwhile.
- **New D1 migration**: add `webapp/worker/migrations/000N_*.sql` (never edit applied ones), apply it
  to staging and production by hand, then deploy.
- **Verification gate misbehaving** (visitors stuck on the check, crawl errors in Search Console):
  `npx wrangler secret delete GATE_SECRET` turns it off at once; then look at `npx wrangler tail` and
  `curl -s https://freeitchgames.win/api/verify`.
