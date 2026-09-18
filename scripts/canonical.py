"""
canonical.py — One canonical form for itch.io game URLs.

Every ingest channel (extension, admin, Suggest form, RSS, workflow input) and
the pipeline itself compare URLs through canonicalize(), so the same game can
never be queued twice under two spellings. The Worker ports this function; both
implementations are tested against tests/fixtures/url_vectors.json.

Canonical form: https://{creator}.itch.io/{slug}
  - https only, host lower-cased, no port / userinfo / query / fragment
  - exactly one lower-cased path segment, no trailing slash
  - creator must be a *.itch.io subdomain (not itch.io / www.itch.io)
"""

import re
from urllib.parse import urlsplit

CANONICAL_RE = re.compile(r"^https://[a-z0-9][a-z0-9-]*\.itch\.io/[a-z0-9][a-z0-9_-]*$")

_HOST_RE = re.compile(r"^[a-z0-9][a-z0-9-]*\.itch\.io$")
_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9_-]*$")
_RESERVED_HOSTS = {"www.itch.io", "itch.io"}


def canonicalize(raw: str) -> str | None:
    """Return the canonical game URL, or None when `raw` is not a game page URL."""
    if not isinstance(raw, str):
        return None
    text = raw.strip()
    if not text:
        return None
    if "://" not in text:
        text = "https://" + text
    try:
        parts = urlsplit(text)
    except ValueError:
        return None
    if parts.scheme.lower() not in ("http", "https"):
        return None
    if parts.username or parts.password:
        return None
    host = (parts.hostname or "").lower()
    if host in _RESERVED_HOSTS or not _HOST_RE.match(host):
        return None
    segments = [s for s in parts.path.split("/") if s]
    if len(segments) != 1:
        return None
    slug = segments[0].lower()
    if not _SLUG_RE.match(slug):
        return None
    return f"https://{host}/{slug}"


def is_canonical(url: str) -> bool:
    return isinstance(url, str) and bool(CANONICAL_RE.match(url))
