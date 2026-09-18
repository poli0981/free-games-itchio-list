"""
data_store.py — Multi-file game data storage.

Splits game entries across numbered JSON files in data_game/:
  data_game/game_info_001.json  (up to 500 entries)
  data_game/game_info_002.json  (next 500)
  ...

All other scripts import load_all_games / save_all_games
instead of reading the chunk files directly.

Write policy (keeps diffs small and avoids no-op commits / rebuilds):
  - A game stays in the chunk it already lives in. Removals are in place,
    updates are in place, new games are appended to the last chunk.
  - Chunks are re-sliced only when one overflows CHUNK_SIZE or a chunk that
    is not the last one drops below MIN_FILL. Chunk names stay contiguous.
  - Files are written only when their bytes change (json_io.save_json).
  - index.json `last_updated` changes only when some chunk changed, and
    count_history.json gets a row only when the total changes.

The Worker (webapp/worker/catalog.ts) ports this exact policy; both are
checked against tests/fixtures/golden/.
"""

import glob
import os
from datetime import UTC, datetime

from json_io import load_json, save_json

DATA_DIR = "data_game"
FILE_PREFIX = "game_info_"
FILE_SUFFIX = ".json"
CHUNK_SIZE = 500
MIN_FILL = 250


def _index_file() -> str:
    return os.path.join(DATA_DIR, "index.json")


def _count_history_file() -> str:
    return os.path.join(DATA_DIR, "count_history.json")


def _chunk_path(index: int) -> str:
    """Return the file path for a 1-based chunk index."""
    return os.path.join(DATA_DIR, f"{FILE_PREFIX}{index:03d}{FILE_SUFFIX}")


def _list_chunk_files() -> list[str]:
    """Return sorted list of existing chunk file paths."""
    pattern = os.path.join(DATA_DIR, f"{FILE_PREFIX}*{FILE_SUFFIX}")
    return sorted(glob.glob(pattern))


def _utc_now() -> datetime:
    return datetime.now(UTC)


def load_chunks() -> list[list[dict]]:
    """Load every chunk file, preserving chunk boundaries."""
    return [load_json(path) for path in _list_chunk_files()]


def load_all_games() -> list[dict]:
    """Load every chunk file and return a single flat list."""
    return [game for chunk in load_chunks() for game in chunk]


def plan_chunks(old_chunks: list[list[dict]], games: list[dict]) -> list[list[dict]]:
    """Place `games` into chunks, keeping each game in its current chunk.

    Pure function (no I/O) so the placement policy can be unit-tested and
    mirrored exactly by the Worker.
    """
    by_url: dict[str, dict] = {}
    for game in games:
        by_url.setdefault(game["url"], game)

    placed: set[str] = set()
    chunks: list[list[dict]] = []
    for old in old_chunks:
        chunk = []
        for game in old:
            url = game.get("url")
            if url in by_url and url not in placed:
                chunk.append(by_url[url])
                placed.add(url)
        chunks.append(chunk)

    new_games = [g for url, g in by_url.items() if url not in placed]
    if new_games:
        if not chunks:
            chunks.append([])
        chunks[-1].extend(new_games)

    chunks = [c for c in chunks if c]
    needs_reslice = any(len(c) > CHUNK_SIZE for c in chunks) or any(
        len(c) < MIN_FILL for c in chunks[:-1]
    )
    if needs_reslice:
        flat = [g for c in chunks for g in c]
        chunks = [flat[i : i + CHUNK_SIZE] for i in range(0, len(flat), CHUNK_SIZE)]
    return chunks


def save_all_games(games: list[dict]) -> bool:
    """Persist `games` to data_game/ with minimal file churn.

    Returns True when any data file changed.
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    old_files = _list_chunk_files()
    chunks = plan_chunks([load_json(p) for p in old_files], games)

    changed = False
    new_files: list[str] = []
    for i, chunk in enumerate(chunks, start=1):
        path = _chunk_path(i)
        new_files.append(path)
        changed |= save_json(path, chunk)
    for stale in set(old_files) - set(new_files):
        os.remove(stale)
        changed = True

    changed |= _write_index([(p, len(c)) for p, c in zip(new_files, chunks, strict=True)], changed)
    return changed


def _write_index(chunks: list[tuple[str, int]], data_changed: bool) -> bool:
    """Write data_game/index.json; `last_updated` moves only when data changed."""
    total = sum(count for _, count in chunks)
    previous = load_json(_index_file(), default={})
    files = [{"name": os.path.basename(path), "count": count} for path, count in chunks]
    layout_changed = previous.get("files") != files or previous.get("total_games") != total
    last_updated = previous.get("last_updated")
    if data_changed or layout_changed or not last_updated:
        last_updated = _utc_now().strftime("%Y-%m-%dT%H:%M:%SZ")
    index = {
        "total_games": total,
        "max_per_file": CHUNK_SIZE,
        "last_updated": last_updated,
        "files": files,
    }
    changed = save_json(_index_file(), index)
    changed |= _append_count_history(total)
    return changed


def _append_count_history(total: int) -> bool:
    """Record today's total in data_game/count_history.json when it changed.

    Date-keyed upsert: each UTC day holds one row, last write wins. A day whose
    total equals the latest recorded total adds no row (keeps the series and
    the git history free of no-op points). A corrupt file raises (like a
    corrupt index or chunk) instead of being replaced by a one-row history;
    restore it from git history.
    """
    today = _utc_now().strftime("%Y-%m-%d")
    history: list[dict] = load_json(_count_history_file())
    if not isinstance(history, list):
        raise ValueError(f"{_count_history_file()} must be a JSON array")
    history.sort(key=lambda r: r.get("date", ""))
    for row in history:
        if row.get("date") == today:
            row["total"] = total
            break
    else:
        if history and history[-1].get("total") == total:
            return False
        history.append({"date": today, "total": total})
    return save_json(_count_history_file(), history)


def get_all_urls(games: list[dict]) -> set[str]:
    """Return a set of all game URLs (for duplicate checking)."""
    return {g["url"] for g in games}
