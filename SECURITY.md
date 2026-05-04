# Security Policy

Last updated: 2026-05-04

Yo, this is mostly a hobby repo — a curated list of free itch.io games with Python scraping scripts on GitHub Actions, plus a React/TypeScript webapp (and Tauri desktop wrapper) for browsing and editing the catalog. Still no backend, no database, no telemetry. The one security-relevant thing is the GitHub Personal Access Token the webapp can hold for write operations — see below.

## Supported Versions
Everything here is "latest commit" only. I'm unemployed with too much free time, so fixes (if any) come when I feel like it — or when Grok nags me.

## Reporting a Vulnerability
Found something scary? Like a script that could theoretically spam itch.io or expose... nothing? You're a legend.

Please **don't** open a public issue. Instead:
- Open a **private** GitHub issue (if the repo allows — I'm introvert, might not have email public).
- Or just open a normal issue and prefix "[Security]" — I'll make it private if needed.
- Describe the issue clearly (steps to reproduce, potential impact).
- I'll review (with Grok's help, because my security knowledge is "easy mode" level).

What to expect:
- I'll acknowledge within a few days (unemployed schedule, not 24/7).
- If valid (big if :v), I'll fix and credit you in changelog/acknowledgements.
- If not valid — thanks anyway for caring about my mediocre code.

Common "vulnerabilities" you might find:
- Scraping breaks if itch.io changes HTML (not security, just life).
- Rate limiting? I already sleep(2) — be kind to servers.
- Dependencies? requests + bs4 are stable, but update if needed.
- Webapp deps (npm/Rust)? Dependabot/security alerts on the repo cover those — bumps land via PR.

## Webapp PAT handling (read this if you use the writeable webapp)

The browse-only flows (Dashboard, Games table, Charts, Deleted) need **no** auth and use the public CDN at `raw.githubusercontent.com`. Write flows (edit annotations, bulk edit/delete, dispatch the scraper workflow) need a GitHub Personal Access Token, which the webapp stores like this:

- **Use a fine-grained PAT** scoped to **only** `poli0981/free-games-itchio-list` with the minimum scopes you need:
  - `contents: write` — required for edits / deletes / queueing URLs.
  - `actions: write` — required for the Add page / Workflows page dispatch buttons.
  - `metadata: read` is implicit.
- **At rest** the PAT is encrypted with AES-GCM 256-bit; the key is derived from your passphrase via PBKDF2-SHA256 (100k iterations) with a fresh per-token salt. The encrypted blob lives in `localStorage` under `webapp.pat.encrypted`.
- **In memory** the decrypted PAT only exists in the React app's Zustand store between unlock and explicit Lock (or tab close).
- **Lock or remove anytime** from Settings. Removing also wipes the localStorage entry.
- **Don't paste a classic PAT** with full repo scope unless you really mean to. Fine-grained tokens are scoped to one repo and one set of operations.
- **Don't share `localStorage`** between users (e.g., shared kiosk machine). The encryption protects the PAT from a casual file-system reader, not from someone who knows your passphrase.

If you find a way to bypass the encryption, exfiltrate the PAT from memory through a CSP gap, or trick the webapp into sending writes to the wrong repo — please report privately as above.

## Web/desktop dependency reporting

For Tauri / Rust crate vulnerabilities or npm package CVEs that affect the webapp, opening a normal `[Security]` issue is fine; if it's actively exploitable in the deployed Pages site, please prefix `[CRITICAL]` so I can yank the deploy until it's fixed.

No bounties (bank account < $50), but eternal thanks and a shoutout.

This repo is MIT licensed and super low-risk. Stay safe out there — especially when downloading random free games.

Thanks for reporting responsibly. You're better at security than me already. 🚀