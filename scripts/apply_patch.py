"""
apply_patch.py — Apply a pipeline patch to the current working tree.

Called by bash/commit_push.sh right after `git reset --hard origin/main`, so it
always works on the latest data. Idempotent: applying the same patch twice
(e.g. after a rejected push) gives the same result.

  - additions:  appended when the URL is not already in the catalog
  - updates:    applied to existing games; editable fields are never touched
  - removals:   game removed + logged in scripts/deleted_games.json
  - *_state:    merged into scripts/state/*.json (null drops an entry)
  - queue_remove: those URLs are dropped from scripts/temp_link.json, which is
                  re-read here so URLs queued meanwhile survive

Validation (validate.py) runs last; any error exits 1 so nothing is pushed.

Usage: python scripts/apply_patch.py PATCH.json
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from canonical import canonicalize
from data_store import load_all_games, save_all_games
from json_io import dedup_deleted, load_json, save_json, save_state_map
from patch import is_empty, load_patch
from validate import validate

PRESERVE_FIELDS = ("safe_virus", "notes", "nsfw")
DELETED_LOG = "scripts/deleted_games.json"
TEMP_LINK = "scripts/temp_link.json"
REFRESH_STATE = "scripts/state/refresh_state.json"
INGEST_STATE = "scripts/state/ingest_state.json"


def apply(patch: dict) -> dict:
    """Apply `patch` to the files under the current directory; returns counts."""
    games = load_all_games()
    by_url = {g["url"]: g for g in games}
    counts = dict.fromkeys(("added", "updated", "removed", "unqueued"), 0)

    for record in patch.get("additions", []):
        url = record.get("url")
        if url and url not in by_url:
            games.append(record)
            by_url[url] = record
            counts["added"] += 1

    for url, fields in patch.get("updates", {}).items():
        game = by_url.get(url)
        if game is None:
            continue
        changed = False
        for key, value in fields.items():
            if key in PRESERVE_FIELDS or key == "url":
                continue
            if game.get(key) != value:
                game[key] = value
                changed = True
        counts["updated"] += changed

    removals = patch.get("removals", [])
    removed_urls = {r["url"] for r in removals}
    if removed_urls:
        kept = [g for g in games if g["url"] not in removed_urls]
        counts["removed"] = len(games) - len(kept)
        games = kept
        log = load_json(DELETED_LOG)
        save_json(DELETED_LOG, dedup_deleted(log + removals))

    save_all_games(games)
    live_urls = {g["url"] for g in games}

    for path, key, keep_only_live in (
        (REFRESH_STATE, "refresh_state", True),
        (INGEST_STATE, "ingest_state", False),
    ):
        delta = patch.get(key, {})
        if not delta:
            continue
        state = load_json(path, default={})
        for url, entry in delta.items():
            if entry is None:
                state.pop(url, None)
            else:
                state[url] = entry
        if keep_only_live:
            state = {u: e for u, e in state.items() if u in live_urls}
        save_state_map(path, state)

    drop = {canonicalize(u) or u for u in patch.get("queue_remove", [])}
    if drop and os.path.exists(TEMP_LINK):
        queue = load_json(TEMP_LINK)
        remaining = [u for u in queue if (canonicalize(u) or u) not in drop]
        counts["unqueued"] = len(queue) - len(remaining)
        save_json(TEMP_LINK, remaining)

    return counts


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) != 1:
        print(__doc__)
        return 2
    patch = load_patch(argv[0])
    if is_empty(patch):
        print("Patch is empty — nothing to apply.")
        return 0
    counts = apply(patch)
    print(
        f"apply_patch ({patch.get('kind')}): {counts['added']} added, "
        f"{counts['updated']} updated, {counts['removed']} removed, "
        f"{counts['unqueued']} dropped from the queue."
    )
    errors, warnings = validate()
    for w in warnings:
        print(f"::warning::{w}")
    for e in errors:
        print(f"::error::{e}")
    if errors:
        print("Validation failed — refusing to commit.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
