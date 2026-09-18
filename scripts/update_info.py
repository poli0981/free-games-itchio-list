"""
update_info.py — Scrape queued game links into a pipeline patch.

Flow:
  1. Read URLs from scripts/temp_link.json (+ INPUT_URL from workflow_dispatch)
  2. Canonicalize; drop invalid URLs, duplicates, games already in the catalog
     and games in scripts/deleted_games.json (the admin restores a deleted
     game by removing its log entry when approving it again)
  3. Fetch each page → keep only free games (with an `added_at` stamp)
  4. Emit a patch (see patch.py). URLs that finished (added / paid / dead /
     skipped) are dropped from the queue; transient failures stay queued and
     are retried up to MAX_ATTEMPTS runs (tracked in scripts/state/ingest_state.json).

apply_patch.py then applies the patch to the latest `main`, so links queued
while this ran (extension, admin) are never overwritten.

Usage: python scripts/update_info.py --out patch.json [--deadline-min 50]
"""

import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
from canonical import canonicalize
from data_store import get_all_urls, load_all_games
from json_io import load_json
from patch import new_patch, write_patch
from refresh import fetch_with_backoff
from scraper import NA, Pacer, create_session, now_iso, parse_game

TEMP_LINK = "scripts/temp_link.json"
DELETED_LOG = "scripts/deleted_games.json"
INGEST_STATE = "scripts/state/ingest_state.json"
MAX_ATTEMPTS = 3
DEAD_CODES = {404, 410}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Scrape queued links into a patch.")
    ap.add_argument("--out", required=True, help="patch file to write")
    ap.add_argument("--deadline-min", type=float, default=50.0)
    args = ap.parse_args(argv)

    queue: list = load_json(TEMP_LINK)
    input_url = os.environ.get("INPUT_URL", "").strip()
    if input_url:
        queue = [*queue, input_url]
        print(f"Added from workflow input: {input_url}")

    patch = new_patch("ingest")
    stats = dict.fromkeys(
        ("queued", "added", "paid", "dead", "duplicate", "deleted", "invalid", "retry", "gave_up"),
        0,
    )
    stats["queued"] = len(queue)
    patch["stats"] = stats
    if not queue:
        print("No links to process (temp_link.json empty and no INPUT_URL).")
        write_patch(args.out, patch)
        return 0

    catalog_urls = get_all_urls(load_all_games())
    deleted_urls = {e.get("url") for e in load_json(DELETED_LOG)}
    ingest_state: dict = load_json(INGEST_STATE, default={})

    todo: list[str] = []
    seen: set[str] = set()
    for raw in queue:
        url = canonicalize(raw) if isinstance(raw, str) else None
        if url is None:
            print(f"Skip invalid: {raw!r}")
            stats["invalid"] += 1
            patch["queue_remove"].append(raw if isinstance(raw, str) else str(raw))
            continue
        if url in seen:
            patch["queue_remove"].append(raw)
            continue
        seen.add(url)
        if url in catalog_urls:
            print(f"Skip duplicate: {url}")
            stats["duplicate"] += 1
        elif url in deleted_urls:
            print(f"Skip previously deleted: {url} (restore it from the admin page)")
            stats["deleted"] += 1
        else:
            todo.append(url)
            continue
        patch["queue_remove"].append(raw)
        patch["ingest_state"][url] = None

    session, pacer, started = create_session(), Pacer(), time.monotonic()
    counters = {"http_429": 0, "consecutive_429": 0}
    for idx, url in enumerate(todo, start=1):
        if time.monotonic() - started > args.deadline_min * 60:
            print("Deadline reached — the rest stays queued for the next run.")
            break
        print(f"[{idx}/{len(todo)}] Scraping: {url}")
        page = fetch_with_backoff(session, url, pacer, counters)
        if page is None:
            print("::warning::itch.io rate limit — the rest stays queued for the next run.")
            break

        outcome = ""
        if page.status == 200 and page.soup is not None:
            record = parse_game(page.soup, url)
            if record["name"] == NA:
                outcome = "error: no title"
            elif not record.pop("is_free"):
                outcome = "paid"
            else:
                record["added_at"] = now_iso()
                patch["additions"].append(record)
                outcome = "added"
        elif page.status in DEAD_CODES:
            outcome = "dead"
        else:
            outcome = f"error: HTTP {page.status or page.error}"

        if outcome.startswith("error"):
            previous = ingest_state.get(url, {})
            # A link queued again after we gave up starts a fresh round of attempts.
            attempts = (0 if previous.get("gave_up") else previous.get("attempts", 0)) + 1
            if attempts >= MAX_ATTEMPTS:
                print(f"  → {outcome}; giving up after {attempts} attempts.")
                patch["queue_remove"].append(url)
                patch["ingest_state"][url] = {
                    "attempts": attempts,
                    "gave_up": now_iso(),
                    "last_error": outcome,
                }
                stats["gave_up"] += 1
            else:
                print(f"  → {outcome}; will retry next run ({attempts}/{MAX_ATTEMPTS}).")
                patch["ingest_state"][url] = {"attempts": attempts, "last_error": outcome}
                stats["retry"] += 1
            continue

        print(f"  → {outcome}")
        stats[outcome] += 1
        patch["queue_remove"].append(url)
        patch["ingest_state"][url] = None

    write_patch(args.out, patch)
    print(
        f"\nDone — {stats['added']} added, {stats['paid']} paid, {stats['dead']} dead, "
        f"{stats['duplicate']} duplicates, {stats['deleted']} previously deleted, "
        f"{stats['invalid']} invalid, {stats['retry']} to retry, {stats['gave_up']} given up."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
