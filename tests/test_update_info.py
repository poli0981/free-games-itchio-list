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
    flaky = patch["ingest_state"]["https://dev.itch.io/flaky"]
    assert flaky["attempts"] == 1 and flaky["last_error"] == "error: HTTP 500"
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
    assert (
        patch["ingest_state"][url]["attempts"] == 1 and "gave_up" not in patch["ingest_state"][url]
    )


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


def _apply(patch):
    import apply_patch
    from patch import write_patch

    write_patch("applied.json", patch)
    assert apply_patch.main(["applied.json"]) == 0
    return read_json("scripts/temp_link.json")


def test_duplicate_spelling_does_not_drop_a_link_that_must_be_retried(repo, monkeypatch):
    seed_catalog([make_game("known")])
    queue = ["https://dev.itch.io/flaky", "https://dev.itch.io/flaky/"]
    patch = _run(monkeypatch, {"https://dev.itch.io/flaky": Page(status=502)}, queue)
    assert patch["queue_remove"] == []
    assert _apply(patch) == queue


def test_duplicate_spelling_survives_a_rate_limit_stop(repo, monkeypatch):
    seed_catalog([make_game("known")])
    queue = ["https://dev.itch.io/a", "https://dev.itch.io/a"]
    save_json("scripts/temp_link.json", queue)
    monkeypatch.setattr(update_info, "fetch_with_backoff", lambda *_a: None)
    assert update_info.main(["--out", "patch.json"]) == 0
    assert _apply(read_json("patch.json")) == queue


def test_duplicate_spellings_all_go_once_the_first_copy_finishes(repo, monkeypatch):
    seed_catalog([make_game("known")])
    queue = ["https://dev.itch.io/gone", "https://DEV.itch.io/gone/"]
    patch = _run(monkeypatch, {"https://dev.itch.io/gone": Page(status=404)}, queue)
    assert _apply(patch) == []


def test_dispatched_url_is_processed_first_and_queued_until_done(repo, monkeypatch):
    seed_catalog([make_game("known")])
    seen = []

    def fetch(_s, url, _p, _c):
        seen.append(url)
        return Page(status=500)

    save_json("scripts/temp_link.json", ["https://dev.itch.io/backlog"])
    monkeypatch.setenv("INPUT_URL", "https://dev.itch.io/Dispatched/")
    monkeypatch.setattr(update_info, "fetch_with_backoff", fetch)
    assert update_info.main(["--out", "patch.json"]) == 0
    patch = read_json("patch.json")
    assert seen[0] == "https://dev.itch.io/dispatched"
    assert patch["queue_add"] == ["https://dev.itch.io/dispatched"]
    # Transient failure: the dispatched URL now waits in the queue for the next run.
    assert _apply(patch) == ["https://dev.itch.io/backlog", "https://dev.itch.io/dispatched"]


def test_dispatched_url_that_finishes_leaves_no_trace_in_the_queue(repo, monkeypatch):
    seed_catalog([make_game("known")])
    pages = {
        "https://dev.itch.io/free": Page(status=200, soup=load_fixture_soup("game_free_full.html"))
    }
    patch = _run(monkeypatch, pages, [], INPUT_URL="https://dev.itch.io/free")
    assert _apply(patch) == []


def test_non_string_queue_entries_are_cleaned_not_fatal(repo, monkeypatch):
    seed_catalog([make_game("known")])
    queue = [{"url": "https://dev.itch.io/wrapped"}, None, 5, "https://dev.itch.io/keep"]
    patch = _run(monkeypatch, {}, queue)
    assert patch["stats"]["invalid"] == 3
    # The {"url": ...} entry is recovered as a plain URL; the rest are dropped.
    assert _apply(patch) == ["https://dev.itch.io/wrapped", "https://dev.itch.io/keep"]


def test_failures_count_only_when_spaced_out(repo, monkeypatch):
    """Back-to-back runs (a burst of queue pushes) can't use up the attempts."""
    import apply_patch
    from patch import write_patch

    seed_catalog([make_game("known")])
    url = "https://dev.itch.io/flaky"
    save_json("scripts/temp_link.json", [url])
    monkeypatch.setattr(update_info, "fetch_with_backoff", lambda *_a: Page(status=502))
    attempts = []
    for stamp in (
        "2026-09-18T01:00:00Z",
        "2026-09-18T01:05:00Z",  # 5 min later: not counted
        "2026-09-18T02:00:00Z",  # still inside the gap
        "2026-09-18T07:30:00Z",  # 6.5 h after the first: 2
        "2026-09-18T14:00:00Z",  # 3 -> given up
    ):
        monkeypatch.setattr(update_info, "now_iso", lambda s=stamp: s)
        assert update_info.main(["--out", "patch.json"]) == 0
        write_patch("patch.json", read_json("patch.json"))
        assert apply_patch.main(["patch.json"]) == 0
        entry = read_json("scripts/state/ingest_state.json").get(url, {})
        attempts.append((entry.get("attempts"), "gave_up" in entry))
    assert attempts == [(1, False), (1, False), (1, False), (2, False), (3, True)]
    assert read_json("scripts/temp_link.json") == []


def test_throttled_page_is_not_an_attempt(repo, monkeypatch):
    seed_catalog([make_game("known")])
    url = "https://dev.itch.io/dispatched"
    for _ in range(4):
        patch = _run(monkeypatch, {url: Page(status=429)}, [], INPUT_URL=url)
        assert url not in patch["ingest_state"] and url not in patch["queue_remove"]
        assert patch["queue_add"] == [url]
