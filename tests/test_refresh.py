import pytest
import refresh
from conftest import load_fixture_soup, make_game
from scraper import Page

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
            "strike_at": "2026-09-17T00:00:00Z",
        },
        # c never checked
        games[3]["url"]: {"checked": "2026-09-01T00:00:00Z"},
    }
    picked = [g["url"][-1] for g in refresh.select_targets(games, state, 3, NOW)]
    assert picked == ["b", "c", "d"]


def test_recent_strike_is_not_prioritized():
    games = [make_game(s) for s in ("a", "b")]
    # Struck 4 hours ago (late the previous UTC day): not due yet.
    state = {
        games[1]["url"]: {
            "checked": "2026-09-17T23:00:00Z",
            "strike": "dead",
            "strike_at": "2026-09-17T23:00:00Z",
        }
    }
    assert [g["url"][-1] for g in refresh.select_targets(games, state, 1, NOW)] == ["a"]


def test_dead_page_needs_a_second_look_a_day_later():
    game = make_game("a")
    outcome, _, removal, entry = refresh.check_game(game, Page(status=404), {}, NOW)
    assert outcome == "strike_dead" and removal is None
    assert entry["strike"] == "dead" and entry["strike_at"] == NOW

    # A few hours later: still only a strike, and the first sighting is kept.
    outcome, _, removal, entry = refresh.check_game(
        game, Page(status=404), entry, "2026-09-18T09:00:00Z"
    )
    assert outcome == "strike_dead" and removal is None and entry["strike_at"] == NOW

    outcome, _, removal, _ = refresh.check_game(game, Page(status=410), entry, TOMORROW_NOW)
    assert outcome == "removed_dead"
    assert removal["reason"] == "Game page no longer exists (HTTP 410)"
    assert removal["url"] == game["url"] and removal["deleted_at"] == TOMORROW_NOW


def test_strikes_just_either_side_of_midnight_do_not_remove():
    game = make_game("a")
    entry = {"strike": "dead", "strike_at": "2026-09-17T23:56:00Z"}
    outcome, _, removal, _ = refresh.check_game(
        game, Page(status=404), entry, "2026-09-18T00:05:00Z"
    )
    assert outcome == "strike_dead" and removal is None


def test_paid_page_strike_then_removal():
    game = make_game("a")
    outcome, _, _, entry = refresh.check_game(game, ok_page("game_paid.html"), {}, NOW)
    assert outcome == "strike_paid"
    outcome, _, removal, _ = refresh.check_game(
        game, ok_page("game_paid.html"), entry, TOMORROW_NOW
    )
    assert outcome == "removed_paid" and removal["reason"] == "Game became paid"


def test_different_strike_kind_restarts_the_count():
    game = make_game("a")
    entry = {"strike": "paid", "strike_at": "2026-09-10T03:00:00Z"}
    outcome, _, removal, entry = refresh.check_game(game, Page(status=404), entry, NOW)
    assert outcome == "strike_dead" and removal is None and entry["strike_at"] == NOW


def test_full_mode_strike_advances_the_full_rotation():
    game = make_game("a")
    _, _, _, entry = refresh.check_game(game, Page(status=404), {}, NOW, full=True)
    assert entry["full"] == NOW


def test_healthy_page_clears_strike_and_updates_fields():
    game = make_game("a", rating="3.0", rating_count="5", status="In development")
    entry = {"strike": "dead", "strike_at": "2026-09-10T03:00:00Z", "fails": 2}
    outcome, updates, removal, new_entry = refresh.check_game(game, ok_page(), entry, NOW)
    assert outcome == "changed" and removal is None
    assert updates["rating"] == "4.6" and updates["rating_count"] == "182"
    assert updates["status"] == "Released"
    assert updates["release_date"] == "23 April 2021 @ 19:30 UTC"  # backfilled from N/A
    assert new_entry == {"checked": NOW}


def test_refresh_never_touches_editable_or_identity_fields():
    game = make_game("a", nsfw="Yes", safe_virus="Caution", notes="keep me")
    _, updates, _, _ = refresh.check_game(game, ok_page(), {}, NOW)
    assert not {"nsfw", "safe_virus", "notes", "url", "name"} & set(updates)


def test_full_mode_rescrapes_but_preserves_annotations():
    game = make_game("a", name="Old", nsfw="Yes", safe_virus="Yes", notes="n")
    outcome, updates, _, entry = refresh.check_game(game, ok_page(), {}, NOW, full=True)
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
        outcome, updates, removal, _ = refresh.check_game(game, page, {}, NOW)
        assert outcome == expected and removal is None and not updates

    from bs4 import BeautifulSoup

    no_title = Page(status=200, soup=BeautifulSoup("<html></html>", "html.parser"))
    outcome, _, _, entry = refresh.check_game(game, no_title, {"fails": 1}, NOW)
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


