import json

import pytest
from canonical import canonicalize, is_canonical
from conftest import FIXTURES

VECTORS = json.loads((FIXTURES / "url_vectors.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("vector", VECTORS, ids=[v["input"] or "<empty>" for v in VECTORS])
def test_url_vectors(vector):
    assert canonicalize(vector["input"]) == vector["expected"]


def test_canonical_output_is_canonical():
    for vector in VECTORS:
        if vector["expected"]:
            assert is_canonical(vector["expected"])


def test_non_string_input():
    assert canonicalize(None) is None
    assert canonicalize(123) is None
