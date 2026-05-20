"""
log_deleted.py — Convert deleted_games.json → deleted_games.txt

Produces a human-readable log file of all games removed from the list.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from json_io import dedup_deleted

DELETED_JSON = "scripts/deleted_games.json"
DELETED_TXT = "deleted_games.txt"


def main() -> None:
    if not os.path.exists(DELETED_JSON):
        print("No deleted_games.json found — nothing to export.")
        return

    with open(DELETED_JSON, encoding="utf-8") as f:
        entries: list[dict] = json.load(f)

    entries = dedup_deleted(entries)

    if not entries:
        print("deleted_games.json is empty — nothing to export.")
        # Still write an empty-state file
        with open(DELETED_TXT, "w", encoding="utf-8") as f:
            f.write("=== Deleted Games Log ===\n\n(No games have been deleted yet.)\n")
        return

    # Sort by deletion date (newest first)
    entries.sort(key=lambda e: e.get("deleted_at", ""), reverse=True)

    with open(DELETED_TXT, "w", encoding="utf-8") as f:
        f.write("=== Deleted Games Log ===\n")
        f.write(f"Total deleted: {len(entries)}\n")
        f.write("=" * 50 + "\n\n")

        for i, entry in enumerate(entries, start=1):
            date = entry.get("deleted_at", "N/A")
            # Extract just the date portion for display
            date_short = date[:10] if len(date) >= 10 else date

            name   = entry.get("name", "Unknown")
            url    = entry.get("url", "N/A")
            reason = entry.get("reason", "N/A")

            f.write(f"{i}. [{date_short}] {name}\n")
            f.write(f"   URL:    {url}\n")
            f.write(f"   Reason: {reason}\n")
            f.write("\n")

    print(f"Exported {len(entries)} deleted game(s) -> {DELETED_TXT}")


if __name__ == "__main__":
    main()