def _struck_catalog(n: int) -> tuple[list[dict], dict]:
    games = [make_game(f"g{i:03d}") for i in range(n)]
    state = {
        g["url"]: {
            "checked": "2026-09-17T00:00:00Z",
            "strike": "paid",
            "strike_at": "2026-09-17T00:00:00Z",
        }
        for g in games
    }
    return games, state


def _run_guarded(repo, monkeypatch, games, state, pages, *extra):
    from conftest import read_json, seed_catalog
    from json_io import save_state_map

    seed_catalog(games)
    save_state_map("scripts/state/refresh_state.json", state)
    monkeypatch.setattr(refresh, "fetch_page", lambda _s, url: pages(url))
    monkeypatch.setattr(refresh.Pacer, "wait", lambda self: None)
    outputs = repo / "gh_output"
    monkeypatch.setenv("GITHUB_OUTPUT", str(outputs))
    assert refresh.main(["--out", "patch.json", "--budget", str(len(games)), *extra]) == 0
    return read_json("patch.json"), outputs.read_text(encoding="utf-8")


def test_mass_removal_is_withheld_and_flagged(repo, monkeypatch):
    games, state = _struck_catalog(30)
    paid = ok_page("game_paid.html")
    patch, outputs = _run_guarded(repo, monkeypatch, games, state, lambda _u: paid)
    assert patch["removals"] == [] and patch["stats"]["withheld"] == 30
    assert patch["stats"]["removed"] == 0 and "mass_change=true" in outputs
    entry = patch["refresh_state"][games[0]["url"]]
    # The strike survives, so the game stays first in line.
    assert entry["strike"] == "paid" and entry["strike_at"] == "2026-09-17T00:00:00Z"
    assert entry["checked"] > "2026-09-17T00:00:00Z"


def test_mass_removal_can_be_confirmed(repo, monkeypatch):
    games, state = _struck_catalog(30)
    paid = ok_page("game_paid.html")
    patch, _ = _run_guarded(
        repo, monkeypatch, games, state, lambda _u: paid, "--allow-mass-removal"
    )
    assert len(patch["removals"]) == 30


def test_a_few_removals_pass_the_guard(repo, monkeypatch):
    games, state = _struck_catalog(30)
    for g in games[3:]:
        state[g["url"]] = {"checked": "2026-09-17T00:00:00Z"}
    healthy, paid = ok_page(), ok_page("game_paid.html")
    struck = {g["url"] for g in games[:3]}
    patch, outputs = _run_guarded(
        repo, monkeypatch, games, state, lambda u: paid if u in struck else healthy
    )
    assert len(patch["removals"]) == 3 and "mass_change=false" in outputs


def test_strike_spike_is_flagged_but_kept(repo, monkeypatch):
    games = [make_game(f"g{i:03d}") for i in range(30)]
    paid = ok_page("game_paid.html")
    patch, outputs = _run_guarded(repo, monkeypatch, games, {}, lambda _u: paid)
    assert "mass_change=true" in outputs and patch["removals"] == []
    assert all(e["strike"] == "paid" for e in patch["refresh_state"].values())


def test_strike_spike_withholds_that_runs_removals_too(repo, monkeypatch):
    games = [make_game(f"g{i:03d}") for i in range(60)]
    state = {
        g["url"]: {
            "checked": "2026-09-17T00:00:00Z",
            "strike": "paid",
            "strike_at": "2026-09-17T00:00:00Z",
        }
        for g in games[:3]
    }
    paid = ok_page("game_paid.html")
    patch, outputs = _run_guarded(repo, monkeypatch, games, state, lambda _u: paid)
    assert patch["stats"]["strikes"] == 57 and patch["removals"] == []
    assert patch["stats"]["withheld"] == 3 and "mass_change=true" in outputs
    assert patch["refresh_state"][games[0]["url"]]["withheld_at"]


