"""
check_alive.py — Verify that game URLs are still alive.

Flow:
  1. Load all games from data_game/
  2. For each game URL, do a lightweight GET (stream=True)
  3. 200 → keep
  4. 404 → remove + log
  5. 403 / 5xx / timeout → keep (may be transient / rate-limit)
  6. Save updated games (auto-rebalanced chunks)

Uses lighter delays than full scrape since we don't parse HTML.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from scraper import (
    create_session,
    check_url_alive,
    light_delay,
    batch_pause,
    should_batch_pause,
    now_iso,
)
from data_store import load_all_games, save_all_games

DELETED_LOG = "scripts/deleted_games.json"

# Only these status codes trigger deletion
DEAD_CODES = {404, 410}  # Not Found, Gone


def load_json(path: str, default=None):
    if default is None:
        default = []
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path: str, data) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


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

        status = check_url_alive(session, url)

        if status is None:
            # Connection failed entirely — keep game
            print(f"  → Connection error, keeping game.")
            keep.append(game)
            errors += 1
        elif status in DEAD_CODES:
            print(f"  ✘ HTTP {status} — removing.")
            deleted_log.append({
                "url": url,
                "name": name,
                "reason": f"Game page no longer exists (HTTP {status})",
                "deleted_at": now_iso(),
            })
            removed += 1
        else:
            # 200, 301, 302, 403, 5xx → keep
            if status != 200:
                print(f"  → HTTP {status}, keeping (may be transient).")
            keep.append(game)

        # Rate limiting (lighter since no full parse)
        if should_batch_pause(idx):
            batch_pause()
        else:
            light_delay()

    # Save
    save_all_games(keep)
    save_json(DELETED_LOG, deleted_log)

    print(
        f"\nDone — {removed} removed (dead), {errors} errors, "
        f"{len(keep)} games remaining."
    )


if __name__ == "__main__":
    main()