# Operations runbook (maintainer)

How freeitchgames.win is wired together and how to set it up from scratch. Nothing in this file is
secret: secrets are only ever typed into Cloudflare (`wrangler secret put`) or a local, gitignored
`webapp/.dev.vars`.

## Architecture in one screen

| Piece | Where | What it does |
|---|---|---|
| Worker `free-games-itchio-list` | Cloudflare Workers, custom domain `freeitchgames.win` | Serves the built app + `/data` (static assets), `/img` (resized covers), `/api/suggest`, `/api/ingest`, `/api/admin/*`, `/admin`, and runs the RSS cron. Config: [`webapp/wrangler.jsonc`](../webapp/wrangler.jsonc). |
| Workers Builds | Cloudflare dashboard → the Worker → Settings → Build | Builds and deploys `main` on every push (data commits included). |
| R2 `freeitchgames-thumbs` | Cloudflare R2 | Resized WebP covers (`w160/…`, `w640/…`). |
| D1 `freeitchgames` | Cloudflare D1 | Review queue, feed state, audit log, idempotency keys ([`webapp/worker/migrations/`](../webapp/worker/migrations)). |
| Access apps "Admin" / "Ingest" | Cloudflare Zero Trust | Login for `/admin` + `/api/admin/*`; service token for `/api/ingest` (browser extension). |
| Turnstile widget | Cloudflare Turnstile | Anti-spam on `/suggest`. |
| GitHub App | GitHub → Settings → Developer settings | The Worker's identity for commits (queue approvals, edits, removals). |
| GitHub Actions | [`.github/workflows/`](../.github/workflows) | Data pipeline (`refresh.yml`, `update.yml`, `force_update.yml`), CI, releases, build monitor. |
| Staging Worker `free-games-itchio-list-staging` | `staging.freeitchgames.win` (whole host behind Access) | Pre-release checks of branch `v4` (`wrangler.jsonc` → `env.staging`). |

## 1. Cloudflare

Do these once (and again with the `-staging` names for the staging Worker).

1. **Build settings** (Worker → Settings → Build): root directory `webapp`; build command
   `npm run build`; deploy command `npx wrangler deploy` (staging: `npx wrangler deploy --env staging`,
   production branch `v4`); build variables `NODE_VERSION=24` and, once Web Analytics exists,
   `VITE_CF_BEACON_TOKEN=<token>`. Builds for non-production branches: turn them **off** for the
   staging Worker (otherwise every push to `main` also gets a preview build there).
2. **Domains & routes** (Worker → Settings → Domains & Routes): keep the custom domains
   `freeitchgames.win` and `www.freeitchgames.win`; delete any `*freeitchgames.win/*` route; a Redirect
   Rule sends `www` to the apex. `workers.dev` and preview URLs stay off (`wrangler.jsonc` sets them;
   those hostnames would bypass Access).
3. **R2**: create buckets `freeitchgames-thumbs` and `freeitchgames-thumbs-staging`.
4. **Images → Transformations**: enable for the zone; allowed source origins: `img.itch.zone` only.
5. **D1**: `cd webapp && npx wrangler d1 create freeitchgames` (and `freeitchgames-staging`), then
   `npx wrangler d1 migrations apply freeitchgames --remote` (staging:
   `npx wrangler d1 migrations apply freeitchgames-staging --remote --env staging`). No database id is
   needed in `wrangler.jsonc`: deploys bind the database by name. Apply every new migration by hand
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
7. **Turnstile**: add a widget (Managed) for `freeitchgames.win` and `staging.freeitchgames.win`.
8. **Fill in `wrangler.jsonc` vars** (not secret) and commit: `ACCESS_TEAM_DOMAIN`
   (`https://<team>.cloudflareaccess.com`), `ACCESS_AUD_ADMIN`, `ACCESS_AUD_INGEST`, `GH_APP_ID`,
   `GH_APP_INSTALLATION_ID`, `TURNSTILE_SITEKEY` — in both the top level and `env.staging`. Then
   `npm run cf:types`.
9. **Secrets** (`cd webapp`; add `--env staging` for staging):
   ```sh
   openssl pkcs8 -topk8 -nocrypt -in app.private-key.pem -out app.pk8.pem   # GitHub App key → PKCS#8
   npx wrangler secret put GH_APP_PRIVATE_KEY < app.pk8.pem
   npx wrangler secret put ADMIN_EMAILS        # comma-separated
   npx wrangler secret put TURNSTILE_SECRET
   ```
   Until a feature's settings exist it answers 503; the public site works without any of them.
10. **Web Analytics**: add the site with *manual* setup (automatic injection off) and put the token in
    the `VITE_CF_BEACON_TOKEN` build variable.
11. **Email Routing**: create `legal@`, `privacy@`, `security@`, `takedown@freeitchgames.win` and forward
    them to your mailbox (the policies publish these addresses).
12. **Zone settings**: SSL/TLS Full (strict), Always Use HTTPS, minimum TLS 1.2, TLS 1.3 on; Smart
    Tiered Cache; Browser Cache TTL "Respect existing headers"; Rocket Loader and Email Obfuscation
    **off** (they rewrite HTML and break the CSP); WAF managed rules on; one rate-limiting rule for
    `/api/*`; Bot Fight Mode **off** (it can't be skipped for the extension or the apps). Keep HSTS
    `preload` only if every subdomain (including `staging`) will always be HTTPS.
13. **Notifications**: enable the Workers Builds failure notification (independent of
    `deploy-status.yml`).

## 2. GitHub

1. **GitHub App** (Settings → Developer settings → GitHub Apps → New): name e.g.
   `freeitchgames-admin`; webhook **off**; repository permissions **Contents: Read and write**,
   **Metadata: Read**; install it on this repository only. Note the App ID and the installation id (the
   number in the installation's URL); generate a private key (see step 9 above).
2. **Repository settings**: homepage `https://freeitchgames.win`; private vulnerability reporting on;
   Dependabot security updates on; CodeQL default setup and secret scanning if you want them (the
   policies don't claim them). Rulesets: target the default branch (block deletion and force
   pushes); protect tags `v*`. Merge PRs with squash or a merge commit — never fast-forward.
3. **Secrets**: keep `DISCORD_CI_WEBHOOK`, the release webhooks and the Android keystore secrets;
   delete `GH_TOKEN`, `TELEGRAM_BOT_TOKEN` and `DISCUSSION_*` once nothing uses them.
4. **Signing key**: the old key `03F965C2E2DB5C6B` was exposed; sign with the replacement key.

## 3. Release order for v4

1. Merge PR #81 (Phase 0), then PR #82 (Phase 1). Dispatch **Refresh catalog** once with a small
   `budget` (e.g. 50) and check the run summary.
2. Rebase `v4` on `main`, push it, open the v4 PR. Set up the staging Worker (1.1, 1.3–1.9 with the
   staging names) and check `staging.freeitchgames.win`: covers load through `/img`, `/admin` asks
   for login (also in a private window), a Suggest submission appears in the admin queue, approving
   it creates a verified commit on a scratch branch or `main`, the Web Analytics beacon and Turnstile
   raise no CSP errors.
3. Production: complete section 1 for the production names, apply the D1 migrations, then merge the v4
   PR (squash or merge commit). Watch the Workers Build; roll back from Workers → Deployments if
   needed.
4. Tag `v4.0.0` from `main` (see the release process in [`CLAUDE.md`](../CLAUDE.md)), wait for the
   desktop + Android assets on the draft, publish it.
5. Switch the browser extension to `/api/ingest` with the service token, then revoke its old PAT.

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
