"""
scraper.py — Shared scraping utilities for itch.io game data.

Provides:
  - Session creation with retry + backoff
  - Polite rate-limiting helpers
  - Free/paid game detection
  - Info table parsing (all fields → N/A on missing)
  - Description, thumbnail, NSFW extraction
  - Full single-game scrape function
"""

import random
import time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup
from html import unescape
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
NA = "N/A"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Polite delay range (seconds) between full page scrapes
DELAY_MIN = 2.5
DELAY_MAX = 5.0

# Lighter delay for HEAD / status-only checks
DELAY_LIGHT_MIN = 1.0
DELAY_LIGHT_MAX = 2.5

# Batch processing: pause longer after N requests
BATCH_SIZE = 20
BATCH_PAUSE_MIN = 15.0
BATCH_PAUSE_MAX = 30.0


# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------
def create_session() -> requests.Session:
    """Create a requests.Session with automatic retry on transient errors."""
    session = requests.Session()
    session.headers.update(HEADERS)

    retry = Retry(
        total=3,
        backoff_factor=2,  # 2s → 4s → 8s
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


# ---------------------------------------------------------------------------
# Rate-limiting helpers
# ---------------------------------------------------------------------------
def polite_delay() -> None:
    """Sleep a random interval between full-page requests."""
    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))


def light_delay() -> None:
    """Sleep a shorter interval for lightweight checks (HEAD, status)."""
    time.sleep(random.uniform(DELAY_LIGHT_MIN, DELAY_LIGHT_MAX))


def batch_pause() -> None:
    """Longer pause between batches to avoid triggering rate limits."""
    duration = random.uniform(BATCH_PAUSE_MIN, BATCH_PAUSE_MAX)
    print(f"    ⏸  Batch pause {duration:.0f}s ...")
    time.sleep(duration)


def should_batch_pause(index: int) -> bool:
    """Return True when *index* (1-based) hits a batch boundary."""
    return index > 0 and index % BATCH_SIZE == 0


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
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Info-table parsing
# ---------------------------------------------------------------------------
def parse_info_table(soup: BeautifulSoup) -> dict[str, str]:
    """Parse the right-side info panel into a flat dict."""
    info: dict[str, str] = {}
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

        # --- Release date: prefer abbr@title for full datetime ---
        if key == "Release date":
            abbr = value_td.find("abbr")
            if abbr and abbr.get("title"):
                info[key] = abbr["title"]
            else:
                info[key] = value_td.get_text(strip=True) or NA
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

        # --- Generic: prefer link texts, fallback to plain text ---
        links = value_td.find_all("a")
        if links:
            value = ", ".join(a.get_text(strip=True) for a in links)
        else:
            value = value_td.get_text(strip=True)

        info[key] = value if value else NA

    return info


# ---------------------------------------------------------------------------
# Description
# ---------------------------------------------------------------------------
def extract_description(soup: BeautifulSoup) -> str:
    desc_tag = soup.find("div", class_="formatted_description")
    if not desc_tag:
        return NA

    raw = desc_tag.get_text(strip=True, separator=" ")
    full = " ".join(unescape(raw).split())
    if not full:
        return NA

    if "." in full:
        first = full.split(".", 1)[0] + "."
        return first if len(first) <= 200 else first[:197] + "..."
    return full[:200] + ("..." if len(full) > 200 else "")


# ---------------------------------------------------------------------------
# Thumbnail
# ---------------------------------------------------------------------------
def extract_thumbnail(soup: BeautifulSoup) -> str:
    meta = soup.find("meta", property="og:image")
    if meta and meta.get("content"):
        return meta["content"]

    ss = soup.find("div", class_="screenshot_list")
    if ss:
        img = ss.find("img")
        if img and img.get("src"):
            return img["src"]

    return NA


# ---------------------------------------------------------------------------
# NSFW detection
# ---------------------------------------------------------------------------
_NSFW_KEYWORDS = ["adult", "nsfw", "erotic", "hentai", "porn", "mature", "sexual",
                  "18+", "furry"]


