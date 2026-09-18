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
