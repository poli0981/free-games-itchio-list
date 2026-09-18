import apply_patch
from conftest import make_game, read_json, seed_catalog
from json_io import save_json
from patch import new_patch, write_patch


def _state_file(name):
    return f"scripts/state/{name}.json"


def test_apply_all_sections_and_idempotency(repo):
    seed_catalog([make_game("a"), make_game("b", safe_virus="Yes", notes="mine"), make_game("c")])
    save_json("scripts/temp_link.json", ["https://dev.itch.io/new", "https://DEV.itch.io/keep/"])

    patch = new_patch("refresh")
    patch["additions"].append(make_game("new", added_at="2026-09-18T00:00:00Z"))
    patch["updates"]["https://dev.itch.io/b"] = {"rating": "5.0", "safe_virus": "No", "notes": "x"}
    patch["updates"]["https://dev.itch.io/gone"] = {"rating": "1.0"}
    patch["removals"].append(
        {
            "url": "https://dev.itch.io/c",
            "name": "C",
            "reason": "Game became paid",
            "deleted_at": "2026-09-18T00:00:00Z",
        }
    )
    patch["refresh_state"] = {
        "https://dev.itch.io/a": {"checked": "2026-09-18T00:00:00Z"},
        "https://dev.itch.io/c": None,
    }
    patch["queue_remove"] = ["https://dev.itch.io/new"]
    write_patch("patch.json", patch)

    assert apply_patch.main(["patch.json"]) == 0
    games = {g["url"]: g for chunk in [read_json("data_game/game_info_001.json")] for g in chunk}
    assert set(games) == {
        "https://dev.itch.io/a",
        "https://dev.itch.io/b",
        "https://dev.itch.io/new",
    }
    b = games["https://dev.itch.io/b"]
    assert b["rating"] == "5.0" and b["safe_virus"] == "Yes" and b["notes"] == "mine"
    assert [e["url"] for e in read_json("scripts/deleted_games.json")] == ["https://dev.itch.io/c"]
    assert read_json(_state_file("refresh_state")) == {
        "https://dev.itch.io/a": {"checked": "2026-09-18T00:00:00Z"}
    }
    # Canonical comparison: the differently-spelled URL that was not processed survives.
    assert read_json("scripts/temp_link.json") == ["https://DEV.itch.io/keep/"]

    snapshot = {
        p: (repo / p).read_bytes()
        for p in (
            "data_game/game_info_001.json",
            "data_game/index.json",
            "scripts/deleted_games.json",
            "scripts/temp_link.json",
            _state_file("refresh_state"),
        )
    }
    assert apply_patch.main(["patch.json"]) == 0
    for path, content in snapshot.items():
        assert (repo / path).read_bytes() == content, path


def test_queue_items_added_meanwhile_survive(repo):
    seed_catalog([make_game("a")])
    patch = new_patch("ingest")
    patch["queue_remove"] = ["https://dev.itch.io/done"]
    write_patch("patch.json", patch)
    # Another writer queued a link after the scan started.
    save_json("scripts/temp_link.json", ["https://dev.itch.io/done", "https://dev.itch.io/fresh"])
    assert apply_patch.main(["patch.json"]) == 0
    assert read_json("scripts/temp_link.json") == ["https://dev.itch.io/fresh"]


def test_invalid_result_is_refused(repo):
    seed_catalog([make_game("a")])
    patch = new_patch("ingest")
    patch["additions"].append(make_game("bad", url="http://Not.Canonical/x"))
    write_patch("patch.json", patch)
    assert apply_patch.main(["patch.json"]) == 1


def test_empty_patch_is_a_noop(repo, capsys):
    seed_catalog([make_game("a")])
    write_patch("patch.json", new_patch("refresh"))
    assert apply_patch.main(["patch.json"]) == 0
    assert "empty" in capsys.readouterr().out


def _removal(slug, at="2026-09-18T03:00:00Z"):
    return {
        "url": f"https://dev.itch.io/{slug}",
        "name": slug,
        "reason": "Game became paid",
        "deleted_at": at,
    }


def test_any_apply_cleans_bad_queue_entries(repo):
    seed_catalog([make_game("a")])
    save_json(
        "scripts/temp_link.json", [{"url": "https://dev.itch.io/x"}, None, "https://dev.itch.io/y"]
    )
    patch = new_patch("refresh")
    patch["refresh_state"] = {"https://dev.itch.io/a": {"checked": "2026-09-18T00:00:00Z"}}
    write_patch("patch.json", patch)
    assert apply_patch.main(["patch.json"]) == 0
    assert read_json("scripts/temp_link.json") == ["https://dev.itch.io/x", "https://dev.itch.io/y"]


