"""
validate.py — Structural checks for every data file the site and apps read.

Run in CI on pull requests and by apply_patch.py before every pipeline commit
(a failing check means nothing is pushed). Exits 1 on errors; warnings only
print.

Checks:
  - chunk files game_info_001..N are contiguous, ≤ CHUNK_SIZE, lists of records
  - every record has the 20 schema fields with the right types, a canonical
    URL, valid enums; URLs are unique across chunks
  - index.json agrees with the chunk files
  - count_history.json: one {date, total} row per day, sorted
  - deleted_games.json entries are complete; temp_link.json is a list of strings

`--fix` applies safe normalizations (safe_virus / nsfw spelling) and saves.
"""

import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from canonical import is_canonical
from data_store import CHUNK_SIZE, DATA_DIR, _list_chunk_files, load_all_games, save_all_games
from json_io import load_json

STRING_FIELDS = (
    "url",
    "name",
    "dev",
    "description",
    "genre",
    "status",
    "publisher",
    "release_date",
    "rating",
    "rating_count",
    "average_session",
    "nsfw",
    "thumbnail",
    "safe_virus",
    "notes",
)
LIST_FIELDS = ("tags", "platforms", "languages", "inputs", "made_with")
OPTIONAL_STRING_FIELDS = ("added_at", "updated_at")

SAFE_VIRUS = {"?", "Yes", "No", "Caution"}
NSFW = {"Yes", "No"}
_SAFE_VIRUS_ALIASES = {"y": "Yes", "yes": "Yes", "n": "No", "no": "No", "caution": "Caution"}
_NSFW_ALIASES = {"y": "Yes", "yes": "Yes", "n": "No", "no": "No"}
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

DELETED_LOG = "scripts/deleted_games.json"
TEMP_LINK = "scripts/temp_link.json"


def check_record(game, where: str) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    if not isinstance(game, dict):
        return [f"{where}: record is not an object"], warnings
    for field in STRING_FIELDS:
        if field not in game:
            errors.append(f"{where}: missing field '{field}'")
        elif not isinstance(game[field], str):
            errors.append(f"{where}: '{field}' must be a string")
    for field in LIST_FIELDS:
        value = game.get(field)
        if field not in game:
            errors.append(f"{where}: missing field '{field}'")
        elif not isinstance(value, list) or not all(isinstance(v, str) for v in value):
            errors.append(f"{where}: '{field}' must be a list of strings")
    for field in OPTIONAL_STRING_FIELDS:
        if field in game and not isinstance(game[field], str):
            errors.append(f"{where}: '{field}' must be a string")
    url = game.get("url")
    if isinstance(url, str) and not is_canonical(url):
        errors.append(f"{where}: non-canonical url {url!r}")
    if game.get("safe_virus") not in SAFE_VIRUS and "safe_virus" in game:
        errors.append(f"{where}: safe_virus {game.get('safe_virus')!r} not in {sorted(SAFE_VIRUS)}")
    if game.get("nsfw") not in NSFW and "nsfw" in game:
        errors.append(f"{where}: nsfw {game.get('nsfw')!r} not in {sorted(NSFW)}")
    known = set(STRING_FIELDS) | set(LIST_FIELDS) | set(OPTIONAL_STRING_FIELDS)
    extra = sorted(set(game) - known)
    if extra:
        warnings.append(f"{where}: unknown field(s) {extra}")
    return errors, warnings


def validate() -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    files = _list_chunk_files()
    names = [os.path.basename(p) for p in files]
    expected = [f"game_info_{i:03d}.json" for i in range(1, len(files) + 1)]
    if names != expected:
        errors.append(f"chunk files are not contiguous: {names}")

    seen: dict[str, str] = {}
    counts: list[dict] = []
    for path in files:
        name = os.path.basename(path)
        try:
            chunk = load_json(path)
        except ValueError as e:
            errors.append(f"{name}: invalid JSON ({e})")
            continue
        if not isinstance(chunk, list):
            errors.append(f"{name}: top level must be a list")
            continue
        if len(chunk) > CHUNK_SIZE:
            errors.append(f"{name}: {len(chunk)} records > {CHUNK_SIZE}")
        counts.append({"name": name, "count": len(chunk)})
        for i, game in enumerate(chunk):
            where = f"{name}[{i}]"
            e, w = check_record(game, where)
            errors += e
            warnings += w
            url = game.get("url") if isinstance(game, dict) else None
            if url in seen:
                errors.append(f"{where}: duplicate url {url} (also {seen[url]})")
            elif url:
                seen[url] = where

    index = load_json(os.path.join(DATA_DIR, "index.json"), default={})
    if index.get("files") != counts:
        errors.append("index.json 'files' does not match the chunk files")
    if index.get("total_games") != sum(c["count"] for c in counts):
        errors.append("index.json 'total_games' does not match the chunk files")

    history = load_json(os.path.join(DATA_DIR, "count_history.json"))
    dates = [row.get("date") for row in history if isinstance(row, dict)]
    if len(dates) != len(history) or any(
        not isinstance(d, str) or not _DATE_RE.match(d) for d in dates
    ):
        errors.append("count_history.json: every row needs a YYYY-MM-DD 'date'")
    elif dates != sorted(set(dates)):
        errors.append("count_history.json: dates must be unique and ascending")
    if any(not isinstance(row.get("total"), int) for row in history if isinstance(row, dict)):
        errors.append("count_history.json: every row needs an integer 'total'")

    for i, entry in enumerate(load_json(DELETED_LOG)):
        missing = [k for k in ("url", "name", "reason", "deleted_at") if k not in entry]
        if missing:
            errors.append(f"deleted_games.json[{i}]: missing {missing}")

    queue = load_json(TEMP_LINK)
    if not isinstance(queue, list) or not all(isinstance(u, str) for u in queue):
        errors.append("temp_link.json must be a JSON array of URL strings")

    return errors, warnings


def fix() -> int:
    """Normalize enum spellings in place; returns the number of records fixed."""
    games = load_all_games()
    fixed = 0
    for game in games:
        before = (game.get("safe_virus"), game.get("nsfw"))
        sv = str(game.get("safe_virus", "?")).strip()
        game["safe_virus"] = sv if sv in SAFE_VIRUS else _SAFE_VIRUS_ALIASES.get(sv.lower(), "?")
        ns = str(game.get("nsfw", "No")).strip()
        game["nsfw"] = ns if ns in NSFW else _NSFW_ALIASES.get(ns.lower(), "No")
        if (game["safe_virus"], game["nsfw"]) != before:
            fixed += 1
    if fixed:
        save_all_games(games)
    return fixed


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Validate catalog data files.")
    ap.add_argument("--fix", action="store_true", help="normalize enum spellings first")
    args = ap.parse_args(argv)
    if args.fix:
        print(f"Normalized {fix()} record(s).")
    errors, warnings = validate()
    for w in warnings:
        print(f"::warning::{w}")
    for e in errors:
        print(f"::error::{e}")
    total = len(load_all_games())
    print(f"validate: {total} games, {len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
