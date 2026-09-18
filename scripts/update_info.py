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
     are retried; a link is given up after MAX_ATTEMPTS failures at least
     RETRY_GAP apart (tracked in scripts/state/ingest_state.json), so a burst
     of back-to-back runs during a short itch.io outage cannot use them all up.
     A page still throttled (429) after the retry is not the link's fault and
     counts as no attempt.
     A dispatched INPUT_URL is processed first and also written to the queue
     (`queue_add`), so it survives a retry, a deadline or a rate-limit stop.
     A second spelling of a queued game is left alone: the first copy's
     outcome removes every spelling (apply_patch compares canonical forms).

apply_patch.py then applies the patch to the latest `main`, so links queued
while this ran (extension, admin) are never overwritten.

Usage: python scripts/update_info.py --out patch.json [--deadline-min 50]
"""

import argparse
import os
import sys
import time
from datetime import datetime, timedelta

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
# Removed games the maintainer asked to bring back (admin Restore / approve with
# override). They are scraped despite the deleted log; the log entry goes only
# once the game is really re-added, so a still-paid game keeps its record.
UNBLOCKED = "scripts/state/unblocked.json"
MAX_ATTEMPTS = 3
RETRY_GAP = timedelta(hours=6)
DEAD_CODES = {404, 410}


def _ts(iso: str) -> datetime:
    return datetime.fromisoformat(iso.replace("Z", "+00:00"))


def failed_attempt(previous: dict, outcome: str, now: str) -> dict:
    """The ingest_state entry after a failed fetch at `now`.

    Only failures at least RETRY_GAP after the last counted one add an
    attempt; a link queued again after we gave up starts a fresh round.
    """
    if previous.get("gave_up") or not previous.get("attempts"):
        return {"attempts": 1, "last_attempt": now, "last_error": outcome}
    last = previous.get("last_attempt")
    if last and _ts(now) - _ts(last) < RETRY_GAP:
        return {**previous, "last_error": outcome}
    return {"attempts": previous["attempts"] + 1, "last_attempt": now, "last_error": outcome}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Scrape queued links into a patch.")
    ap.add_argument("--out", required=True, help="patch file to write")
    ap.add_argument("--deadline-min", type=float, default=50.0)
    args = ap.parse_args(argv)

    queue: list = load_json(TEMP_LINK)
    if not isinstance(queue, list):
        queue = []
    patch = new_patch("ingest")
    input_url = os.environ.get("INPUT_URL", "").strip()
    if input_url:
        # First, so a backlog can't starve it; queued, so it outlives this run.
        queue = [input_url, *queue]
        patch["queue_add"].append(canonicalize(input_url) or input_url)
        print(f"Added from workflow input: {input_url}")

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
    unblocked = set(load_json(UNBLOCKED, default=[]))
    ingest_state: dict = load_json(INGEST_STATE, default={})

    todo: list[str] = []
    seen: set[str] = set()
    for raw in queue:
        url = canonicalize(raw) if isinstance(raw, str) else None
        if url is None:
            print(f"Skip invalid: {raw!r}")
            stats["invalid"] += 1
            if isinstance(raw, str):  # non-strings are dropped by apply_patch itself
                patch["queue_remove"].append(raw)
            continue
        if url in seen:
            continue  # the first copy's final outcome drops every spelling
        seen.add(url)
        if url in catalog_urls:
            print(f"Skip duplicate: {url}")
            stats["duplicate"] += 1
            if url in unblocked:
                patch["unlog"].append(url)
        elif url in deleted_urls and url not in unblocked:
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
        if page.status == 429:
            print("  → throttled; stays queued, no attempt counted.")
            stats["retry"] += 1
            continue

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
            entry = failed_attempt(ingest_state.get(url, {}), outcome, now_iso())
            if entry["attempts"] >= MAX_ATTEMPTS:
                print(f"  → {outcome}; giving up after {entry['attempts']} attempts.")
                patch["queue_remove"].append(url)
                patch["ingest_state"][url] = {**entry, "gave_up": entry["last_attempt"]}
                stats["gave_up"] += 1
                if url in unblocked:
                    patch["unblock_remove"].append(url)
            else:
                print(f"  → {outcome}; stays queued ({entry['attempts']}/{MAX_ATTEMPTS} attempts).")
                patch["ingest_state"][url] = entry
                stats["retry"] += 1
            continue

        print(f"  → {outcome}")
        stats[outcome] += 1
        patch["queue_remove"].append(url)
        patch["ingest_state"][url] = None
        if url in unblocked:
            patch["unlog" if outcome == "added" else "unblock_remove"].append(url)

    write_patch(args.out, patch)
    print(
        f"\nDone — {stats['added']} added, {stats['paid']} paid, {stats['dead']} dead, "
        f"{stats['duplicate']} duplicates, {stats['deleted']} previously deleted, "
        f"{stats['invalid']} invalid, {stats['retry']} to retry, {stats['gave_up']} given up."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
