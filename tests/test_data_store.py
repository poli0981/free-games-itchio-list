import json
import os
from datetime import UTC

import data_store
import pytest
from conftest import FIXTURES, make_game, read_json, seed_catalog
from json_io import dumps

CASES = json.loads((FIXTURES / "golden" / "plan_chunks.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_plan_chunks_golden(case, monkeypatch):
    monkeypatch.setattr(data_store, "CHUNK_SIZE", case["chunk_size"])
    monkeypatch.setattr(data_store, "MIN_FILL", case["min_fill"])
    old = [[{"url": u} for u in chunk] for chunk in case["old"]]
    games = [{"url": u} for u in case["games"]]
    got = data_store.plan_chunks(old, games)
    assert [[g["url"] for g in chunk] for chunk in got] == case["expected"]


def test_serialization_matches_golden():
    data = read_json(FIXTURES / "golden" / "serialize_input.json")
    expected = (FIXTURES / "golden" / "serialize_expected.txt").read_bytes().decode("utf-8")
    assert dumps(data) == expected


def test_save_writes_chunks_index_and_history(repo, monkeypatch):
    monkeypatch.setattr(data_store, "CHUNK_SIZE", 2)
    games = [make_game(s) for s in ("a", "b", "c")]
    assert data_store.save_all_games(games) is True
    index = read_json("data_game/index.json")
    assert index["total_games"] == 3
    assert [f["name"] for f in index["files"]] == ["game_info_001.json", "game_info_002.json"]
    assert index["max_per_file"] == 2
    assert read_json("data_game/count_history.json")[-1]["total"] == 3


def test_noop_save_changes_nothing(repo):
    games = [make_game(s) for s in ("a", "b")]
    seed_catalog(games)
    before = {p: os.stat(p).st_mtime_ns for p in os.listdir(".") if p}
    index_before = read_json("data_game/index.json")
    assert data_store.save_all_games(data_store.load_all_games()) is False
    assert read_json("data_game/index.json") == index_before
    assert before  # sanity


def test_update_bumps_last_updated_but_not_history(repo, monkeypatch):
    seed_catalog([make_game("a"), make_game("b")])
    history_before = read_json("data_game/count_history.json")
    index_before = read_json("data_game/index.json")

    from datetime import datetime

    later = datetime(2099, 1, 2, 3, 4, 5, tzinfo=UTC)
    monkeypatch.setattr(data_store, "_utc_now", lambda: later)
    games = data_store.load_all_games()
    games[0]["rating"] = "5.0"
    assert data_store.save_all_games(games) is True

    index = read_json("data_game/index.json")
    assert index["last_updated"] == "2099-01-02T03:04:05Z" != index_before["last_updated"]
    # Same total → no new count_history row.
    assert read_json("data_game/count_history.json") == history_before


def test_removing_last_game_of_a_chunk_drops_the_file(repo, monkeypatch):
    monkeypatch.setattr(data_store, "CHUNK_SIZE", 2)
    monkeypatch.setattr(data_store, "MIN_FILL", 1)
    seed_catalog([make_game(s) for s in ("a", "b", "c")])
    games = [g for g in data_store.load_all_games() if g["url"].endswith("/c")]
    data_store.save_all_games([g for g in data_store.load_all_games() if g not in games])
    assert sorted(os.listdir("data_game")) == [
        "count_history.json",
        "game_info_001.json",
        "index.json",
    ]
