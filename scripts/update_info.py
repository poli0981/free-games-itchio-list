"""
update_info.py — Scrape new game links from temp_link.json.

Flow:
  1. Read URLs from scripts/temp_link.json
  2. Skip duplicates already in data_game/
  3. Fetch each page → detect free/paid BEFORE collecting info
  4. Only keep free games
  5. Merge into data_game/ (chunked JSON files)
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from data_store import get_all_urls, load_all_games, save_all_games
from scraper import (
    batch_pause,
    create_session,
    polite_delay,
    scrape_game_info,
    should_batch_pause,
)

TEMP_LINK = "scripts/temp_link.json"


def main() -> None:
    new_links: list[str] = []

    if os.path.exists(TEMP_LINK):
        with open(TEMP_LINK, encoding="utf-8") as f:
            new_links = json.load(f)

    # Append a single URL passed via workflow_dispatch input (webapp uses this).
    input_url = os.environ.get("INPUT_URL", "").strip()
    if input_url:
        if input_url not in new_links:
            new_links.append(input_url)
            print(f"Added from workflow input: {input_url}")
        else:
            print(f"workflow input URL already queued: {input_url}")

    if not new_links:
        print("No links to process (temp_link.json empty and no INPUT_URL).")
        return

    # Load existing
    existing: list[dict] = load_all_games()
    existing_urls: set[str] = get_all_urls(existing)

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
            print("  → Paid game, skipping.")
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
    save_all_games(existing)

    print(
        f"\nDone — {added} added, {skipped_paid} paid (skipped), "
        f"{skipped_dup} duplicates, {failed} failed, {len(existing)} total."
    )


if __name__ == "__main__":
    main()
