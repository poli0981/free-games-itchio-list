"""
update_info.py — Scrape new game links from temp_link.json.

Flow:
  1. Read URLs from scripts/temp_link.json
  2. Skip duplicates already in scripts/game_info.json
  3. Fetch each page → detect free/paid BEFORE collecting info
  4. Only keep free games
  5. Merge into game_info.json
"""

import json
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

TEMP_LINK = "scripts/temp_link.json"
GAME_INFO = "scripts/game_info.json"


def main() -> None:
    if not os.path.exists(TEMP_LINK):
        print("No temp_link.json found — nothing to do.")
        return

    with open(TEMP_LINK, "r", encoding="utf-8") as f:
        new_links: list[str] = json.load(f)

    if not new_links:
        print("temp_link.json is empty — nothing to do.")
        return

    # Load existing
    existing: list[dict] = []
    if os.path.exists(GAME_INFO):
        with open(GAME_INFO, "r", encoding="utf-8") as f:
            existing = json.load(f)

    existing_urls: set[str] = {g["url"] for g in existing}

    session = create_session()
    added = 0
    skipped_paid = 0
    skipped_dup = 0
    failed = 0
    total = len(new_links)

    for idx, link in enumerate(new_links, start=1):
        if link in existing_urls:
            print(f"[{idx}/{total}] Skip duplicate: {link}")
            skipped_dup += 1
            continue

        print(f"[{idx}/{total}] Scraping: {link}")
        info = scrape_game_info(session, link)

        if info is None:
            failed += 1
            polite_delay()
            continue

        if not info.get("is_free", True):
            print(f"  → Paid game, skipping.")
            skipped_paid += 1
            polite_delay()
            continue

        # Remove internal flag before saving
        info.pop("is_free", None)
        existing.append(info)
        existing_urls.add(link)
        added += 1

        # Rate limiting
        if should_batch_pause(idx):
            batch_pause()
        else:
            polite_delay()

    # Save
    with open(GAME_INFO, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=4)

    print(
        f"\nDone — {added} added, {skipped_paid} paid (skipped), "
        f"{skipped_dup} duplicates, {failed} failed, {len(existing)} total."
    )


if __name__ == "__main__":
    main()
