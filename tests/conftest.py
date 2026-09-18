"""Shared pytest setup: import path, no network, and a throwaway repo layout."""

import json
import os
import socket
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures"
sys.path.insert(0, str(ROOT / "scripts"))


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """Tests must never touch itch.io (or anything else)."""

    def guard(*_args, **_kwargs):
        raise RuntimeError("network access is disabled in tests")

    monkeypatch.setattr(socket.socket, "connect", guard)
    monkeypatch.setattr(socket, "create_connection", guard)


@pytest.fixture
def repo(tmp_path, monkeypatch):
    """Empty repo layout (data_game/, scripts/state/) as the working directory."""
    (tmp_path / "data_game").mkdir()
    (tmp_path / "scripts" / "state").mkdir(parents=True)
    (tmp_path / "scripts" / "deleted_games.json").write_text("[]", encoding="utf-8")
    (tmp_path / "scripts" / "temp_link.json").write_text("[]", encoding="utf-8")
    monkeypatch.chdir(tmp_path)
    return tmp_path


def make_game(slug: str, **overrides) -> dict:
    """A schema-complete record for https://dev.itch.io/<slug>."""
    game = {
        "url": f"https://dev.itch.io/{slug}",
        "name": slug.title(),
        "dev": "Dev",
        "description": "N/A",
        "genre": "Puzzle",
        "status": "Released",
        "publisher": "N/A",
        "release_date": "N/A",
        "rating": "4.0",
        "rating_count": "10",
        "average_session": "N/A",
        "nsfw": "No",
        "thumbnail": "https://img.itch.zone/aW1n/original/x.png",
        "tags": [],
        "platforms": ["Windows"],
        "languages": [],
        "inputs": [],
        "made_with": [],
        "safe_virus": "?",
        "notes": "",
    }
    game.update(overrides)
    return game


def load_fixture_soup(name: str):
    from bs4 import BeautifulSoup

    return BeautifulSoup((FIXTURES / name).read_bytes(), "html.parser")


def read_json(path) -> object:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def seed_catalog(games: list[dict]) -> None:
    """Write `games` into data_game/ through the real storage code."""
    from data_store import save_all_games

    save_all_games(games)
    assert os.path.exists("data_game/index.json")
