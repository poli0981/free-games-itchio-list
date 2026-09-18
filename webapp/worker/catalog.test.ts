import { describe, expect, it } from 'vitest'
// Shared with the Python pipeline (tests/test_data_store.py).
import planCases from '../../tests/fixtures/golden/plan_chunks.json'
import serializeInput from '../../tests/fixtures/golden/serialize_input.json'
import serializeExpected from '../../tests/fixtures/golden/serialize_expected.txt?raw'
import {
  applyAdminChange,
  buildIndex,
  dedupDeleted,
  dumps,
  planChunks,
  upsertCountHistory,
  validateEdit,
  type CatalogFiles,
  type Game,
} from './catalog'

const NOW = new Date('2026-09-20T10:00:00.123Z')
const SMALL = { chunkSize: 2, minFill: 1 }

function game(slug: string, extra: Record<string, unknown> = {}): Game {
  return { url: `https://dev.itch.io/${slug}`, name: slug, safe_virus: '?', notes: '', nsfw: 'No', ...extra }
}

describe('golden fixtures shared with Python', () => {
  it.each(planCases.map((c) => [c.name, c] as const))('planChunks: %s', (_name, c) => {
    const old = c.old.map((chunk) => chunk.map((url) => ({ url })))
    const games = c.games.map((url) => ({ url }))
    const got = planChunks(old, games, c.chunk_size, c.min_fill)
    expect(got.map((chunk) => chunk.map((g) => g.url))).toEqual(c.expected)
  })

  it('dumps matches json.dumps(indent=4, ensure_ascii=False) byte for byte', () => {
    expect(dumps(serializeInput)).toBe(serializeExpected)
  })
})

describe('index and history', () => {
  it('keeps last_updated when nothing changed', () => {
    const chunks = [[game('a')]]
    const prev = buildIndex(chunks, null, true, new Date('2026-01-01T00:00:00Z'))
    expect(prev.last_updated).toBe('2026-01-01T00:00:00Z')
    expect(buildIndex(chunks, prev, false, NOW).last_updated).toBe('2026-01-01T00:00:00Z')
    expect(buildIndex(chunks, prev, true, NOW).last_updated).toBe('2026-09-20T10:00:00Z')
  })

  it('adds a history row only when the total changes', () => {
    const h = [{ date: '2026-09-01', total: 10 }]
    expect(upsertCountHistory(h, 10, NOW)).toEqual(h)
    expect(upsertCountHistory(h, 9, NOW)).toEqual([...h, { date: '2026-09-20', total: 9 }])
    expect(upsertCountHistory([{ date: '2026-09-20', total: 5 }], 9, NOW)).toEqual([{ date: '2026-09-20', total: 9 }])
  })

  it('dedupDeleted keeps the earliest entry per url', () => {
    const e = (url: string, at: string) => ({ url, name: url, reason: 'r', deleted_at: at })
    expect(dedupDeleted([e('u1', '2026-02'), e('u1', '2026-01'), e('', '2025'), e('u2', '2025-12')])).toEqual([
      e('u2', '2025-12'),
      e('u1', '2026-01'),
    ])
  })
})

describe('validateEdit', () => {
  it('allows only the three editable fields with valid values', () => {
    expect(validateEdit({ safe_virus: 'Yes', notes: 'ok', nsfw: 'No' })).toBeNull()
    expect(validateEdit({ name: 'x' })).toMatch(/not editable/)
    expect(validateEdit({ safe_virus: 'y' })).toMatch(/safe_virus/)
    expect(validateEdit({ nsfw: 'maybe' })).toMatch(/nsfw/)
    expect(validateEdit({ notes: 1 })).toMatch(/string/)
    expect(validateEdit({ notes: 'x'.repeat(2001) })).toMatch(/2000/)
  })
})

describe('applyAdminChange', () => {
  function files(): CatalogFiles {
    const chunks = [[game('a'), game('b')], [game('c')]]
    return {
      chunks,
      index: buildIndex(chunks, null, true, new Date('2026-09-01T00:00:00Z')),
      history: [{ date: '2026-09-01', total: 3 }],
      deleted: [],
    }
  }

  it('edits in place and only rewrites the touched chunk + index', () => {
    const change = applyAdminChange(files(), new Map([['https://dev.itch.io/c', { safe_virus: 'Yes' }]]), [], NOW, SMALL)
    expect([...change.writes.keys()].sort()).toEqual(['data_game/game_info_002.json', 'data_game/index.json'])
    expect(JSON.parse(change.writes.get('data_game/game_info_002.json')!)[0].safe_virus).toBe('Yes')
    expect(change.summary).toEqual({ edited: 1, removed: 0 })
  })

  it('removes games, logs them and updates index + history in one change', () => {
    const change = applyAdminChange(
      files(),
      new Map(),
      [{ url: 'https://dev.itch.io/c', reason: 'Removed at the creator’s request' }],
      NOW,
      SMALL,
    )
    expect(change.deletes).toEqual(['data_game/game_info_002.json'])
    const index = JSON.parse(change.writes.get('data_game/index.json')!)
    expect(index.total_games).toBe(2)
    expect(index.files).toEqual([{ name: 'game_info_001.json', count: 2 }])
    expect(JSON.parse(change.writes.get('data_game/count_history.json')!).at(-1)).toEqual({ date: '2026-09-20', total: 2 })
    const deleted = JSON.parse(change.writes.get('scripts/deleted_games.json')!)
    expect(deleted).toEqual([
      { url: 'https://dev.itch.io/c', name: 'c', reason: 'Removed at the creator’s request', deleted_at: '2026-09-20T10:00:00Z' },
    ])
  })

  it('writes nothing for a no-op edit', () => {
    const change = applyAdminChange(files(), new Map([['https://dev.itch.io/a', { safe_virus: '?' }]]), [], NOW, SMALL)
    expect(change.writes.size).toBe(0)
    expect(change.deletes).toEqual([])
  })
})
