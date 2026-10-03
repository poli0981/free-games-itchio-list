import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { decodePack, MANIFEST_FILE, parseManifest } from '../src/lib/data/pack-format.ts'
import { buildCatalogFiles, readCatalogSources, type CatalogFiles, type CatalogSources } from './catalog-data'

function game(i: number, over: Record<string, unknown> = {}) {
  return {
    url: `https://dev${i}.itch.io/game-${i}`,
    name: `Game ${i}`,
    dev: `dev${i}`,
    description: i % 5 === 0 ? 'N/A' : `Description ${i} — “quoted”, Tiếng Việt 🎮`,
    genre: i % 2 ? 'Puzzle' : 'Action',
    status: 'Released',
    publisher: 'N/A',
    release_date: 'N/A',
    rating: '4.5',
    rating_count: '12',
    average_session: 'N/A',
    nsfw: 'No',
    thumbnail: `https://img.itch.zone/aW1n${i}/original/x.png`,
    tags: i % 3 ? ['2D'] : [],
    platforms: ['Windows'],
    languages: [],
    inputs: [],
    made_with: [],
    safe_virus: '?',
    notes: '',
    ...over,
  }
}

function sources(): CatalogSources {
  const first = Array.from({ length: 6 }, (_, i) => game(i, i === 2 ? { updated_at: 'Sep 30, 2026' } : {}))
  const second = Array.from({ length: 3 }, (_, i) => game(10 + i, i === 1 ? { added_at: '2026-10-01T00:00:00Z' } : {}))
  return {
    index: {
      total_games: 9,
      last_updated: '2026-10-01T03:31:59Z',
      files: [
        { name: 'game_info_001.json', count: 6 },
        { name: 'game_info_002.json', count: 3 },
      ],
    },
    chunks: [
      { name: 'game_info_001.json', count: 6, games: first },
      { name: 'game_info_002.json', count: 3, games: second },
    ],
    history: [
      { date: '2026-09-30', total: 8 },
      { date: '2026-10-01', total: 9 },
    ],
    deleted: [{ url: 'https://old.itch.io/x', name: 'X', reason: 'Not free anymore', deleted_at: '2026-09-29' }],
  }
}

function unpack(files: CatalogFiles, name: string) {
  const bytes = files.get(`data/pack/${name}`)
  if (!(bytes instanceof Uint8Array)) throw new Error(`missing pack ${name}`)
  return decodePack(JSON.parse(inflateRawSync(bytes).toString('utf8')))
}

/** Rebuilds every chunk from the manifest's packs: main fields + descriptions, row by row. */
function restore(files: CatalogFiles) {
  const manifest = parseManifest(JSON.parse(files.get(`data/pack/${MANIFEST_FILE}`) as string))
  const chunks = manifest.chunks.map((chunk) => {
    const main = unpack(files, chunk.main)
    const desc = unpack(files, chunk.desc)
    expect(main).toHaveLength(chunk.count)
    expect(desc).toHaveLength(chunk.count)
    return main.map((row, i) => ({ ...row, description: desc[i].description }))
  })
  return { manifest, chunks, deleted: unpack(files, manifest.deleted), history: unpack(files, manifest.history) }
}

const sortKeys = (rows: object[]) =>
  rows.map((row) => Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))))

describe('buildCatalogFiles', () => {
  it('packs every chunk so that it decodes back to the source records', () => {
    const src = sources()
    const { manifest, chunks, deleted, history } = restore(buildCatalogFiles(src))
    expect(manifest.total_games).toBe(9)
    expect(manifest.last_updated).toBe(src.index.last_updated)
    expect(sortKeys(chunks.flat())).toStrictEqual(sortKeys(src.chunks.flatMap((c) => c.games as object[])))
    expect(deleted).toStrictEqual(src.deleted)
    expect(history).toStrictEqual(src.history)
  })

  it('keeps descriptions out of the main packs', () => {
    const files = buildCatalogFiles(sources())
    const manifest = parseManifest(JSON.parse(files.get(`data/pack/${MANIFEST_FILE}`) as string))
    for (const chunk of manifest.chunks) {
      expect(unpack(files, chunk.main).every((row) => !('description' in row))).toBe(true)
    }
  })

  it('names each pack after the sha256 of its bytes and is deterministic', () => {
    const a = buildCatalogFiles(sources())
    const b = buildCatalogFiles(sources())
    expect([...a.keys()]).toEqual([...b.keys()])
    for (const [name, body] of a) {
      expect(b.get(name)).toEqual(body)
      if (!name.endsWith('.bin')) continue
      expect(name).toMatch(/^data\/pack\/[0-9a-f]{16}\.bin$/)
      const hash = createHash('sha256').update(body as Uint8Array).digest('hex').slice(0, 16)
      expect(name).toBe(`data/pack/${hash}.bin`)
    }
  })

  it('still emits the readable JSON byte-for-byte, the urls map and the sitemap', () => {
    const src = sources()
    const files = buildCatalogFiles(src)
    expect(files.get('data/index.json')).toBe(JSON.stringify(src.index))
    expect(files.get('data/game_info_001.json')).toBe(JSON.stringify(src.chunks[0].games))
    expect(files.get('data/game_info_002.json')).toBe(JSON.stringify(src.chunks[1].games))
    expect(files.get('data/count_history.json')).toBe(JSON.stringify(src.history))
    expect(files.get('data/deleted_games.json')).toBe(JSON.stringify(src.deleted))
    expect(JSON.parse(files.get('data/urls.json') as string)['https://dev1.itch.io/game-1']).toBe(
      'https://img.itch.zone/aW1n1/original/x.png',
    )
    expect(files.get('sitemap.xml')).toContain('<loc>https://freeitchgames.win/games/dev1-itch-io-game-1</loc>')
  })

  it('fails the build on inconsistent data', () => {
    const wrongCount = sources()
    wrongCount.chunks[1].count = 4
    expect(() => buildCatalogFiles(wrongCount)).toThrow(/has 3 games, index.json says 4/)

    const wrongTotal = sources()
    wrongTotal.index.total_games = 10
    expect(() => buildCatalogFiles(wrongTotal)).toThrow(/chunks hold 9 games/)

    const badName = sources()
    badName.chunks[0].name = '../secret.json'
    expect(() => buildCatalogFiles(badName)).toThrow(/bad chunk name/)

    const noDescription = sources()
    delete (noDescription.chunks[0].games as Record<string, unknown>[])[0].description
    expect(() => buildCatalogFiles(noDescription)).toThrow(/has no description/)
  })

  it('round-trips the real catalog in this repository', () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
    const src = readCatalogSources(repoRoot)
    const { chunks, deleted, history } = restore(buildCatalogFiles(src))
    expect(chunks.map((c) => c.length)).toEqual(src.chunks.map((c) => c.count))
    chunks.forEach((rows, i) => {
      expect(sortKeys(rows)).toStrictEqual(sortKeys(src.chunks[i].games as object[]))
    })
    expect(deleted).toStrictEqual(src.deleted)
    expect(history).toStrictEqual(src.history)
  })
})
