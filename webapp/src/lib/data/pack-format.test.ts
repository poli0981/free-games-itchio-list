import { describe, expect, it } from 'vitest'
import { decodePack, encodePack, isPackFile, MANIFEST_FILE, parseManifest } from './pack-format'

function record(i: number, over: Record<string, unknown> = {}) {
  return {
    url: `https://dev${i}.itch.io/game-${i}`,
    name: `Game ${i}`,
    dev: `dev${i}`,
    genre: i % 3 === 0 ? 'Puzzle' : 'Action',
    status: 'Released',
    publisher: 'N/A',
    release_date: 'N/A',
    rating: i % 2 ? '4.5' : 'N/A',
    rating_count: i % 2 ? '1,200' : 'N/A',
    average_session: 'N/A',
    nsfw: 'No',
    thumbnail: `https://img.itch.zone/aW1n${i}/original/x${i}.png`,
    tags: i % 2 ? ['2D', 'Cozy'] : [],
    platforms: ['Windows', 'HTML5'],
    languages: [],
    inputs: ['Keyboard'],
    made_with: i % 4 === 0 ? ['Godot'] : [],
    safe_virus: '?',
    notes: '',
    ...over,
  }
}

const roundTrip = (rows: object[]) => decodePack(JSON.parse(JSON.stringify(encodePack(rows))))

describe('encodePack / decodePack', () => {
  it('round-trips catalog-shaped records, optional keys and any text', () => {
    const rows = [
      record(1, { updated_at: 'Sep 30, 2026' }),
      record(2),
      record(3, { added_at: '2026-10-01T03:31:59Z', name: 'Trò chơi “đẹp” 🎮   end', notes: 'Line 1\nLine 2' }),
      record(4, { updated_at: 'Oct 1, 2026', added_at: '2026-10-02T00:00:00Z' }),
    ]
    const back = roundTrip(rows)
    expect(back).toStrictEqual(rows)
    expect(Object.hasOwn(back[1], 'added_at')).toBe(false)
    expect(Object.hasOwn(back[1], 'updated_at')).toBe(false)
  })

  it('round-trips the removal log and the games-over-time series', () => {
    const deleted = [
      { url: 'https://a.itch.io/x', name: 'X', reason: 'Not free anymore', deleted_at: '2026-09-20' },
      { url: 'https://b.itch.io/y', name: 'Y', reason: 'Page gone (404/410)', deleted_at: '2026-09-21' },
      { url: 'https://c.itch.io/z', name: 'Z', reason: 'Not free anymore', deleted_at: '2026-09-21' },
    ]
    const history = [
      { date: '2026-09-01', total: 2500 },
      { date: '2026-09-02', total: 2513 },
    ]
    expect(roundTrip(deleted)).toStrictEqual(deleted)
    expect(roundTrip(history)).toStrictEqual(history)
  })

  it('keeps a dictionary only where it pays off', () => {
    const rows = Array.from({ length: 10 }, (_, i) => record(i))
    const { c } = encodePack(rows)
    expect(c.genre).toEqual({ d: ['Puzzle', 'Action'], i: [0, 1, 1, 0, 1, 1, 0, 1, 1, 0] })
    expect('v' in c.url).toBe(true) // all distinct
    expect(c.tags).toEqual({ d: ['2D', 'Cozy'], a: [[], [0, 1], [], [0, 1], [], [0, 1], [], [0, 1], [], [0, 1]] })
  })

  it('is deterministic', () => {
    const rows = Array.from({ length: 20 }, (_, i) => record(i))
    expect(JSON.stringify(encodePack(rows))).toBe(JSON.stringify(encodePack(rows.map((r) => ({ ...r })))))
  })

  it('refuses values it cannot represent', () => {
    expect(() => encodePack([{ a: null }])).toThrow(/unsupported/)
    expect(() => encodePack([{ a: true }])).toThrow(/unsupported/)
    expect(() => encodePack([{ a: [['x']] }])).toThrow(/unsupported/)
    expect(() => encodePack([{ a: { b: 1 } }])).toThrow(/unsupported/)
    expect(() => encodePack([{ a: 'x' }, { a: ['x'] }])).toThrow(/mixes/)
    expect(() => encodePack([{ Bad: 'x' }])).toThrow(/bad key/)
    expect(() => encodePack([JSON.parse('{"__proto__": "x"}')])).toThrow(/bad key/)
  })

  it('rejects damaged packs', () => {
    const good = encodePack(Array.from({ length: 10 }, (_, i) => record(i)))
    const damaged = (patch: (p: Record<string, unknown>) => void) => {
      const p = JSON.parse(JSON.stringify(good))
      patch(p)
      return () => decodePack(p)
    }
    expect(damaged((p) => (p.v = 2))).toThrow(/version/)
    expect(damaged((p) => (p.n = 11))).toThrow(/length/)
    expect(damaged((p) => ((p.c as Record<string, { i: number[] }>).genre.i[0] = 9))).toThrow(/range/)
    expect(damaged((p) => ((p.c as Record<string, { a: number[][] }>).tags.a[1] = [7]))).toThrow(/range/)
    expect(damaged((p) => ((p.c as Record<string, unknown>).name = { x: [] }))).toThrow(/unknown column/)
    expect(() => decodePack(null)).toThrow()
  })
})

describe('parseManifest', () => {
  const manifest = {
    v: 1,
    total_games: 3,
    last_updated: '2026-10-01T03:31:59Z',
    chunks: [{ count: 3, main: '0123456789abcdef.bin', desc: 'fedcba9876543210.bin' }],
    deleted: 'aaaaaaaaaaaaaaaa.bin',
    history: 'bbbbbbbbbbbbbbbb.bin',
  }

  it('accepts a valid manifest', () => {
    expect(parseManifest(manifest)).toStrictEqual(manifest)
    expect(MANIFEST_FILE).toBe('manifest-v1.json')
    expect(isPackFile('0123456789abcdef.bin')).toBe(true)
    expect(isPackFile('../index.json')).toBe(false)
  })

  it('rejects other versions and bad file names', () => {
    expect(() => parseManifest({ ...manifest, v: 2 })).toThrow(/version/)
    expect(() => parseManifest({ ...manifest, deleted: '../x.bin' })).toThrow(/file name/)
    expect(() => parseManifest({ ...manifest, chunks: [{ count: 1, main: 'x', desc: 'y' }] })).toThrow(/file name/)
    expect(() => parseManifest({ ...manifest, chunks: [{ count: -1, main: '', desc: '' }] })).toThrow(/chunk/)
    expect(() => parseManifest({ ...manifest, total_games: '3' })).toThrow(/shape/)
  })
})
