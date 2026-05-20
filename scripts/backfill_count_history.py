"""
backfill_count_history.py — One-time seed for data_game/count_history.json.

Walks the git history of the game catalogue and reconstructs the total
game count per day, so the "games over time" chart has data from day one.

Two eras are covered:
  - scripts/game_info.json   — the pre-refactor flat array (its length).
  - data_game/index.json     — the current multi-file layout (total_games,
                               or the sum of files[].count for the oldest shape).

For each calendar day the latest commit wins. This is a developer tool:
run it once locally before tagging a release, then commit the result.
Any unreadable commit is skipped with a warning — it never aborts.

Usage (from the repo root):
    python scripts/backfill_count_history.py
"""

import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from json_io import save_json

OUTPUT_FILE = os.path.join("data_game", "count_history.json")

# (path, kind) pairs, oldest era first.
SOURCES = [
    ("scripts/game_info.json", "array"),
    ("data_game/index.json", "index"),
]


def run_git(args: list[str]) -> str:
    """Run a git command from the repo root and return stdout."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    return result.stdout


def git_log_commits(path: str):
    """Yield (sha, iso_datetime) for every commit that touched `path`."""
    try:
        out = run_git(["log", "--format=%H%x09%cI", "--", path])
    except subprocess.CalledProcessError as exc:
        print(f"  ! git log failed for {path}: {exc}")
        return
    for line in out.splitlines():
        line = line.strip()
        if "\t" not in line:
            continue
        sha, iso = line.split("\t", 1)
        yield sha, iso


def extract_total(data, kind: str) -> int:
    """Compute the game count from a parsed JSON blob of the given kind."""
    if kind == "array":
        if not isinstance(data, list):
            raise ValueError("expected a JSON array")
        return len(data)
    # kind == "index"
    if "total_games" in data:
        return int(data["total_games"])
    files = data.get("files")
    if files:
        return sum(int(f["count"]) for f in files)
    raise ValueError("index has no total_games and no files")


def commit_total(sha: str, path: str, kind: str) -> int | None:
    """Return the game count at `sha` for `path`, or None if unreadable."""
    try:
        blob = run_git(["show", f"{sha}:{path}"])
        return extract_total(json.loads(blob), kind)
    except (
        subprocess.CalledProcessError,
        json.JSONDecodeError,
        KeyError,
        TypeError,
        ValueError,
    ) as exc:
        print(f"  ! skip {sha[:9]} {path}: {exc}")
        return None


def main() -> None:
    records: list[tuple[str, str, int]] = []  # (iso, date, total)
    for path, kind in SOURCES:
        commits = list(git_log_commits(path))
        print(f"{path}: {len(commits)} commit(s)")
        for sha, iso in commits:
            total = commit_total(sha, path, kind)
            if total is not None:
                records.append((iso, iso[:10], total))

    if not records:
        print("No history found — nothing written.")
        return

    # Latest commit of each calendar day wins.
    records.sort(key=lambda r: r[0])
    by_date: dict[str, int] = {}
    for _iso, date, total in records:
        by_date[date] = total

    history = [{"date": d, "total": by_date[d]} for d in sorted(by_date)]
    save_json(OUTPUT_FILE, history)
    print(
        f"Wrote {len(history)} day(s) -> {OUTPUT_FILE} "
        f"({history[0]['date']}: {history[0]['total']} ... "
        f"{history[-1]['date']}: {history[-1]['total']})"
    )


if __name__ == "__main__":
    main()
