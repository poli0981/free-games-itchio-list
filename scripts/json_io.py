"""
json_io.py — Shared JSON helpers for the scraper pipeline.

Small utilities used by several scripts:
  - dumps / load_json / save_json: one byte-exact serialization for every data
    file (UTF-8, indent=4, ensure_ascii=False, no trailing newline). The Worker's
    TS port must produce identical bytes (see tests/fixtures/golden/).
  - save_json writes atomically (tmp + os.replace) and skips unchanged files,
    so no-op runs produce no commits (and no Cloudflare rebuilds).
  - dedup_deleted: de-duplicate the deleted-games log by URL.
"""

import json
import os
import tempfile


def dumps(data) -> str:
    """Canonical on-disk text for every JSON data file in the repo."""
    return json.dumps(data, ensure_ascii=False, indent=4)


def load_json(path: str, default=None):
    """Load a JSON file, returning `default` (default: []) when it doesn't exist."""
    if default is None:
        default = []
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return default


def write_text_if_changed(path: str, text: str) -> bool:
    """Atomically write `text` to `path` unless the file already holds it.

    Returns True when the file was (re)written.
    """
    data = text.encode("utf-8")
    try:
        with open(path, "rb") as f:
            # Tolerate CRLF checkouts on Windows: git normalizes them anyway.
            if f.read().replace(b"\r\n", b"\n") == data:
                return False
    except FileNotFoundError:
        pass
    directory = os.path.dirname(path) or "."
    os.makedirs(directory, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=directory, prefix=".tmp-", suffix=".json")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise
    return True


def save_json(path: str, data) -> bool:
    """Write `data` as canonical JSON; returns True if the file changed."""
    return write_text_if_changed(path, dumps(data))


def save_state_map(path: str, data: dict[str, dict]) -> bool:
    """Write a {url: {...}} state map with one sorted entry per line.

    Used for pipeline bookkeeping (scripts/state/*.json): thousands of small
    entries change daily, so one line per URL keeps diffs readable.
    """
    if not data:
        return write_text_if_changed(path, "{}\n")
    lines = [
        f"  {json.dumps(url, ensure_ascii=False)}: "
        f"{json.dumps(data[url], ensure_ascii=False, separators=(', ', ': '), sort_keys=True)}"
        for url in sorted(data)
    ]
    return write_text_if_changed(path, "{\n" + ",\n".join(lines) + "\n}\n")


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
