"""
update_status.py — Refresh `status` on existing games.

Scheduled monthly. Re-fetches each game's itch.io page, extracts only the
`Status` field (e.g. Prototype → Released, In development → Canceled).

Flow:
  1. Load all games from data_game/
  2. For each game, scrape fresh page → take status
  3. Network error / 404 → keep old value
  4. Save updated games (auto-rebalanced chunks)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from scraper import (
    create_session,
    scrape_game_info,
    polite_delay,
    batch_pause,
    should_batch_pause,
)
from data_store import load_all_games, save_all_games


def main() -> None:
    games: list[dict] = load_all_games()
    if not games:
        print("No games found — nothing to update.")
        return

    session = create_session()

    updated = 0
    skipped = 0
    errors = 0
    total = len(games)

    for idx, game in enumerate(games, start=1):
        url = game.get("url", "")
        name = game.get("name", "?")
        print(f"[{idx}/{total}] Refreshing status: {name}")

        fresh = scrape_game_info(session, url)

        if fresh is None:
            print("  → Error, keeping old status.")
            errors += 1
        else:
            new_status = fresh.get("status", "N/A")
            old_status = game.get("status", "N/A")
            if new_status != old_status:
                game["status"] = new_status
                updated += 1
                print(f"  ✓ {old_status} → {new_status}")
            else:
                skipped += 1

        if should_batch_pause(idx):
            batch_pause()
        else:
            polite_delay()

    save_all_games(games)

    print(
        f"\nDone — {updated} updated, {skipped} unchanged, {errors} errors "
        f"({total} games total)."
    )


if __name__ == "__main__":
    main()
