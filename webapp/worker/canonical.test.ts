import { describe, expect, it } from 'vitest'
import { canonicalize } from './canonical'
// Shared with the Python pipeline (tests/test_canonical.py).
import vectors from '../../tests/fixtures/url_vectors.json'

describe('canonicalize (shared vectors)', () => {
  it.each(vectors.map((v) => [v.input, v.expected] as const))('%j → %j', (input, expected) => {
    expect(canonicalize(input)).toBe(expected)
  })

  it('rejects non-strings', () => {
    expect(canonicalize(undefined)).toBeNull()
    expect(canonicalize(42)).toBeNull()
  })
})
