"""
force_update.py — Emergency re-scrape of one or all existing games.

Manual `workflow_dispatch` only. Use when data has drifted or been corrupted
(e.g. mojibake from an old read/write pipeline, missing fields after a scraper
upgrade). Re-fetches the full itch.io page, replaces every scraper-owned field
with fresh values, but ALWAYS preserves the three user-editable annotations:

    safe_virus, notes, nsfw

(per CLAUDE.md "Editable vs read-only fields"). No "nuclear reset" mode —
re-running this won't blow away your manual marks.

Inputs (env vars set by the workflow):
    INPUT_URL   optional, single itch.io URL — re-scrape only this game.
                Empty / unset → re-scrape every game in data_game/.

Flow:
  1. Load all games from data_game/
  2. Pick targets (single URL or all)
  3. For each, scrape fresh; merge over old record, keeping the 3 preserved fields
  4. Network error / 404 → log warning, KEEP the old record unchanged
     (check_alive.py is the canonical path for pruning dead links)
  5. Save updated games (auto-rebalanced chunks)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from data_store import load_all_games, save_all_games
from scraper import (
    batch_pause,
    create_session,
    polite_delay,
    scrape_game_info,
    should_batch_pause,
)

# Fields the scraper does NOT own — never overwrite, regardless of scrape result.
PRESERVE_FIELDS = ("safe_virus", "notes", "nsfw")


def _normalize_url(u: str) -> str:
    return (u or "").strip().rstrip("/")


def main() -> None:
    games: list[dict] = load_all_games()
    if not games:
        print("No games found — nothing to update.")
        return

    target_url = _normalize_url(os.environ.get("INPUT_URL", ""))

    if target_url:
        targets = [g for g in games if _normalize_url(g.get("url", "")) == target_url]
        if not targets:
            print(f"URL not found in data_game/: {target_url}")
            sys.exit(1)
        print(f"Force-updating ONE game: {targets[0].get('name', '?')}")
    else:
        targets = games
        print(f"Force-updating ALL {len(targets)} games (preserving annotations).")

    session = create_session()

    updated = 0
    errors = 0
    not_found = 0
    total = len(targets)

    for idx, game in enumerate(targets, start=1):
        url = game.get("url", "")
        name = game.get("name", "?")
        print(f"[{idx}/{total}] Re-scraping: {name}")

        fresh = scrape_game_info(session, url)

        if fresh is None:
            print("  → Network / parse error — keeping existing record.")
            errors += 1
        elif fresh.get("name", "").strip() in ("", "N/A"):
            # Empty name typically means the page returned 404 or a soft-removed game.
            print("  → Page returned no title — likely 404. Keeping existing record.")
            not_found += 1
        else:
            preserved = {k: game.get(k) for k in PRESERVE_FIELDS if k in game}
            game.clear()
            game.update(fresh)
            # is_free is a scrape-time flag, not part of the persisted schema.
            game.pop("is_free", None)
            for k, v in preserved.items():
                if v is not None:
                    game[k] = v
            updated += 1

        if should_batch_pause(idx):
            batch_pause()
        else:
            polite_delay()

    save_all_games(games)

    print(
        f"\nDone — {updated} re-scraped, {errors} errors, {not_found} unreachable "
        f"({total} targeted)."
    )


if __name__ == "__main__":
    main()
