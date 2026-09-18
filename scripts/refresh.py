"""
refresh.py — Rotating health check for the whole catalog (one GET per game).

Replaces check_paid / check_alive / update_reviews / update_status (which each
crawled all 2,600+ pages, overran their job timeouts and lost everything) and
force_update (now `--full`).

Each run checks a slice of the catalog — games with a pending strike first,
then the least recently checked — about 1/7 of the catalog by default, so
every game is re-checked weekly. From that single page it derives:
  - alive:  404/410  → "dead" strike
  - price:  paid     → "paid" strike
  - rating, rating_count, status (+ backfills release_date / thumbnail /
    updated_at when missing)
A game is removed only when the same strike is seen again at least
MIN_STRIKE_GAP after it was first seen (a single 404 or a flaky price widget
no longer deletes a game). If a run would remove, or newly strike, more than
max(10, 10%) of the games it checked, all its removals are withheld (marked
`withheld_at`, so no later short run removes them either) and the run is
flagged: that pattern means itch.io changed its markup, not that hundreds of
games went paid overnight. A run with --allow-mass-removal applies them; a
healthy check clears them.

Nothing is written to the catalog here. The run emits a patch (see patch.py)
that apply_patch.py applies to the latest `main`. The patch is checkpointed
every CHECKPOINT_EVERY games and the run stops cleanly before --deadline-min,
so a scan that fails or hits its step timeout still hands over its progress
(refresh.yml applies it; a manually cancelled run applies nothing). A
checkpoint never carries removals — those games keep their matured strike
and are first in line for the next run.

Usage:
  python scripts/refresh.py --out patch.json [--budget N] [--deadline-min 45]
  python scripts/refresh.py --full [--url URL ...] --out patch.json   # re-scrape all fields
"""

import argparse
import copy
import math
import os
import sys
import time
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))
from canonical import canonicalize
from data_store import load_all_games
from json_io import load_json
from patch import new_patch, write_patch
from scraper import (
    NA,
    Pacer,
    Page,
    create_session,
    extract_thumbnail,
    fetch_page,
    find_title,
    has_info_panel,
    is_free_game,
    now_iso,
    parse_game,
    parse_info_table,
)

STATE_FILE = "scripts/state/refresh_state.json"

# User-editable annotations: never overwritten by any scrape.
PRESERVE_FIELDS = ("safe_virus", "notes", "nsfw")

DEAD_CODES = {404, 410}
CHECKPOINT_EVERY = 50
MAX_CONSECUTIVE_429 = 3
DEFAULT_CYCLE_DAYS = 7
MIN_STRIKE_GAP = timedelta(hours=20)
MASS_FLOOR = 10
MASS_SHARE = 0.10

REASON_PAID = "Game became paid"


def reason_dead(code: int) -> str:
    return f"Game page no longer exists (HTTP {code})"


# ---------------------------------------------------------------------------
# Target selection
# ---------------------------------------------------------------------------
def default_budget(total: int) -> int:
    return max(1, math.ceil(total / DEFAULT_CYCLE_DAYS))


def _ts(iso: str) -> datetime:
    return datetime.fromisoformat(iso.replace("Z", "+00:00"))


def strike_matured(entry: dict, now: str) -> bool:
    """Whether the entry's strike was first seen at least MIN_STRIKE_GAP before `now`."""
    first = entry.get("strike_at")
    return bool(entry.get("strike") and first) and _ts(now) - _ts(first) >= MIN_STRIKE_GAP


def mass_limit(checked: int) -> int:
    """Most removals (or new strikes) one run may produce before it is flagged."""
    return max(MASS_FLOOR, math.ceil(MASS_SHARE * checked))


def select_targets(
    games: list[dict], state: dict, budget: int, now: str, full: bool = False
) -> list[dict]:
    """Matured strikes first, then least recently checked.

    Never-checked games sort first; ties keep catalog order (stable sort).
    Full mode rotates on its own `full` timestamp and ignores strikes.
    """
    stamp = "full" if full else "checked"
    pending: list[dict] = []
    if not full:
        pending = [g for g in games if strike_matured(state.get(g["url"], {}), now)]
    pending_urls = {g["url"] for g in pending}
    rest = sorted(
        (g for g in games if g["url"] not in pending_urls),
        key=lambda g: state.get(g["url"], {}).get(stamp, ""),
    )
    return (pending + rest)[:budget]