def test_withheld_games_stay_withheld_in_small_runs(repo, monkeypatch):
    games = [make_game(f"g{i:03d}") for i in range(30)]
    state = {
        games[0]["url"]: {
            "checked": "2026-09-18T00:00:00Z",
            "strike": "paid",
            "strike_at": "2026-09-16T00:00:00Z",
            "withheld_at": "2026-09-17T00:00:00Z",
        }
    }
    paid = ok_page("game_paid.html")
    patch, outputs = _run_guarded(
        repo, monkeypatch, games, state, lambda _u: paid, "--url", games[0]["url"]
    )
    assert patch["removals"] == [] and "mass_change=true" in outputs

    patch, _ = _run_guarded(
        repo,
        monkeypatch,
        games,
        state,
        lambda _u: paid,
        "--url",
        games[0]["url"],
        "--allow-mass-removal",
    )
    assert [r["url"] for r in patch["removals"]] == [games[0]["url"]]


def test_healthy_check_clears_a_withheld_marker():
    entry = {
        "strike": "paid",
        "strike_at": "2026-09-16T00:00:00Z",
        "withheld_at": "2026-09-17T00:00:00Z",
    }
    _, _, _, new_entry = refresh.check_game(make_game("a"), ok_page(), entry, NOW)
    assert "withheld_at" not in new_entry and "strike" not in new_entry


def test_checkpoints_never_carry_removals(repo, monkeypatch):
    from conftest import read_json

    games, state = _struck_catalog(60)
    paid = ok_page("game_paid.html")
    calls = {"n": 0}

    def pages(_url):
        calls["n"] += 1
        if calls["n"] > 55:
            raise RuntimeError("runner lost")
        return paid

    with pytest.raises(RuntimeError):
        _run_guarded(repo, monkeypatch, games, state, pages)
    checkpoint = read_json("patch.json")
    assert checkpoint["removals"] == [] and checkpoint["stats"]["stopped"] == "checkpoint"
    kept = checkpoint["refresh_state"][games[0]["url"]]
    assert kept["strike"] == "paid" and "withheld_at" not in kept


def test_strikes_of_a_spike_run_are_not_removed_by_a_later_short_run(repo, monkeypatch):
    from conftest import read_json
    from json_io import save_state_map

    games = [make_game(f"g{i:03d}") for i in range(40)]
    paid = ok_page("game_paid.html")
    day1, outputs = _run_guarded(repo, monkeypatch, games, {}, lambda _u: paid)
    assert "mass_change=true" in outputs
    assert all(e["withheld_at"] for e in day1["refresh_state"].values())

    # A day later: a single-URL check (or any short run) must not remove it.
    state = day1["refresh_state"]
    for entry in state.values():
        entry["strike_at"] = entry["checked"] = "2026-09-16T00:00:00Z"
    save_state_map("scripts/state/refresh_state.json", state)
    monkeypatch.setattr(refresh, "fetch_page", lambda _s, _u: paid)
    assert refresh.main(["--out", "patch.json", "--url", games[0]["url"]]) == 0
    assert read_json("patch.json")["removals"] == []


def test_withheld_games_take_at_most_half_the_budget():
    games = [make_game(f"g{i:03d}") for i in range(20)]
    old = {"checked": "2026-09-01T00:00:00Z", "strike": "paid", "strike_at": "2026-09-01T00:00:00Z"}
    state = {g["url"]: {**old, "withheld_at": "2026-09-02T00:00:00Z"} for g in games[:10]}
    state[games[10]["url"]] = dict(old)  # a normal matured strike
    picked = [g["url"][-3:] for g in refresh.select_targets(games, state, 6, NOW)]
    assert picked[0] == "010" and sum(u < "010" for u in picked) == 3
    confirm = refresh.select_targets(games, state, 6, NOW, allow_mass_removal=True)
    assert [g["url"][-3:] for g in confirm][:5] == ["000", "001", "002", "003", "004"]


def test_withheld_full_batch_moves_the_full_stamp(repo, monkeypatch):
    games, state = _struck_catalog(30)
    paid = ok_page("game_paid.html")
    patch, _ = _run_guarded(repo, monkeypatch, games, state, lambda _u: paid, "--full")
    entry = patch["refresh_state"][games[0]["url"]]
    assert entry["withheld_at"] and entry["full"] == entry["checked"]


def test_checkpoint_of_a_spiking_run_marks_its_strikes(repo, monkeypatch):
    from conftest import read_json

    games = [make_game(f"g{i:03d}") for i in range(60)]
    paid = ok_page("game_paid.html")
    calls = {"n": 0}

    def pages(_url):
        calls["n"] += 1
        if calls["n"] > 55:
            raise RuntimeError("runner lost")
        return paid

    with pytest.raises(RuntimeError):
        _run_guarded(repo, monkeypatch, games, {}, pages)
    checkpoint = read_json("patch.json")
    assert all(e["withheld_at"] for e in checkpoint["refresh_state"].values())
