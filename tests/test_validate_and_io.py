import json

import validate
from conftest import make_game, read_json, seed_catalog
from json_io import dedup_deleted, save_json, save_state_map, write_text_if_changed


def test_clean_catalog_passes(repo):
    seed_catalog([make_game("a"), make_game("b")])
    assert validate.validate() == ([], [])


def test_detects_schema_and_consistency_errors(repo):
    seed_catalog([make_game("a"), make_game("b")])
    chunk = read_json("data_game/game_info_001.json")
    chunk[0]["safe_virus"] = "y"
    chunk[0]["tags"] = "Horror"
    del chunk[0]["genre"]
    chunk[1]["url"] = "https://dev.itch.io/a"  # duplicate
    chunk[1]["extra"] = 1
    save_json("data_game/game_info_001.json", chunk + [make_game("c", url="http://X.itch.io/c/")])
    errors, warnings = validate.validate()
    text = "\n".join(errors)
    assert "safe_virus 'y'" in text
    assert "'tags' must be a list of strings" in text
    assert "missing field 'genre'" in text
    assert "duplicate url" in text
    assert "non-canonical url" in text
    assert "index.json 'files' does not match" in text
    assert any("unknown field" in w for w in warnings)


def test_fix_normalizes_enums(repo):
    seed_catalog([make_game("a", safe_virus="y"), make_game("b", nsfw="yes")])
    assert validate.fix() == 2
    games = read_json("data_game/game_info_001.json")
    assert [g["safe_virus"] for g in games] == ["Yes", "?"]
    assert [g["nsfw"] for g in games] == ["No", "Yes"]


def test_dedup_deleted_keeps_earliest():
    entries = [
        {"url": "u1", "deleted_at": "2026-02-01"},
        {"url": "u1", "deleted_at": "2026-01-01"},
        {"url": "", "deleted_at": "2026-01-01"},
        {"url": "u2", "deleted_at": "2025-12-01"},
    ]
    assert dedup_deleted(entries) == [
        {"url": "u2", "deleted_at": "2025-12-01"},
        {"url": "u1", "deleted_at": "2026-01-01"},
    ]


def test_write_if_changed_tolerates_crlf(tmp_path):
    path = tmp_path / "x.json"
    path.write_bytes(b"[\r\n    1\r\n]")
    assert write_text_if_changed(str(path), "[\n    1\n]") is False
    assert write_text_if_changed(str(path), "[\n    2\n]") is True
    assert path.read_bytes() == b"[\n    2\n]"


def test_state_map_one_line_per_url(tmp_path):
    path = tmp_path / "state.json"
    save_state_map(
        str(path), {"https://b.itch.io/x": {"checked": "t", "fails": 1}, "https://a.itch.io/y": {}}
    )
    lines = path.read_text(encoding="utf-8").splitlines()
    assert lines[0] == "{" and lines[-1] == "}"
    assert lines[1].startswith('  "https://a.itch.io/y"')
    assert json.loads(path.read_text(encoding="utf-8"))["https://b.itch.io/x"]["fails"] == 1
    save_state_map(str(path), {})
    assert json.loads(path.read_text(encoding="utf-8")) == {}
