import refresh
from conftest import load_fixture_soup, make_game
from scraper import Page

TODAY = "2026-09-18"
NOW = "2026-09-18T03:00:00Z"
TOMORROW_NOW = "2026-09-19T03:00:00Z"


def ok_page(fixture="game_free_full.html"):
    return Page(status=200, soup=load_fixture_soup(fixture))


def test_default_budget_is_a_weekly_cycle():
    assert refresh.default_budget(2681) == 383
    assert refresh.default_budget(2682) == 384
    assert refresh.default_budget(0) == 1


def test_select_targets_pending_strikes_first_then_oldest():
    games = [make_game(s) for s in ("a", "b", "c", "d")]
    state = {
        games[0]["url"]: {"checked": "2026-09-10T00:00:00Z"},
        games[1]["url"]: {
            "checked": "2026-09-17T00:00:00Z",
            "strike": "dead",
            "strike_day": "2026-09-17",
        },
        # c never checked
        games[3]["url"]: {"checked": "2026-09-01T00:00:00Z"},
    }
    picked = [g["url"][-1] for g in refresh.select_targets(games, state, 3, TODAY)]
    assert picked == ["b", "c", "d"]


def test_strike_from_today_is_not_prioritized():
    games = [make_game(s) for s in ("a", "b")]
    state = {games[1]["url"]: {"checked": NOW, "strike": "dead", "strike_day": TODAY}}
    assert [g["url"][-1] for g in refresh.select_targets(games, state, 1, TODAY)] == ["a"]


def test_dead_page_needs_two_days():
    game = make_game("a")
    outcome, _, removal, entry = refresh.check_game(game, Page(status=404), {}, TODAY, NOW)
    assert outcome == "strike_dead" and removal is None
    assert entry["strike"] == "dead" and entry["strike_day"] == TODAY

    # Same day again: still only a strike.
    outcome, _, removal, _ = refresh.check_game(game, Page(status=404), entry, TODAY, NOW)
    assert outcome == "strike_dead" and removal is None

    outcome, _, removal, _ = refresh.check_game(
        game, Page(status=410), entry, "2026-09-19", TOMORROW_NOW
    )
    assert outcome == "removed_dead"
    assert removal["reason"] == "Game page no longer exists (HTTP 410)"
    assert removal["url"] == game["url"] and removal["deleted_at"] == TOMORROW_NOW


def test_paid_page_strike_then_removal():
    game = make_game("a")
    outcome, _, _, entry = refresh.check_game(game, ok_page("game_paid.html"), {}, TODAY, NOW)
    assert outcome == "strike_paid"
    outcome, _, removal, _ = refresh.check_game(
        game, ok_page("game_paid.html"), entry, "2026-09-19", TOMORROW_NOW
    )
    assert outcome == "removed_paid" and removal["reason"] == "Game became paid"


def test_different_strike_kind_restarts_the_count():
    game = make_game("a")
    entry = {"strike": "paid", "strike_day": "2026-09-10"}
    outcome, _, removal, entry = refresh.check_game(game, Page(status=404), entry, TODAY, NOW)
    assert outcome == "strike_dead" and removal is None and entry["strike_day"] == TODAY


def test_healthy_page_clears_strike_and_updates_fields():
    game = make_game("a", rating="3.0", rating_count="5", status="In development")
    entry = {"strike": "dead", "strike_day": "2026-09-10", "fails": 2}
    outcome, updates, removal, new_entry = refresh.check_game(game, ok_page(), entry, TODAY, NOW)
    assert outcome == "changed" and removal is None
    assert updates["rating"] == "4.6" and updates["rating_count"] == "182"
    assert updates["status"] == "Released"
    assert updates["release_date"] == "23 April 2021 @ 19:30 UTC"  # backfilled from N/A
    assert new_entry == {"checked": NOW}


def test_refresh_never_touches_editable_or_identity_fields():
    game = make_game("a", nsfw="Yes", safe_virus="Caution", notes="keep me")
    _, updates, _, _ = refresh.check_game(game, ok_page(), {}, TODAY, NOW)
    assert not {"nsfw", "safe_virus", "notes", "url", "name"} & set(updates)


def test_full_mode_rescrapes_but_preserves_annotations():
    game = make_game("a", name="Old", nsfw="Yes", safe_virus="Yes", notes="n")
    outcome, updates, _, entry = refresh.check_game(game, ok_page(), {}, TODAY, NOW, full=True)
    assert outcome == "changed" and updates["name"] == "Cookies"
    assert not {"nsfw", "safe_virus", "notes", "url", "is_free"} & set(updates)
    assert entry["full"] == NOW


def test_errors_and_parse_failures_keep_the_game():
    game = make_game("a")
    for page, expected in (
        (Page(status=None, error="ConnectTimeout"), "error"),
        (Page(status=403), "error"),
        (Page(status=500), "error"),
        (ok_page("game_no_info.html"), "ok"),
    ):
        outcome, updates, removal, _ = refresh.check_game(game, page, {}, TODAY, NOW)
        assert outcome == expected and removal is None and not updates

    from bs4 import BeautifulSoup

    no_title = Page(status=200, soup=BeautifulSoup("<html></html>", "html.parser"))
    outcome, _, _, entry = refresh.check_game(game, no_title, {"fails": 1}, TODAY, NOW)
    assert outcome == "parse_fail" and entry["fails"] == 2


def test_fetch_with_backoff_stops_after_repeated_429(monkeypatch):
    pages = iter([Page(status=429, retry_after=1)] * 5)
    monkeypatch.setattr(refresh, "fetch_page", lambda _s, _u: next(pages))
    counters = {"http_429": 0, "consecutive_429": 0}

    class NoSleepPacer:
        def wait(self):
            pass

        def back_off(self, _seconds):
            pass

    pacer = NoSleepPacer()
    assert refresh.fetch_with_backoff(None, "u", pacer, counters).status == 429  # 2 tries
    assert refresh.fetch_with_backoff(None, "u", pacer, counters) is None  # 3rd in a row → stop
    assert counters["http_429"] == 3


def test_main_writes_patch_and_stops_on_rate_limit(repo, monkeypatch, capsys):
    from conftest import read_json, seed_catalog

    seed_catalog([make_game(s) for s in ("a", "b", "c")])
    sequence = iter([Page(status=404), Page(status=429), Page(status=429), Page(status=429)])
    monkeypatch.setattr(refresh, "fetch_page", lambda _s, _u: next(sequence))
    monkeypatch.setattr(refresh.Pacer, "wait", lambda self: None)
    monkeypatch.setattr(refresh.Pacer, "back_off", lambda self, s: None)
    outputs = repo / "gh_output"
    monkeypatch.setenv("GITHUB_OUTPUT", str(outputs))

    assert refresh.main(["--out", "patch.json", "--budget", "3"]) == 0
    patch = read_json("patch.json")
    assert patch["kind"] == "refresh"
    assert patch["refresh_state"]["https://dev.itch.io/a"]["strike"] == "dead"
    assert patch["stats"]["rate_limited"] is True and patch["stats"]["checked"] == 1
    assert "rate_limited=true" in outputs.read_text(encoding="utf-8")


def test_main_unknown_url_fails(repo):
    from conftest import seed_catalog

    seed_catalog([make_game("a")])
    assert refresh.main(["--out", "p.json", "--full", "--url", "https://dev.itch.io/zzz"]) == 1
