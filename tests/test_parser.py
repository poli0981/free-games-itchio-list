import random
from datetime import UTC
from email.utils import format_datetime

import pytest
from conftest import load_fixture_soup
from scraper import (
    NA,
    RETRY_AFTER_CAP,
    Pacer,
    detect_nsfw,
    extract_description,
    extract_tagline,
    is_password_protected,
    parse_game,
    parse_retry_after,
)


def test_free_game_full_record():
    record = parse_game(
        load_fixture_soup("game_free_full.html"), "https://stef-pinto.itch.io/cookies"
    )
    assert record["is_free"] is True
    assert record["name"] == "Cookies"
    assert record["dev"].startswith("Stef Pinto, Jonut")  # non-ASCII author survives
    assert record["genre"] == "Puzzle"
    assert record["status"] == "Released"
    assert record["release_date"] == "23 April 2021 @ 19:30 UTC"
    assert (record["rating"], record["rating_count"]) == ("4.6", "182")
    assert record["platforms"] == ["Windows"]
    assert "Unity" in record["made_with"]
    assert record["thumbnail"].startswith("https://img.itch.zone/")
    assert record["safe_virus"] == "?" and record["notes"] == ""
    assert "updated_at" not in record
    # No AI or accessibility rows: the creator has not said.
    assert record["ai_disclosure"] == NA
    assert record["ai_content"] == [] and record["accessibility"] == []
    # Schema order: the 20 stored fields (+ is_free flag) in a fixed order.
    assert list(record)[:4] == ["url", "name", "is_free", "dev"]


def test_ai_assisted_game_with_accessibility():
    record = parse_game(load_fixture_soup("game_ai_assisted.html"), "https://x.itch.io/y")
    assert record["is_free"] is True
    assert record["ai_disclosure"] == "AI Assisted"
    assert record["ai_content"] == ["Graphics", "Text"]
    assert record["accessibility"] == ["Subtitles", "Configurable controls"]
    assert record["release_date"] == "01 October 2026 @ 11:11 UTC"  # "Published"
    # The creator's tagline (og:description), whitespace collapsed, wins over the first sentence.
    assert record["description"] == "Keep the lighthouse burning through one long night."


def test_no_ai_game_from_reformatted_markup():
    record = parse_game(load_fixture_soup("game_no_ai.html"), "https://x.itch.io/y")
    assert record["ai_disclosure"] == "No AI"
    assert record["ai_content"] == [] and record["accessibility"] == []
    # Line breaks inside titles and links collapse to single spaces.
    assert record["name"] == "Quiet Orchard [Demo]"
    assert record["genre"] == "Visual Novel"
    assert record["made_with"] == ["Ren'Py", "Adobe Photoshop"]
    assert record["tags"] == ["Meaningful Choices", "Cozy"]
    assert record["status"] == "In development"
    assert record["updated_at"] == "03 October 2026 @ 11:28 UTC"
    # No tagline: the first sentence of the description.
    assert record["description"] == "A gentle story about growing back."


def test_tagline_is_capped_on_a_word():
    from bs4 import BeautifulSoup

    long = "tagline " * 40
    soup = BeautifulSoup(f'<meta property="og:description" content="{long}">', "html.parser")
    tagline = extract_tagline(soup)
    assert len(tagline) <= 200 and tagline.endswith("...")
    blank = BeautifulSoup('<meta property="og:description" content=" ">', "html.parser")
    assert extract_tagline(blank) == NA


def test_nsfw_checks_the_first_sentence_behind_a_tagline():
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(
        '<meta property="og:description" content="A love story.">'
        '<div class="formatted_description"><p>An erotic visual novel. Enjoy.</p></div>',
        "html.parser",
    )
    record = parse_game(soup, "https://x.itch.io/y")
    assert record["description"] == "A love story."
    assert record["nsfw"] == "Yes"


def test_description_first_sentence_keeps_version_numbers():
    record = parse_game(load_fixture_soup("game_free_full.html"), "https://x.itch.io/y")
    assert record["description"].startswith("Bake cookies with Jonut")
    assert record["description"].endswith("in a cozy puzzle.")


def test_paid_game_detected():
    record = parse_game(load_fixture_soup("game_paid.html"), "https://x.itch.io/y")
    assert record["is_free"] is False


def test_sparse_page_uses_screenshot_and_updated_row():
    record = parse_game(load_fixture_soup("game_sparse.html"), "https://x.itch.io/y")
    assert record["dev"] == "Capybaraforce"  # singular "Author" row
    assert record["thumbnail"].endswith("/Shot.png")
    assert record["description"] == NA
    assert record["updated_at"] == "26 December 2025 @ 11:05 UTC"
    assert record["release_date"] == NA


def test_page_without_info_panel():
    record = parse_game(load_fixture_soup("game_no_info.html"), "https://x.itch.io/y")
    assert record["name"] == "Mystery Page"
    assert record["genre"] == NA and record["tags"] == []


def test_password_page_is_recognised():
    assert is_password_protected(load_fixture_soup("game_password.html"))
    assert not is_password_protected(load_fixture_soup("game_free_full.html"))
    assert not is_password_protected(load_fixture_soup("game_no_info.html"))


def test_mature_notice_marks_nsfw():
    record = parse_game(load_fixture_soup("game_nsfw_warning.html"), "https://x.itch.io/y")
    assert record["nsfw"] == "Yes"


@pytest.mark.parametrize(
    ("tags", "description", "expected"),
    [
        (["Adult"], NA, "Yes"),
        (["Visual Novel", "NSFW"], NA, "Yes"),
        (["Horror"], "A game for mature audiences.", "Yes"),
        (["Horror"], "Contains sexual themes.", "Yes"),
        (["Adulthood"], NA, "No"),  # whole words only (was a substring match)
        (["Horror"], "Premature ending", "No"),
        ([], NA, "No"),
    ],
)
def test_detect_nsfw_whole_words(tags, description, expected):
    soup = load_fixture_soup("game_no_info.html")
    assert detect_nsfw(soup, tags, description) == expected


def test_description_long_text_is_capped_on_a_word():
    from bs4 import BeautifulSoup

    text = "word " * 80
    soup = BeautifulSoup(f'<div class="formatted_description">{text}</div>', "html.parser")
    desc = extract_description(soup)
    assert len(desc) <= 200 and desc.endswith("...")
    assert not desc[:-3].endswith(" ")


def test_parse_retry_after_variants():
    assert parse_retry_after("30", default=60) == 30
    assert parse_retry_after(None, default=60) == 60
    assert parse_retry_after("999999", default=60) == RETRY_AFTER_CAP
    assert parse_retry_after("not a date", default=5) == 5
    from datetime import datetime, timedelta

    future = datetime.now(UTC) + timedelta(seconds=90)
    assert 60 <= parse_retry_after(format_datetime(future, usegmt=True), default=1) <= 90


def test_pacer_never_sleeps_before_first_request_and_backs_off():
    sleeps: list[float] = []
    pacer = Pacer(sleep=sleeps.append, rng=random.Random(1))
    pacer.wait()
    assert sleeps == []
    pacer.wait()
    assert 2.0 <= sleeps[-1] <= 4.0
    pacer.back_off(30)
    assert sleeps[-1] == 30 and pacer.factor == 2.0
    pacer.wait()
    assert 4.0 <= sleeps[-1] <= 8.0