def test_queue_add_is_deduplicated_by_canonical_form(repo):
    seed_catalog([make_game("a")])
    save_json("scripts/temp_link.json", ["https://DEV.itch.io/b/"])
    patch = new_patch("ingest")
    patch["queue_add"] = ["https://dev.itch.io/b", "https://dev.itch.io/c"]
    write_patch("patch.json", patch)
    assert apply_patch.main(["patch.json"]) == 0
    assert read_json("scripts/temp_link.json") == [
        "https://DEV.itch.io/b/",
        "https://dev.itch.io/c",
    ]


def test_older_refresh_entry_never_replaces_a_newer_check(repo):
    seed_catalog([make_game("a"), make_game("b")])
    save_json(
        _state_file("refresh_state"),
        {
            "https://dev.itch.io/a": {
                "checked": "2026-09-18T05:00:00Z",
                "full": "2026-09-18T05:00:00Z",
            },
            "https://dev.itch.io/b": {
                "checked": "2026-09-10T00:00:00Z",
                "full": "2026-09-01T00:00:00Z",
            },
        },
    )
    patch = new_patch("refresh")
    patch["refresh_state"] = {
        # stale snapshot from an overlapping scan: an old strike + an error count
        "https://dev.itch.io/a": {
            "checked": "2026-09-17T00:00:00Z",
            "strike": "dead",
            "strike_at": "2026-09-17T00:00:00Z",
            "fails": 1,
        },
        # a normal refresh result must not reset the full-rescrape rotation
        "https://dev.itch.io/b": {"checked": "2026-09-18T06:00:00Z"},
    }
    write_patch("patch.json", patch)
    assert apply_patch.main(["patch.json"]) == 0
    state = read_json(_state_file("refresh_state"))
    assert state["https://dev.itch.io/a"] == {
        "checked": "2026-09-18T05:00:00Z",
        "full": "2026-09-18T05:00:00Z",
    }
    assert state["https://dev.itch.io/b"] == {
        "checked": "2026-09-18T06:00:00Z",
        "full": "2026-09-01T00:00:00Z",
    }


def test_removal_is_skipped_when_a_newer_check_landed(repo):
    seed_catalog([make_game("a")])
    save_json(
        _state_file("refresh_state"), {"https://dev.itch.io/a": {"checked": "2026-09-18T05:00:00Z"}}
    )
    patch = new_patch("refresh")
    patch["removals"] = [_removal("a", at="2026-09-18T03:00:00Z")]
    patch["refresh_state"] = {"https://dev.itch.io/a": None}
    write_patch("patch.json", patch)
    assert apply_patch.main(["patch.json"]) == 0
    assert [g["url"] for g in read_json("data_game/game_info_001.json")] == [
        "https://dev.itch.io/a"
    ]
    assert read_json("scripts/deleted_games.json") == []
    assert "https://dev.itch.io/a" in read_json(_state_file("refresh_state"))


def test_mass_removal_is_refused_unless_allowed(repo, monkeypatch):
    seed_catalog([make_game(f"g{i:03d}") for i in range(40)])
    patch = new_patch("refresh")
    patch["removals"] = [_removal(f"g{i:03d}") for i in range(26)]
    write_patch("patch.json", patch)
    assert apply_patch.main(["patch.json"]) == 1
    assert len(read_json("data_game/game_info_001.json")) == 40

    monkeypatch.setenv("ALLOW_MASS_REMOVAL", "1")
    assert apply_patch.main(["patch.json"]) == 0
    assert len(read_json("data_game/game_info_001.json")) == 14


def test_refresh_merge_is_symmetric_and_keeps_the_newest_full_stamp(repo):
    seed_catalog([make_game("a")])
    refresh = new_patch("refresh")
    refresh["refresh_state"] = {"https://dev.itch.io/a": {"checked": "2026-09-18T03:10:00Z"}}
    full = new_patch("full")
    full["refresh_state"] = {
        "https://dev.itch.io/a": {"checked": "2026-09-18T03:05:00Z", "full": "2026-09-18T03:05:00Z"}
    }
    expected = {"checked": "2026-09-18T03:10:00Z", "full": "2026-09-18T03:05:00Z"}
    for first, second in ((refresh, full), (full, refresh)):
        save_json(_state_file("refresh_state"), {})
        for p in (first, second):
            write_patch("patch.json", p)
            assert apply_patch.main(["patch.json"]) == 0
        assert read_json(_state_file("refresh_state"))["https://dev.itch.io/a"] == expected


def test_refresh_patch_removals_are_capped_by_games_checked(repo):
    """A scan that died before its own guard can't slip removals through."""
    seed_catalog([make_game(f"g{i:03d}") for i in range(400)])
    patch = new_patch("refresh")
    patch["stats"] = {"checked": 120}
    patch["removals"] = [_removal(f"g{i:03d}") for i in range(13)]  # limit max(10, 12) = 12
    write_patch("patch.json", patch)
    assert apply_patch.main(["patch.json"]) == 1
    patch["removals"] = patch["removals"][:12]
    write_patch("patch.json", patch)
    assert apply_patch.main(["patch.json"]) == 0
