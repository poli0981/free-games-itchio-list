"""
check_paid.py — Re-check existing free games for paid status.

Flow:
  1. Load all games from data_game/
  2. For each game, re-fetch page and check is_free
  3. If game became paid → remove from list, log to deleted_games.json
  4. Network errors → keep game (don't delete on transient failures)
  5. Save updated games (auto-rebalanced chunks)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from data_store import load_all_games, save_all_games
from json_io import dedup_deleted, load_json, save_json
from scraper import (
    batch_pause,
    check_still_free,
    create_session,
    now_iso,
    polite_delay,
    should_batch_pause,
)

DELETED_LOG = "scripts/deleted_games.json"


def main() -> None:
    games: list[dict] = load_all_games()
    if not games:
        print("No games found — nothing to check.")
        return

    deleted_log: list[dict] = load_json(DELETED_LOG)
    session = create_session()

    keep: list[dict] = []
    removed = 0
    errors = 0
    total = len(games)

    for idx, game in enumerate(games, start=1):
        url = game.get("url", "")
        name = game.get("name", "?")
        print(f"[{idx}/{total}] Checking: {name}")

        result = check_still_free(session, url)

        if result is None:
            # Network error — don't delete, keep game
            print("  → Network error, keeping game.")
            keep.append(game)
            errors += 1
        elif result is True:
            # Still free
            keep.append(game)
        else:
            # Became paid → remove
            print("  ✘ Game became paid — removing.")
            deleted_log.append({
                "url": url,
                "name": name,
                "reason": "Game became paid",
                "deleted_at": now_iso(),
            })
            removed += 1

        # Rate limiting
        if should_batch_pause(idx):
            batch_pause()
        else:
            polite_delay()

    # Save
    save_all_games(keep)
    save_json(DELETED_LOG, dedup_deleted(deleted_log))

    print(
        f"\nDone — {removed} removed (paid), {errors} network errors, "
        f"{len(keep)} games remaining."
    )


if __name__ == "__main__":
    main()