# ---------------------------------------------------------------------------
# Per-game decision (pure: no I/O)
# ---------------------------------------------------------------------------
def refresh_updates(game: dict, soup) -> dict:
    """Changed scraper-owned fields for a normal (non-full) refresh."""
    updates: dict = {}
    if not has_info_panel(soup):
        return updates
    info = parse_info_table(soup)
    for field, value in (
        ("status", info.get("Status", NA)),
        ("rating", info.get("Rating", NA)),
        ("rating_count", info.get("RatingCount", NA)),
    ):
        if game.get(field) != value:
            updates[field] = value
    if game.get("release_date", NA) == NA:
        published = info.get("Release date") or info.get("Published")
        if published and published != NA:
            updates["release_date"] = published
    if info.get("Updated") and info["Updated"] != game.get("updated_at"):
        updates["updated_at"] = info["Updated"]
    if game.get("thumbnail", NA) == NA:
        thumb = extract_thumbnail(soup)
        if thumb != NA:
            updates["thumbnail"] = thumb
    return updates


def full_updates(game: dict, soup) -> dict:
    """Every scraper-owned field that differs from a fresh scrape."""
    fresh = parse_game(soup, game["url"])
    fresh.pop("is_free", None)
    return {
        k: v
        for k, v in fresh.items()
        if k != "url" and k not in PRESERVE_FIELDS and game.get(k) != v
    }


def check_game(
    game: dict, page: Page, entry: dict, now: str, full: bool = False
) -> tuple[str, dict, dict | None, dict]:
    """Decide what one fetched page (fetched at `now`) means for `game`.

    Returns (outcome, updates, removal-or-None, new state entry).
    """
    entry = dict(entry)

    def strike(kind: str, reason: str) -> tuple[str, dict, dict | None, dict]:
        if entry.get("strike") == kind and strike_matured(entry, now):
            removal = {
                "url": game["url"],
                "name": game.get("name", NA),
                "reason": reason,
                "deleted_at": now,
            }
            return f"removed_{kind}", {}, removal, {}
        if entry.get("strike") != kind:
            entry["strike"] = kind
            entry["strike_at"] = now
            entry.pop("withheld_at", None)
        entry["checked"] = now
        if full:
            entry["full"] = now  # don't head every following full batch
        return f"strike_{kind}", {}, None, entry

    if page.status is None or (page.status != 200 and page.status not in DEAD_CODES):
        entry["fails"] = entry.get("fails", 0) + 1
        return "error", {}, None, entry

    if page.status in DEAD_CODES:
        return strike("dead", reason_dead(page.status))

    soup = page.soup
    if soup is None or find_title(soup) == NA:
        entry["fails"] = entry.get("fails", 0) + 1
        return "parse_fail", {}, None, entry

    if not is_free_game(soup):
        return strike("paid", REASON_PAID)

    for key in ("strike", "strike_at", "withheld_at", "fails"):
        entry.pop(key, None)
    entry["checked"] = now
    if full:
        entry["full"] = now
        updates = full_updates(game, soup)
    else:
        updates = refresh_updates(game, soup)
    return ("changed" if updates else "ok"), updates, None, entry


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
def fetch_with_backoff(session, url: str, pacer: Pacer, counters: dict) -> Page | None:
    """GET with one retry after a 429/503. None = stop the run (rate limited)."""
    page = Page(status=None)
    for _ in range(2):
        pacer.wait()
        page = fetch_page(session, url)
        if page.status not in (429, 503):
            counters["consecutive_429"] = 0
            return page
        counters["http_429"] += 1
        counters["consecutive_429"] += 1
        if counters["consecutive_429"] >= MAX_CONSECUTIVE_429:
            return None
        pacer.back_off(page.retry_after or 60.0)
    return page


