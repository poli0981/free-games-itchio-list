# Changelog — 3.4.x

Release notes for 3.4.0 – 3.4.1, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [3.4.1] - 2026-05-17 (Hotfix: DataTable column alignment + Discussion-announce auto-discovery)

### Fixed

- **DataTable columns misaligned at desktop widths.** Header used native table-layout (`<table className="w-full">` + `<th style={{width}}>`) while body rows used flex layout (`position: absolute` + `flex w-full`, cells with `flex: 0 0 Npx` / `1 1 0`). Native table-layout stretched the 8 size-less columns to fill the container based on content, but the absolutely-positioned body `<tr>` never participated in table layout — so its flex children stayed at their fixed flex-basis. Result: at the Tauri default 1280×800 window (and any viewport wider than the natural sum of header content widths) header columns drifted off the cells below them. [`webapp/src/components/data-table/data-table.tsx`](https://github.com/poli0981/free-games-itchio-list/blob/v3.4.1/webapp/src/components/data-table/data-table.tsx) now renders the header `<tr>` with `flex w-full` and each `<th>` with `flex h-10 items-center` + the same `flex: 0 0 Npx` / `1 1 0` style block as the body `<td>` — header and body now compute width identically. Helper `priorityHeaderClass` (which emitted `table-cell` variants) is gone; the existing `priorityClass` (`flex` variants) now drives both. No change to column definitions in [`columns.tsx`](https://github.com/poli0981/free-games-itchio-list/blob/v3.4.1/webapp/src/components/data-table/columns.tsx).
- **`announce-discussion.yml` was a silent no-op since v3.2.0.** Both jobs (`announce-release`, `announce-docs`) gated on three repo variables (`DISCUSSION_REPO_ID`, `DISCUSSION_ANNOUNCEMENTS_CATEGORY_ID`, `DISCUSSION_GENERAL_CATEGORY_ID`) that had never been configured — the validation step printed `::warning::… Skipping.` and `exit 0`, so every release silently failed to post to Discussions without surfacing a failed run. Replaced the two validation steps with a `Discover Discussion IDs` step that queries `gh api graphql` for `repository.id` and looks up the category by slug (`announcements` / `general`). Zero config now — works on any repo with Discussions enabled. Fails loudly with a clear `::error::` message if Discussions isn't enabled or the expected category is missing. Dropped the dependency on `vars.DISCUSSION_*` and removed every `if: steps.validate.outputs.ids_ok == 'true'` gate.

### Changed

- **README + README.vi badges** bumped to `3.4.1`.

### Notes

- This is a webapp + CI hotfix. No Python pipeline changes, no Tauri / Rust binary boundary change — `Cargo.toml` and `tauri.conf.json` stay at `0.1.1`, no THIRD_PARTY entries change.
- The leftover `DISCUSSION_REPO_ID` / `DISCUSSION_ANNOUNCEMENTS_CATEGORY_ID` / `DISCUSSION_GENERAL_CATEGORY_ID` repo variables (if you set them earlier) are now unused and can be removed from Settings → Variables.

---

## [3.4.0] - 2026-05-16 (Periodic refresh workflows + UTF-8 round-trip fix)

### Added

- **Update reviews — bi-weekly workflow.** New `scripts/update_reviews.py`, wrapper `bash/update_reviews.sh`, and `.github/workflows/update_reviews.yml` re-scrape every existing game's itch.io page on the 1st and 15th of each month (05:00 UTC) and write fresh `rating` + `rating_count`. Network errors / 404 keep the old values. Touches only those two fields — everything else (annotations, metadata) is left alone.
- **Update status — monthly workflow.** New `scripts/update_status.py`, `bash/update_status.sh`, and `.github/workflows/update_status.yml` refresh the `status` field on the 1st of each month (06:00 UTC). Same skip-on-error semantics.
- **Force update — manual emergency button.** New `scripts/force_update.py`, `bash/force_update.sh`, and [`.github/workflows/force_update.yml`](../../.github/workflows/force_update.yml) accept an optional `url` input. Empty input re-scrapes every game; a single URL targets just that one. `workflow_dispatch` only — no schedule. Every run preserves the three user-editable annotations (`safe_virus`, `notes`, `nsfw`) per the read/write field convention in [CLAUDE.md](../../CLAUDE.md). Doubles as the canonical repair tool for mojibake left by older webapp commits — re-scrape pulls clean UTF-8 from itch.io.
- **`generate_table.yml` chained on the three new workflows** so `lists/*.md` stay in sync after any data mutation.

### Fixed

- **UTF-8 mojibake on webapp commits.** `webapp/src/lib/github/contents.ts` `readFileWithSha` and `webapp/src/lib/github/git-data.ts` `bulkDeleteGames` were decoding GitHub's base64 content with `atob` alone, producing a Latin-1 binary string. Multi-byte UTF-8 sequences (e.g. Vietnamese `ã` = `0xC3 0xA3`) became two Latin-1 code points (`Ã£`); the next write re-encoded them as UTF-8 bytes, double-corrupting on every edit. Confirmed live damage in `data_game/game_info_002.json` (`BotÃÂÃÂ£o Esquerdo` was originally `Botão Esquerdo`). Extracted a shared helper `webapp/src/lib/github/encoding.ts` (`base64ToUtf8` / `utf8ToBase64`) that uses `TextDecoder('utf-8')` / `TextEncoder` and routes both call sites through it. Write path was already correct.

### Notes

- **Repair existing mojibake**: after this release deploys, run `Force update` once via `workflow_dispatch` with no input. It re-scrapes every game (~15–25 min) and writes back clean UTF-8 while preserving manual annotations. `generate_table.yml` will then auto-regenerate the markdown lists.
- **Browser cache**: anyone editing via the webapp should hard-refresh once after the new build lands so they're not using the pre-fix bundle (which would continue to mangle non-Latin chars on the next edit).
- **README + README.vi badges** bumped to `3.4.0`. No Tauri / Rust binary change — `Cargo.toml` and `tauri.conf.json` stay at `0.1.1`.
