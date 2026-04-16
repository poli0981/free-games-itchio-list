"""
data_store.py — Multi-file game data storage.

Splits game entries across numbered JSON files in data_game/:
  data_game/game_info_001.json  (up to 500 entries)
  data_game/game_info_002.json  (next 500)
  ...

All other scripts import load_all_games / save_all_games
instead of reading game_info.json directly.
"""

import glob
import json
import math
import os

DATA_DIR = "data_game"
FILE_PREFIX = "game_info_"
FILE_SUFFIX = ".json"
CHUNK_SIZE = 500


def _chunk_path(index: int) -> str:
    """Return the file path for a 1-based chunk index."""
    return os.path.join(DATA_DIR, f"{FILE_PREFIX}{index:03d}{FILE_SUFFIX}")


def _list_chunk_files() -> list[str]:
    """Return sorted list of existing chunk file paths."""
    pattern = os.path.join(DATA_DIR, f"{FILE_PREFIX}*{FILE_SUFFIX}")
    return sorted(glob.glob(pattern))


def load_all_games() -> list[dict]:
    """Load every chunk file and return a single flat list."""
    games: list[dict] = []
    for path in _list_chunk_files():
        with open(path, "r", encoding="utf-8") as f:
            games.extend(json.load(f))
    return games


def save_all_games(games: list[dict]) -> None:
    """Split games into chunks of CHUNK_SIZE and write to data_game/.

    Automatically creates the directory and cleans up stale chunk files.
    """
    os.makedirs(DATA_DIR, exist_ok=True)

    old_files = set(_list_chunk_files())

    if not games:
        # Remove all chunk files
        for path in old_files:
            os.remove(path)
        return

    num_chunks = math.ceil(len(games) / CHUNK_SIZE)
    new_files: set[str] = set()

    for i in range(num_chunks):
        chunk = games[i * CHUNK_SIZE : (i + 1) * CHUNK_SIZE]
        path = _chunk_path(i + 1)
        new_files.add(path)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(chunk, f, ensure_ascii=False, indent=4)

    # Remove orphan files from previous runs
    for stale in old_files - new_files:
        os.remove(stale)


def get_all_urls(games: list[dict]) -> set[str]:
    """Return a set of all game URLs (for duplicate checking)."""
    return {g["url"] for g in games}