def _write_outputs(stats: dict) -> None:
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as f:
            f.write(f"rate_limited={'true' if stats['rate_limited'] else 'false'}\n")
            f.write(f"mass_change={'true' if stats['mass_change'] else 'false'}\n")
            for key in ("checked", "changed", "removed"):
                f.write(f"{key}={stats[key]}\n")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        rows = [
            ("Mode", stats["mode"]),
            ("Targets", stats["targets"]),
            ("Checked", stats["checked"]),
            ("Fields changed (games)", stats["changed"]),
            ("New strikes", stats["strikes"]),
            ("Removed (dead / paid)", f"{stats['removed_dead']} / {stats['removed_paid']}"),
            ("Removals withheld (mass-change guard)", stats["withheld"]),
            ("Errors / parse failures", f"{stats['errors']} / {stats['parse_fail']}"),
            ("HTTP 429/503", stats["http_429"]),
            ("Stopped", stats["stopped"] or "completed"),
            ("Duration", f"{stats['duration_s'] / 60:.1f} min"),
        ]
        with open(summary, "a", encoding="utf-8") as f:
            f.write("### Catalog refresh\n\n| | |\n|---|---|\n")
            f.writelines(f"| {k} | {v} |\n" for k, v in rows)


def keep_struck(patch: dict, state: dict, removals: list[dict], stats: dict, mark: bool) -> None:
    """Turn `removals` back into state entries that keep their matured strike.

    The games stay first in line for the next run; `mark` records that the
    removal was withheld by the mass-change guard.
    """
    urls = {r["url"] for r in removals}
    for removal in removals:
        entry = {**state.get(removal["url"], {}), "checked": removal["deleted_at"]}
        if mark:
            entry["withheld_at"] = removal["deleted_at"]
        patch["refresh_state"][removal["url"]] = entry
        stats["removed"] -= 1
        stats["removed_" + ("paid" if removal["reason"] == REASON_PAID else "dead")] -= 1
    patch["removals"] = [r for r in patch["removals"] if r["url"] not in urls]


def guard_mass_change(patch: dict, state: dict, stats: dict, allow_removal: bool) -> None:
    """Withhold removals that look like a parser fault (unless allow_removal).

    - more removals or more strikes than mass_limit(checked) in this run: all
      of the run's removals are withheld and the run is flagged;
    - a game already withheld by an earlier run stays withheld, whatever the
      size of this run (a short or single-URL run must not slip it through).
    """
    limit = mass_limit(stats["checked"])
    spike = stats["strikes"] > limit
    if spike:
        stats["mass_change"] = True
        print(
            f"::error::{stats['strikes']} strikes out of {stats['checked']} checked games "
            f"(limit {limit}) — check whether itch.io changed its page markup."
        )
    if allow_removal or not patch["removals"]:
        return
    if spike or stats["removed"] > limit:
        held = list(patch["removals"])
        why = "a strike spike" if spike else f"{stats['removed']} removals (limit {limit})"
    else:
        held = [r for r in patch["removals"] if state.get(r["url"], {}).get("withheld_at")]
        why = "games withheld by an earlier run"
    if not held:
        return
    stats["mass_change"] = True
    stats["withheld"] += len(held)
    print(
        f"::error::Withholding {len(held)} removal(s) because of {why}. "
        "If they are real, dispatch the refresh with allow_mass_removal."
    )
    keep_struck(patch, state, held, stats, mark=True)


