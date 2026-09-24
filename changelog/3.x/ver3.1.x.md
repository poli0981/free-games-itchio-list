# Changelog — 3.1.x

Release notes for 3.1.0 – 3.1.4, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [3.1.4] - 2026-05-05 (Legal docs rewrite + Vietnamese i18n + Legal Card + UI polish)

### Added
- **Vietnamese translations** under [`docs/i18n/vi/`](../../docs/i18n/vi/) — full
  translations of the four legal docs (DISCLAIMER, EULA, ToS, PrivacyPolicy)
  plus CONTRIBUTING, CODE_OF_CONDUCT, and SECURITY. Each file notes that the
  English version is the controlling text for legal interpretation.
- **`README.vi.md`** at repo root — Vietnamese mirror of the main README, with a
  language badge and a link back to the English version.
- **About page → "Legal & policies" Card** — single place to access all policy
  files (Disclaimer, EULA, ToS, Privacy, Code of Conduct, Security, License,
  Changelog) plus a pointer to the Vietnamese translations.
- **`webapp/src/lib/about.ts`**: `LegalLink` interface + `LEGAL_LINKS` array +
  `LEGAL_VI_INDEX_URL`. Same structured pattern as `THIRD_PARTY` and
  `SOCIAL_LINKS`.

### Changed
- **`docs/DISCLAIMER.md`, `docs/EULA.md`, `docs/ToS.md`, `docs/PrivacyPolicy.md`**:
  rewritten to be tighter and more enforceable while keeping the project's voice.
  Each doc now has a TL;DR, numbered sections, definitions, severability,
  governing law (Socialist Republic of Vietnam), explicit "not legal advice"
  notice, and a removal-request path. Privacy Policy adds a per-storage table
  for what the webapp persists locally and a step-by-step PAT lifecycle.
- **`README.md`** version badge → 3.1.4 plus a Vietnamese language badge and a
  short pointer to `README.vi.md` and `docs/i18n/vi/`.

### Optional UI
- **Tauri desktop**: maximize button is now disabled (`maximizable: false` in
  `webapp/src-tauri/tauri.conf.json`). Window is still resizable; only the
  full-window-maximize action is locked.
- **DataTable**: scrollbar hidden via a new `.scrollbar-hide` Tailwind utility
  added to `webapp/src/index.css`. Scrolling still works; the chrome is gone.

---

## [3.1.3] - 2026-05-05 (Credit Claude Code as AI co-author)

### Added
- **About page**: new **"AI co-authors"** Card listing both Grok (xAI) and
  Claude Code (Anthropic — Claude Opus 4.7, 1M context) with their roles
  in the repo's history. Each entry is linked + tagged with vendor and model.
- `webapp/src/lib/about.ts`: new `AiTool` interface + `AI_TOOLS` array so the
  AI credit data is structured the same way as `THIRD_PARTY` and `SOCIAL_LINKS`.

### Changed
- **`docs/ACKNOWLEDGEMENTS.md`, `docs/My_Stuff.md`, `CONTRIBUTING.md`**:
  surface Claude Code alongside Grok wherever the existing AI credit lived.
  Grok references stay — both buddies share the workload now (Grok carried the
  Python pipeline + v2.0.0 rewrite; Claude Code drove v3.0.0 webapp/Tauri and
  v3.1.2). `My_Stuff.md` "The Real MVP" is now plural.
- `DEV.blurb` on the About page reflects the two-buddy reality.

---

## [3.1.2] - 2026-05-05 (Offline link fix + About expansion + docs sweep)

### Fixed
- **Tauri desktop**: external links (itch.io, GitHub, third-party home pages) now
  open in the user's default browser instead of doing nothing. Added
  `tauri-plugin-opener` (Rust + JS) and a scoped `opener:allow-open-url`
  capability locked to `https://*` (no `file://` / `javascript:` schemes).

### Added
- **About page**: three new sections — Developer card, "Found a bug?" CTA that
  opens the bug-report issue template, and "Find me elsewhere" with X, YouTube,
  two Discord servers (Repo discussion / Game chat), Patreon, Ko-fi, Steam,
  Bluesky, and Mastodon.
- **`<ExtLink>`** ([`webapp/src/components/ext-link.tsx`](../../webapp/src/components/ext-link.tsx))
  — runtime-aware external-link wrapper used app-wide so the offline link bug
  can't recur. On web it renders a plain `<a target="_blank">`; on Tauri it
  routes through `tauri-plugin-opener`. All existing external `<a>` tags in
  About, the sidebar footer, and Game Detail now use it.

### Changed
- **`webapp/README.md`**: rewritten from Vite boilerplate to actual webapp docs
  (routes, dev/build commands, code-split layout, deploy, Tauri reference).
- **`CONTRIBUTING.md`, `docs/ACKNOWLEDGEMENTS.md`, `docs/My_Stuff.md`,
  `README.md`**: refreshed contact / social handles. The "if I ever make a
  Discord" line is finally obsolete — both servers exist.

---

## [3.1.1] - 2026-05-04 (Cross-compile macOS x86_64 from Apple Silicon)

This release has no changelog entry of its own; its notes are on GitHub: <https://github.com/poli0981/free-games-itchio-list/releases/tag/v3.1.1>.

---

## [3.1.0] - 2026-05-04 (macOS DMG fix + .pkg installer + pagination)

This release has no changelog entry of its own; its notes are on GitHub: <https://github.com/poli0981/free-games-itchio-list/releases/tag/v3.1.0>.
