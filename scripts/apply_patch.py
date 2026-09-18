"""
apply_patch.py — Apply a pipeline patch to the current working tree.

Called by bash/commit_push.sh right after `git reset --hard origin/main`, so it
always works on the latest data. Idempotent: applying the same patch twice
(e.g. after a rejected push) gives the same result.

  - additions:  appended when the URL is not already in the catalog
  - updates:    applied to existing games; editable fields are never touched
  - removals:   game removed + logged in scripts/deleted_games.json, unless a
                newer check of that game (another run) has landed since
  - *_state:    merged into scripts/state/*.json (null drops an entry); for
                refresh_state the newer `checked` wins and the newest `full`
                stamp from either side is kept
  - unlog / unblock_remove: an unblocked (restored) game that was re-added
                leaves the deleted log and scripts/state/unblocked.json; one whose
                ingest ended otherwise leaves only the allow-list
  - queue_add / queue_remove: appended to / dropped from scripts/temp_link.json,
                which is re-read here so URLs queued meanwhile survive. Entries
                that are not URL strings are dropped on every apply.

Safety: unless ALLOW_MASS_REMOVAL=1, a refresh patch may remove at most
max(10, 10%) of the games it checked (refresh.py's own limit, re-checked here
in case a scan never reached its guard), and any patch at most max(25, 5%) of
the catalog.

Validation (validate.py) runs last; any error exits 1 so nothing is pushed.

Usage: python scripts/apply_patch.py PATCH.json
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from canonical import canonicalize
from data_store import load_all_games, save_all_games
from json_io import dedup_deleted, load_json, save_json, save_state_map
from patch import is_empty, load_patch
from refresh import mass_limit
from validate import validate

PRESERVE_FIELDS = ("safe_virus", "notes", "nsfw")
DELETED_LOG = "scripts/deleted_games.json"
TEMP_LINK = "scripts/temp_link.json"
REFRESH_STATE = "scripts/state/refresh_state.json"
INGEST_STATE = "scripts/state/ingest_state.json"
UNBLOCKED = "scripts/state/unblocked.json"
MASS_REMOVAL_FLOOR = 25
MASS_REMOVAL_SHARE = 0.05


def mass_removal_limit(patch: dict, total: int) -> int:
    limit = max(MASS_REMOVAL_FLOOR, math.ceil(MASS_REMOVAL_SHARE * total))
    checked = patch.get("stats", {}).get("checked")
    if patch.get("kind") in ("refresh", "full") and isinstance(checked, int):
        limit = min(limit, mass_limit(checked))
    return limit


def _queue_key(url: str) -> str:
    return canonicalize(url) or url


def clean_queue(raw) -> list[str]:
    """temp_link.json as a list of strings ({"url": ...} objects are unwrapped)."""
    if not isinstance(raw, list):
        print("::warning::temp_link.json is not a JSON array — resetting it")
        return []
    queue: list[str] = []
    for item in raw:
        if isinstance(item, dict) and isinstance(item.get("url"), str):
            item = item["url"]
        if isinstance(item, str):
            queue.append(item)
        else:
            print(f"::warning::dropping a queue entry that is not a URL: {item!r}")
    return queue


def _merge_refresh_entry(current: dict | None, entry: dict) -> dict:
    """Newest check wins; the newest `full` stamp is kept from either side.

    Overlapping scans start from the same state, so an older observation (an
    error snapshot with a stale strike, say) must never undo a newer one, in
    whichever order their applies land.
    """
    current = current or {}
    base = current if current.get("checked", "") > entry.get("checked", "") else entry
    full = max(current.get("full", ""), entry.get("full", ""))
    return {**base, "full": full} if full else base


def apply(patch: dict) -> dict:
    """Apply `patch` to the files under the current directory; returns counts."""
    games = load_all_games()
    by_url = {g["url"]: g for g in games}
    refresh_state = load_json(REFRESH_STATE, default={})
    counts = dict.fromkeys(("added", "updated", "removed", "stale", "queued", "unqueued"), 0)

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

    # A removal decided by a scan is dropped when another run has checked the
    # game since (overlapping scans read the same starting state).
    removals, stale = [], set()
    for removal in patch.get("removals", []):
        checked = refresh_state.get(removal["url"], {}).get("checked", "")
        if checked > removal["deleted_at"]:
            stale.add(removal["url"])
        else:
            removals.append(removal)
    counts["stale"] = len(stale)
    removed_urls = {r["url"] for r in removals}
    if removed_urls:
        kept = [g for g in games if g["url"] not in removed_urls]
        counts["removed"] = len(games) - len(kept)
        games = kept
        log = load_json(DELETED_LOG)
        save_json(DELETED_LOG, dedup_deleted(log + removals))

    save_all_games(games)
    live_urls = {g["url"] for g in games}

    for path, key, state in (
        (REFRESH_STATE, "refresh_state", refresh_state),
        (INGEST_STATE, "ingest_state", None),
    ):
        delta = patch.get(key, {})
        if not delta:
            continue
        if state is None:
            state = load_json(path, default={})
        for url, entry in delta.items():
            if entry is None:
                if url not in stale:
                    state.pop(url, None)
            elif key == "refresh_state":
                state[url] = _merge_refresh_entry(state.get(url), entry)
            else:
                state[url] = entry
        if key == "refresh_state":
            state = {u: e for u, e in state.items() if u in live_urls}
        save_state_map(path, state)

    unlog = {u for u in patch.get("unlog", []) if isinstance(u, str)}
    finished = unlog | {u for u in patch.get("unblock_remove", []) if isinstance(u, str)}
    if unlog:
        log = load_json(DELETED_LOG)
        kept = [e for e in log if e.get("url") not in unlog]
        if len(kept) != len(log):
            save_json(DELETED_LOG, kept)
    if finished and os.path.exists(UNBLOCKED):
        allowed = load_json(UNBLOCKED)
        remaining = sorted(u for u in allowed if u not in finished)
        if remaining != allowed:
            save_json(UNBLOCKED, remaining)

    raw_queue = load_json(TEMP_LINK)
    queue = clean_queue(raw_queue)
    present = {_queue_key(u) for u in queue}
    appended = []
    for url in patch.get("queue_add", []):
        if isinstance(url, str) and _queue_key(url) not in present:
            queue.append(url)
            appended.append(url)
            present.add(_queue_key(url))
    drop = {_queue_key(u) for u in patch.get("queue_remove", []) if isinstance(u, str)}
    remaining = [u for u in queue if _queue_key(u) not in drop]
    counts["unqueued"] = len(queue) - len(remaining)
    counts["queued"] = sum(1 for u in appended if u in remaining)
    if remaining != raw_queue:
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
    removals = patch.get("removals", [])
    if removals and os.environ.get("ALLOW_MASS_REMOVAL") != "1":
        total = len(load_all_games())
        limit = mass_removal_limit(patch, total)
        if len(removals) > limit:
            print(
                f"::error::The patch removes {len(removals)} of {total} games "
                f"(limit {limit}) — refusing. This usually means itch.io changed "
                "its page markup. Set ALLOW_MASS_REMOVAL=1 to apply it."
            )
            return 1
    counts = apply(patch)
    print(
        f"apply_patch ({patch.get('kind')}): {counts['added']} added, "
        f"{counts['updated']} updated, {counts['removed']} removed "
        f"({counts['stale']} stale removals skipped), {counts['queued']} queued, "
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