def checkpoint_copy(patch: dict, state: dict) -> dict:
    """The patch as a partial run may apply it: progress, strikes, no removals."""
    snap = copy.deepcopy(patch)
    keep_struck(snap, state, list(snap["removals"]), snap["stats"], mark=False)
    snap["stats"]["stopped"] = snap["stats"]["stopped"] or "checkpoint"
    return snap


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n", 1)[0])
    ap.add_argument("--out", required=True, help="patch file to write")
    ap.add_argument("--budget", type=int, default=0, help="games to check (0 = 1/7 of catalog)")
    ap.add_argument("--deadline-min", type=float, default=45.0)
    ap.add_argument("--full", action="store_true", help="re-scrape every scraper-owned field")
    ap.add_argument("--url", action="append", default=[], help="only these game URLs")
    ap.add_argument(
        "--allow-mass-removal",
        action="store_true",
        help="apply removals even when the mass-change guard trips",
    )
    args = ap.parse_args(argv)

    games = load_all_games()
    state: dict = load_json(STATE_FILE, default={})
    run_start, started = now_iso(), time.monotonic()

    if args.url:
        wanted = {canonicalize(u) or u.strip() for u in args.url if u.strip()}
        targets = [g for g in games if g["url"] in wanted]
        missing = wanted - {g["url"] for g in targets}
        if missing:
            print(f"URL(s) not in the catalog: {', '.join(sorted(missing))}")
            return 1
    else:
        budget = args.budget or default_budget(len(games))
        targets = select_targets(games, state, budget, run_start, full=args.full)

    kind = "full" if args.full else "refresh"
    patch = new_patch(kind)
    stats = dict.fromkeys(
        (
            "checked",
            "changed",
            "strikes",
            "removed",
            "removed_dead",
            "removed_paid",
            "errors",
            "parse_fail",
            "http_429",
            "withheld",
            "duration_s",
        ),
        0,
    )
    stats.update(mode=kind, targets=len(targets), rate_limited=False, mass_change=False, stopped="")
    patch["stats"] = stats
    counters = {"http_429": 0, "consecutive_429": 0}

    print(
        f"Refreshing {len(targets)} of {len(games)} games ({kind}); "
        f"deadline {args.deadline_min:g} min."
    )
    session, pacer = create_session(), Pacer()

    for i, game in enumerate(targets, start=1):
        elapsed = time.monotonic() - started
        per_game = elapsed / (i - 1) if i > 1 else 6.0
        if elapsed + 1.5 * per_game > args.deadline_min * 60:
            stats["stopped"] = "deadline"
            print(f"Deadline reached after {i - 1} games — stopping cleanly.")
            break

        url = game["url"]
        page = fetch_with_backoff(session, url, pacer, counters)
        stats["http_429"] = counters["http_429"]
        if page is None:
            stats["rate_limited"], stats["stopped"] = True, "rate_limited"
            print(
                f"::warning::itch.io rate-limited {MAX_CONSECUTIVE_429}x in a row — "
                "saving progress and stopping."
            )
            break
        if page.status in (429, 503):
            # Still throttled after one retry: not the game's fault, leave its state alone.
            print(f"[{i}/{len(targets)}] {'throttled':<13} {url}")
            continue

        outcome, updates, removal, entry = check_game(
            game, page, state.get(url, {}), now_iso(), full=args.full
        )
        stats["checked"] += 1
        if updates:
            patch["updates"][url] = updates
            stats["changed"] += 1
        if removal:
            patch["removals"].append(removal)
            patch["refresh_state"][url] = None
            stats["removed"] += 1
            stats["removed_" + outcome.split("_", 1)[1]] += 1
        else:
            patch["refresh_state"][url] = entry
        if outcome.startswith("strike_"):
            stats["strikes"] += 1
        elif outcome in ("error", "parse_fail"):
            stats["errors" if outcome == "error" else "parse_fail"] += 1

        detail = f" {sorted(updates)}" if updates else ""
        print(f"[{i}/{len(targets)}] {outcome:<13} {url}{detail}")
        if i % CHECKPOINT_EVERY == 0:
            rate = i / max(time.monotonic() - started, 1e-6)
            print(f"  … {i} checked, {rate * 60:.1f}/min, {counters['http_429']}x 429 — checkpoint")
            stats["duration_s"] = round(time.monotonic() - started)
            write_patch(args.out, checkpoint_copy(patch, state))

    guard_mass_change(patch, state, stats, allow_removal=args.allow_mass_removal)
    stats["duration_s"] = round(time.monotonic() - started)
    write_patch(args.out, patch)
    _write_outputs(stats)
    print(
        f"\nDone — {stats['checked']} checked, {stats['changed']} changed, "
        f"{stats['strikes']} new strikes, {stats['removed']} removed, "
        f"{stats['errors'] + stats['parse_fail']} errors, {stats['http_429']}x 429."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
