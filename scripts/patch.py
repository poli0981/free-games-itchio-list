"""
patch.py — The hand-off format between pipeline scans and the commit step.

Scanners (refresh.py, update_info.py) never write the catalog directly. They
emit a patch; apply_patch.py applies it idempotently to whatever `main` looks
like at push time, so concurrent writers (other workflows, the admin Worker,
the browser extension) never overwrite each other.

Patch v1:
{
  "version": 1,
  "kind": "refresh" | "full" | "ingest",
  "generated_at": "<iso>",
  "additions":     [<full game record>, ...],          # appended if URL absent
  "updates":       {"<url>": {"<field>": <value>}},    # scraper-owned fields only
  "removals":      [{"url", "name", "reason", "deleted_at"}],
  "refresh_state": {"<url>": {...} | null},            # null = drop entry
  "ingest_state":  {"<url>": {...} | null},
  "queue_add":     ["<url>", ...],                     # append to temp_link.json if absent
  "queue_remove":  ["<url>", ...],                     # drop from temp_link.json
  "stats":         {...}                               # informational
}
"""

from json_io import dumps, load_json, write_text_if_changed
from scraper import now_iso

PATCH_VERSION = 1


def new_patch(kind: str) -> dict:
    return {
        "version": PATCH_VERSION,
        "kind": kind,
        "generated_at": now_iso(),
        "additions": [],
        "updates": {},
        "removals": [],
        "refresh_state": {},
        "ingest_state": {},
        "queue_add": [],
        "queue_remove": [],
        "stats": {},
    }


def write_patch(path: str, patch: dict) -> None:
    """Atomic write, so a job killed mid-checkpoint still leaves a valid patch."""
    write_text_if_changed(path, dumps(patch))


def load_patch(path: str) -> dict:
    patch = load_json(path, default={})
    if patch.get("version") != PATCH_VERSION:
        raise ValueError(f"{path}: unsupported patch version {patch.get('version')!r}")
    return patch


def is_empty(patch: dict) -> bool:
    return not any(
        patch.get(k)
        for k in (
            "additions",
            "updates",
            "removals",
            "refresh_state",
            "ingest_state",
            "queue_add",
            "queue_remove",
        )
    )