def detect_nsfw(soup: BeautifulSoup, tags: str, description: str) -> str:
    if any(kw in tags.lower() for kw in _NSFW_KEYWORDS):
        return "Yes"
    if description != NA and any(kw in description.lower() for kw in _NSFW_KEYWORDS):
        return "Yes"
    if soup.find("div", class_=["view_game_warning", "mature_content_notice"]):
        return "Yes"
    return "No"


# ---------------------------------------------------------------------------
# Full single-game scrape
# ---------------------------------------------------------------------------
def scrape_game_info(session: requests.Session, url: str) -> dict | None:
    """
    Scrape a single itch.io game page.

    Returns None on network/parse error.
    Returns dict with is_free=False if the game is paid (caller decides
    whether to keep or skip).
    """
    try:
        r = session.get(url, timeout=20)
        r.raise_for_status()
        r.encoding = "utf-8"
        soup = BeautifulSoup(r.text, "html.parser")

        # --- Free check (early) ---
        free = is_free_game(soup)

        # --- Title ---
        title_tag = (
            soup.find("h1", class_="game_title")
            or soup.find("h1", attrs={"itemprop": "name"})
        )
        name = _safe_text(title_tag)

        # --- Info table ---
        info = parse_info_table(soup)

        dev          = info.get("Author") or info.get("Authors", NA)
        genre        = info.get("Genre", NA)
        tags         = info.get("Tags", NA)
        status       = info.get("Status", NA)
        platforms    = info.get("Platforms", NA)
        publisher    = info.get("Publisher", NA)
        release_date = info.get("Release date", NA)
        made_with    = info.get("Made with", NA)
        rating       = info.get("Rating", NA)
        rating_count = info.get("RatingCount", NA)
        avg_session  = info.get("Average session", NA)
        languages    = info.get("Languages", NA)
        inputs       = info.get("Inputs", NA)

        description = extract_description(soup)
        thumbnail   = extract_thumbnail(soup)
        nsfw        = detect_nsfw(soup, tags, description)

        return {
            "url": url,
            "name": name,
            "is_free": free,
            "dev": dev,
            "description": description,
            "genre": genre,
            "tags": tags,
            "status": status,
            "platforms": platforms,
            "publisher": publisher,
            "release_date": release_date,
            "made_with": made_with,
            "rating": rating,
            "rating_count": rating_count,
            "average_session": avg_session,
            "languages": languages,
            "inputs": inputs,
            "nsfw": nsfw,
            "safe_virus": "?",
            "notes": "",
            "thumbnail": thumbnail,
        }

    except requests.RequestException as e:
        print(f"  [NET ERROR] {url}: {e}")
    except Exception as e:
        print(f"  [PARSE ERROR] {url}: {e}")

    return None


# ---------------------------------------------------------------------------
# Lightweight page-alive check
# ---------------------------------------------------------------------------
def check_url_alive(session: requests.Session, url: str) -> int | None:
    """
    Return HTTP status code, or None on connection failure.
    Uses GET with stream=True so we don't download the full body
    (itch.io may not honour HEAD for game pages).
    """
    try:
        r = session.get(url, timeout=15, stream=True, allow_redirects=True)
        r.close()  # release connection immediately
        return r.status_code
    except requests.RequestException:
        return None


# ---------------------------------------------------------------------------
# Lightweight free-only check (re-fetch page, return is_free bool)
# ---------------------------------------------------------------------------
def check_still_free(session: requests.Session, url: str) -> bool | None:
    """
    Re-fetch a game page and return True/False for free status,
    or None on network error (caller should treat as 'keep').
    """
    try:
        r = session.get(url, timeout=20)
        r.raise_for_status()
        r.encoding = "utf-8"
        soup = BeautifulSoup(r.text, "html.parser")
        return is_free_game(soup)
    except requests.RequestException as e:
        print(f"  [NET ERROR] {url}: {e}")
        return None