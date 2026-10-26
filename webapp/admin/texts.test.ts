import { describe, expect, it } from 'vitest'
import { ApiError, SessionExpired } from './api'
import { ERROR_TEXT, errorText } from './texts'

// The sources of every error the admin API answers with.
const SOURCES = import.meta.glob<string>(['../worker/admin.ts', '../worker/http.ts', '../worker/ratelimit.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('admin error texts', () => {
  it('has wording for every error code of the admin API', () => {
    const codes = new Set(
      Object.values(SOURCES).flatMap((src) =>
        [...src.matchAll(/HttpError\(\d{3}, '([a-z_]+)'|json\(\{ error: '([a-z_]+)' \}/g)].map((m) => m[1] ?? m[2]),
      ),
    )
    expect(codes).toContain('rate_limited')
    expect(codes.size).toBeGreaterThan(15)
    expect([...codes].filter((c) => !(c in ERROR_TEXT))).toEqual([])
  })

  it('adds the server message on a second line, and never loses an unknown code', () => {
    expect(errorText(new ApiError(400, 'invalid_edit', 'nsfw must be one of No, Yes'))).toBe(
      `${ERROR_TEXT.invalid_edit}\nnsfw must be one of No, Yes`,
    )
    expect(errorText(new ApiError(418, 'teapot'))).toBe('Error: teapot.')
    expect(errorText(new SessionExpired())).toMatch(/expired/)
  })
})
