"""
json_io.py — Shared JSON helpers for the scraper pipeline.

Small utilities used by several scripts:
  - load_json / save_json: read/write JSON files (UTF-8, pretty-printed).
  - dedup_deleted: de-duplicate the deleted-games log by URL.
"""

import json
import os


def load_json(path: str, default=None):
    """Load a JSON file, returning `default` (default: []) when it doesn't exist."""
    if default is None:
        default = []
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return default


def save_json(path: str, data) -> None:
    """Write `data` to `path` as pretty-printed UTF-8 JSON."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def dedup_deleted(entries: list[dict]) -> list[dict]:
    """De-duplicate the deleted-games log by URL.

    Keeps the earliest `deleted_at` per URL, so a game that is removed,
    re-added by the scraper, then removed again is logged only once.
    Entries sharing a name but with different urls are kept separate
    (they are genuinely different games). Entries without a url are dropped.
    The result is sorted ascending by `deleted_at`.
    """
    by_url: dict[str, dict] = {}
    for entry in entries:
        url = entry.get("url", "")
        if not url:
            continue
        current = by_url.get(url)
        if current is None or entry.get("deleted_at", "") < current.get("deleted_at", ""):
            by_url[url] = entry
    return sorted(by_url.values(), key=lambda e: e.get("deleted_at", ""))
