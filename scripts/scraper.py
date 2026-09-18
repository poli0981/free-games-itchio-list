"""
scraper.py — Shared scraping utilities for itch.io game data.

Provides:
  - Session creation (honest User-Agent, retries on 5xx only)
  - fetch_page(): one GET with explicit 429 / Retry-After reporting
  - Pacer: polite delays, batch pauses, back-off after a 429
  - Free/paid detection, info table parsing (all fields → N/A on missing)
  - Description, thumbnail, NSFW extraction
  - parse_game(): full single-game record from a fetched page
"""

import random
import re
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from html import unescape
from typing import Any

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
NA = "N/A"

USER_AGENT = "FreeItchGamesBot/4.0 (+https://freeitchgames.win/about)"

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# (connect, read) timeouts in seconds
TIMEOUT = (5, 15)

# Polite delay range (seconds) between page requests
DELAY_MIN = 2.0
DELAY_MAX = 4.0

# Batch processing: pause longer after N requests
BATCH_SIZE = 20
BATCH_PAUSE_MIN = 15.0
BATCH_PAUSE_MAX = 30.0

# Retry-After values from itch.io are honoured but capped at this many seconds.
RETRY_AFTER_CAP = 300.0


# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------
def create_session() -> requests.Session:
    """requests.Session that retries connection errors and 5xx (not 429).

    429 is surfaced to the caller (see fetch_page) so it can back off
    globally instead of urllib3 sleeping for an uncapped Retry-After.
    Backoff between the automatic retries: 0s, 4s.
    """
    session = requests.Session()
    session.headers.update(HEADERS)

    retry = Retry(
        total=2,
        backoff_factor=2,
        status_forcelist=[500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"],
        respect_retry_after_header=False,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


# ---------------------------------------------------------------------------
# Rate-limiting helpers
# ---------------------------------------------------------------------------
def should_batch_pause(index: int) -> bool:
    """Return True when *index* (1-based) hits a batch boundary."""
    return index > 0 and index % BATCH_SIZE == 0


class Pacer:
    """Paces sequential requests to one host; slows down after a 429.

    wait() goes before every request except the first: a random polite delay,
    or a longer batch pause every BATCH_SIZE requests. back_off() sleeps for a
    Retry-After and doubles the delay for the rest of the run (max 4x).
    `sleep` is injectable so tests never really sleep.
    """

    def __init__(self, sleep=time.sleep, rng: random.Random | None = None):
        self._sleep = sleep
        self._rng = rng or random.Random()
        self.factor = 1.0
        self.requests = 0

    def wait(self) -> None:
        if self.requests > 0:
            if should_batch_pause(self.requests):
                seconds = self._rng.uniform(BATCH_PAUSE_MIN, BATCH_PAUSE_MAX)
                print(f"    ⏸  Batch pause {seconds:.0f}s ...")
            else:
                seconds = self._rng.uniform(DELAY_MIN, DELAY_MAX) * self.factor
            self._sleep(seconds)
        self.requests += 1

    def back_off(self, seconds: float) -> None:
        self.factor = min(self.factor * 2, 4.0)
        print(f"    ⏳ Rate limited — sleeping {seconds:.0f}s, delay x{self.factor:g} from now on")
        self._sleep(seconds)


def parse_retry_after(value: str | None, default: float) -> float:
    """Seconds to wait from a Retry-After header (seconds or HTTP-date), capped."""
    if not value:
        return min(default, RETRY_AFTER_CAP)
    value = value.strip()
    try:
        seconds = float(value)
    except ValueError:
        try:
            when = parsedate_to_datetime(value)
        except TypeError, ValueError:
            return min(default, RETRY_AFTER_CAP)
        if when.tzinfo is None:
            when = when.replace(tzinfo=UTC)
        seconds = (when - datetime.now(UTC)).total_seconds()
    return max(0.0, min(seconds, RETRY_AFTER_CAP))


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------
@dataclass
class Page:
    """Result of one GET. `soup` is set only for HTTP 200."""

    status: int | None  # None = network error
    soup: BeautifulSoup | None = None
    retry_after: float = 0.0
    error: str = ""


def fetch_page(session: requests.Session, url: str) -> Page:
    try:
        r = session.get(url, timeout=TIMEOUT, allow_redirects=True)
    except requests.RequestException as e:
        return Page(status=None, error=type(e).__name__)
    page = Page(status=r.status_code)
    if r.status_code in (429, 503):
        page.retry_after = parse_retry_after(r.headers.get("Retry-After"), default=60.0)
    elif r.status_code == 200:
        # Parse bytes so BeautifulSoup honours the page's declared charset.
        page.soup = BeautifulSoup(r.content, "html.parser")
    r.close()
    return page


# ---------------------------------------------------------------------------
# Free / Paid detection
# ---------------------------------------------------------------------------
def is_free_game(soup: BeautifulSoup) -> bool:
    """
    Determine if a game page represents a **free** game.

    Free indicators:
      - No buy_row at all (browser-only / direct download)
      - Button text is "Download Now" with "Name your own price"
      - No <span class="dollars" itemprop="price">

    Paid indicators:
      - <span class="dollars" itemprop="price"> present
      - Button text contains "Buy"
    """
    buy_row = soup.find("div", class_="buy_row")
    if not buy_row:
        # No purchase section → free (browser game or direct link)
        return True

    # Explicit price tag → paid
    price_tag = buy_row.find("span", class_="dollars", attrs={"itemprop": "price"})
    if price_tag:
        price_text = price_tag.get_text(strip=True)
        # "$0.00" edge case → still free
        if price_text and price_text not in ("$0.00", "$0.00 USD"):
            return False

    # Button text hint
    buy_btn = buy_row.find("a", class_="buy_btn")
    if buy_btn:
        btn_text = buy_btn.get_text(strip=True).lower()
        if "buy" in btn_text:
            return False

    return True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _safe_text(tag, fallback: str = NA) -> str:
    if tag is None:
        return fallback
    text = tag.get_text(strip=True)
    return text if text else fallback


def now_iso() -> str:
    """Current UTC timestamp in ISO-8601."""
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def find_title(soup: BeautifulSoup) -> str:
    title_tag = soup.find("h1", class_="game_title") or soup.find("h1", attrs={"itemprop": "name"})
    return _safe_text(title_tag)


def has_info_panel(soup: BeautifulSoup) -> bool:
    wrapper = soup.find("div", class_="info_panel_wrapper")
    return bool(wrapper and wrapper.find("table"))


# ---------------------------------------------------------------------------
# Info-table parsing
# ---------------------------------------------------------------------------

# Fields where itch.io lists multiple <a> links → store as JSON array
_LIST_FIELDS = {"Tags", "Platforms", "Languages", "Inputs", "Made with"}

# Date rows: prefer abbr@title ("23 April 2021 @ 19:30 UTC") over the relative text
_DATE_FIELDS = {"Release date", "Published", "Updated"}


def parse_info_table(soup: BeautifulSoup) -> dict[str, Any]:
    """Parse the right-side info panel into a dict.

    Multi-value fields (Tags, Platforms, etc.) → list[str]
    Single-value fields (Genre, Status, etc.) → str
    Missing fields are NOT inserted — caller handles defaults.
    """
    info: dict[str, Any] = {}
    wrapper = soup.find("div", class_="info_panel_wrapper")
    if not wrapper:
        return info

    table = wrapper.find("table")
    if not table:
        return info

    for row in table.find_all("tr"):
        tds = row.find_all("td")
        if len(tds) < 2:
            continue

        key = tds[0].get_text(strip=True)
        value_td = tds[1]

        if key in _DATE_FIELDS:
            abbr = value_td.find("abbr")
            if abbr and abbr.get("title"):
                info[key] = abbr["title"]
            else:
                text = value_td.get_text(strip=True)
                info[key] = text if text else NA
            continue

        # --- Rating: extract from itemprop attributes ---
        if key == "Rating":
            rating_div = value_td.find("div", class_="aggregate_rating")
            if rating_div:
                rv = rating_div.find(itemprop="ratingValue")
                rc = rating_div.find(itemprop="ratingCount")
                info["Rating"] = rv.get("content", NA) if rv else NA
                info["RatingCount"] = rc.get("content", NA) if rc else NA
            else:
                info["Rating"] = NA
                info["RatingCount"] = NA
            continue

        # --- Multi-value fields → list of strings ---
        links = value_td.find_all("a")
        if key in _LIST_FIELDS:
            info[key] = [a.get_text(strip=True) for a in links] if links else []
            continue

        # --- Genre: use only the FIRST value (primary genre) ---
        if key == "Genre":
            if links:
                info[key] = links[0].get_text(strip=True)
            else:
                text = value_td.get_text(strip=True)
                info[key] = text if text else NA
            continue

        # --- Generic single-value: prefer link texts joined, fallback plain ---
        if links:
            value = ", ".join(a.get_text(strip=True) for a in links)
        else:
            value = value_td.get_text(strip=True)

        info[key] = value if value else NA

    return info


# ---------------------------------------------------------------------------
# Description
# ---------------------------------------------------------------------------
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"'“(])")


def extract_description(soup: BeautifulSoup) -> str:
    desc_tag = soup.find("div", class_="formatted_description")
    if not desc_tag:
        return NA

    raw = desc_tag.get_text(strip=True, separator=" ")
    full = " ".join(unescape(raw).split())
    if not full:
        return NA

    # First sentence (a terminator followed by whitespace + a capital), capped at 200 chars.
    first = _SENTENCE_END.split(full, maxsplit=1)[0]
    if len(first) <= 200:
        return first
    cut = first[:197].rsplit(" ", 1)[0] if " " in first[:197] else first[:197]
    return cut + "..."


# ---------------------------------------------------------------------------
# Thumbnail
# ---------------------------------------------------------------------------
def extract_thumbnail(soup: BeautifulSoup) -> str:
    meta = soup.find("meta", property="og:image")
    if meta and str(meta.get("content", "")).startswith("http"):
        return meta["content"]

    ss = soup.find("div", class_="screenshot_list")
    if ss:
        img = ss.find("img")
        if img and str(img.get("src", "")).startswith("http"):
            return img["src"]

    return NA


# ---------------------------------------------------------------------------
# NSFW detection
# ---------------------------------------------------------------------------
_NSFW_RE = re.compile(
    r"\b(adult|nsfw|18\+|erotic\w*|hentai|porn\w*|mature|sexual\w*)(?!\w)", re.IGNORECASE
)


def detect_nsfw(soup: BeautifulSoup, tags, description: str) -> str:
    """Detect NSFW. `tags` can be list[str] or str. Matches whole words only."""
    tags_text = " ".join(tags) if isinstance(tags, list) else (tags or "")
    if _NSFW_RE.search(tags_text):
        return "Yes"
    if description != NA and _NSFW_RE.search(description):
        return "Yes"
    if soup.find("div", class_=["view_game_warning", "mature_content_notice"]):
        return "Yes"
    return "No"


# ---------------------------------------------------------------------------
# Full single-game record
# ---------------------------------------------------------------------------
def parse_game(soup: BeautifulSoup, url: str) -> dict:
    """Build the full record for a fetched game page (plus an `is_free` flag).

    Field order matches the stored schema; `updated_at` is appended last and
    only when itch.io shows an "Updated" row.
    """
    info = parse_info_table(soup)

    tags = info.get("Tags", [])
    description = extract_description(soup)
    release_date = info.get("Release date") or info.get("Published") or NA

    record = {
        "url": url,
        "name": find_title(soup),
        "is_free": is_free_game(soup),
        "dev": info.get("Author") or info.get("Authors", NA),
        "description": description,
        "genre": info.get("Genre", NA),
        "status": info.get("Status", NA),
        "publisher": info.get("Publisher", NA),
        "release_date": release_date,
        "rating": info.get("Rating", NA),
        "rating_count": info.get("RatingCount", NA),
        "average_session": info.get("Average session", NA),
        "nsfw": detect_nsfw(soup, tags, description),
        "thumbnail": extract_thumbnail(soup),
        "tags": tags,
        "platforms": info.get("Platforms", []),
        "languages": info.get("Languages", []),
        "inputs": info.get("Inputs", []),
        "made_with": info.get("Made with", []),
        "safe_virus": "?",
        "notes": "",
    }
    if info.get("Updated"):
        record["updated_at"] = info["Updated"]
    return record
