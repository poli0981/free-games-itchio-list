"""
update_reviews.py — Refresh `rating` + `rating_count` on existing games.

Scheduled bi-weekly. Re-fetches each game's itch.io page, extracts only the two
review-related fields, leaves everything else (including user annotations
safe_virus / notes / nsfw) untouched.

Flow:
  1. Load all games from data_game/
  2. For each game, scrape fresh page → take rating + rating_count
  3. Network error / 404 → keep old values (don't blank them)
  4. Save updated games (auto-rebalanced chunks)
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
        print(f"[{idx}/{total}] Refreshing reviews: {name}")

        fresh = scrape_game_info(session, url)

        if fresh is None:
            # Network or parse error — keep old values
            print("  → Error, keeping old rating.")
            errors += 1
        else:
            new_rating = fresh.get("rating", "N/A")
            new_count = fresh.get("rating_count", "N/A")
            old_rating = game.get("rating", "N/A")
            old_count = game.get("rating_count", "N/A")
            if new_rating != old_rating or new_count != old_count:
                game["rating"] = new_rating
                game["rating_count"] = new_count
                updated += 1
                print(f"  ✓ {old_rating} ({old_count}) → {new_rating} ({new_count})")
            else:
                skipped += 1

        # Rate limiting
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
