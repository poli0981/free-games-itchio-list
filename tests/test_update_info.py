import update_info
from canonical import canonicalize
from conftest import load_fixture_soup, make_game, read_json, seed_catalog
from json_io import save_json
from scraper import Page


def _run(monkeypatch, pages: dict[str, Page], queue: list, **env):
    save_json("scripts/temp_link.json", queue)
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    monkeypatch.setattr(
        update_info, "fetch_with_backoff", lambda _s, url, _p, _c: pages.get(url, Page(status=500))
    )
    assert update_info.main(["--out", "patch.json"]) == 0
    return read_json("patch.json")


def test_ingest_outcomes(repo, monkeypatch):
    seed_catalog([make_game("known")])
    save_json(
        "scripts/deleted_games.json",
        [
            {
                "url": "https://dev.itch.io/removed",
                "name": "R",
                "reason": "Game became paid",
                "deleted_at": "2026-01-01T00:00:00Z",
            }
        ],
    )
    pages = {
        "https://dev.itch.io/free": Page(status=200, soup=load_fixture_soup("game_free_full.html")),
        "https://dev.itch.io/paid": Page(status=200, soup=load_fixture_soup("game_paid.html")),
        "https://dev.itch.io/dead": Page(status=404),
    }
    queue = [
        "https://DEV.itch.io/free/",  # canonicalized
        "https://dev.itch.io/free",  # duplicate within the queue
        "https://dev.itch.io/paid",
        "https://dev.itch.io/dead",
        "https://dev.itch.io/known",
        "https://dev.itch.io/removed",
        "https://dev.itch.io/flaky",  # 500 → retry later
        "not a url",
    ]
    patch = _run(monkeypatch, pages, queue)

    assert [a["url"] for a in patch["additions"]] == ["https://dev.itch.io/free"]
    added = patch["additions"][0]
    assert "is_free" not in added and added["added_at"].endswith("Z")
    assert "https://dev.itch.io/flaky" not in patch["queue_remove"]
    assert patch["ingest_state"]["https://dev.itch.io/flaky"] == {
        "attempts": 1,
        "last_error": "error: HTTP 500",
    }
    stats = patch["stats"]
    assert (stats["added"], stats["paid"], stats["dead"], stats["duplicate"]) == (1, 1, 1, 1)
    assert (stats["deleted"], stats["invalid"], stats["retry"]) == (1, 1, 1)
    # apply_patch compares canonical forms, so each processed link is covered once.
    removed = {canonicalize(u) or u for u in patch["queue_remove"]}
    assert removed == {
        "https://dev.itch.io/free",
        "https://dev.itch.io/paid",
        "https://dev.itch.io/dead",
        "https://dev.itch.io/known",
        "https://dev.itch.io/removed",
        "not a url",
    }


def test_gives_up_after_three_attempts_and_resets_on_requeue(repo, monkeypatch):
    seed_catalog([make_game("known")])
    url = "https://dev.itch.io/flaky"
    save_json("scripts/state/ingest_state.json", {url: {"attempts": 2, "last_error": "x"}})
    patch = _run(monkeypatch, {}, [url])
    assert url in patch["queue_remove"]
    assert patch["ingest_state"][url]["attempts"] == 3 and "gave_up" in patch["ingest_state"][url]

    save_json("scripts/state/ingest_state.json", {url: patch["ingest_state"][url]})
    patch = _run(monkeypatch, {}, [url])
    assert patch["ingest_state"][url] == {"attempts": 1, "last_error": "error: HTTP 500"}


def test_workflow_input_url_is_added(repo, monkeypatch):
    seed_catalog([make_game("known")])
    pages = {
        "https://dev.itch.io/free": Page(status=200, soup=load_fixture_soup("game_free_full.html"))
    }
    patch = _run(monkeypatch, pages, [], INPUT_URL="https://dev.itch.io/free")
    assert [a["url"] for a in patch["additions"]] == ["https://dev.itch.io/free"]


def test_empty_queue_writes_empty_patch(repo, monkeypatch):
    seed_catalog([make_game("known")])
    patch = _run(monkeypatch, {}, [])
    assert patch["additions"] == [] and patch["queue_remove"] == []
