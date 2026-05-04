# Privacy Policy

Last updated: 2026-05-04

This repository is a curated list of free games on itch.io plus a React/TypeScript webapp (and Tauri desktop wrapper) for browsing and editing the catalog. It's a hobby project. Nobody on this side of the screen collects, stores, or processes personal data from you. No backend, no database, no analytics, no telemetry.

## What Data Do We Collect?
**None on any server we control.** Zero. Zilch.

- **Visiting this repo on GitHub** — GitHub itself may log standard things (IP, browser, etc.) as part of their platform; that is on GitHub, not on this project.
- **Downloading games** — links go directly to itch.io; their privacy policy applies once you click.
- **Contributing** — opening a PR or issue is GitHub-side; I see only the public info GitHub publishes (username, comment text, etc.).

## What the Webapp Stores in Your Browser

The webapp (`webapp/` in this repo, deployed to GitHub Pages) does not phone home, but it does keep a few things in your browser's `localStorage` so it can remember your preferences across reloads. Everything is local to your browser, never sent anywhere except directly to GitHub's API when you explicitly act:

| Key | What | When |
|-----|------|------|
| `webapp.pat.encrypted` | Your GitHub PAT, encrypted with AES-GCM (key derived from your passphrase via PBKDF2-SHA256). | Only if you choose to enable write access from Settings. |
| `webapp.theme` | `'light'` / `'dark'` / `'system'`. | When you toggle the theme. |
| `webapp.prefs` | Sidebar collapsed / expanded. | When you toggle the sidebar. |
| TanStack Query cache (IndexedDB via `idb-keyval`) | Cached copies of the public catalog JSON for offline reading. | Automatic. |

You can clear all of this any time via your browser's "clear site data" or by clicking **Remove saved PAT** in the webapp's Settings.

The webapp talks to two GitHub endpoints:
- `raw.githubusercontent.com` for read-only catalog fetches (no auth, no cookies).
- `api.github.com` for writes when a PAT is unlocked.

The Tauri desktop build additionally talks directly to `*.itch.io` and `img.itch.zone` to preview new games (a CORS workaround the browser version cannot do).

No cookies. No tracking. No analytics. No third-party scripts.

## Third-Party Services
- **itch.io**: All game links go straight there. Their privacy policy applies when you visit or download games: [itch.io Privacy Policy](https://itch.io/docs/legal/privacy-policy)
- **GitHub**: This whole repo lives on GitHub. Check their privacy policy [here](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).

## Changes to This Policy
If I ever change this (unlikely, because why bother?), I'll update the date above and commit it. But honestly, this thing will probably stay the same forever.

## Questions?
Open an issue or ping me somewhere (if you can find me). But let's be real � nobody reads these anyway :D

Built with boredom and zero spying. ??