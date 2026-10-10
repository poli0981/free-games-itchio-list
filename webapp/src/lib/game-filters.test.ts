import { describe, expect, it } from 'vitest'
import type { Game } from '@/types/game'
import { emptyQuery, facetCounts, filterGames, parseQuery, sortGames, toParams } from './game-filters'

function game(name: string, over: Partial<Game> = {}): Game {
  return {
    url: `https://dev.itch.io/${name.toLowerCase().replace(/\W+/g, '-')}`,
    name,
    dev: 'Dev',
    genre: 'Puzzle',
    status: 'Released',
    publisher: 'N/A',
    release_date: 'N/A',
    rating: 'N/A',
    rating_count: 'N/A',
    average_session: 'N/A',
    nsfw: 'No',
    thumbnail: 'N/A',
    tags: [],
    platforms: ['Windows'],
    languages: [],
    inputs: [],
    made_with: [],
    safe_virus: '?',
    notes: '',
    ...over,
  }
}

const GAMES = [
  game('Café Dreams', { genre: 'Visual Novel', rating: '4.9', rating_count: '1,200', platforms: ['HTML5'], tags: ['Cozy'] }),
  game('Block Stack', { rating: '4.2', rating_count: '300', platforms: ['Windows', 'HTML5'] }),
  game('Night Drive', { genre: 'Racing', rating: '4.6', rating_count: '80', status: 'In development' }),
  game('Unrated Thing'),
]

describe('URL round trip', () => {
  it('parses, drops defaults and junk, and serializes back', () => {
    const q = parseQuery(new URLSearchParams('q=cafe&genre=Puzzle&genre=Puzzle&platform=HTML5&rating=4.5&browser=1&sort=name&page=3'))
    expect(q.lists.genre).toEqual(['Puzzle'])
    expect(q).toMatchObject({ q: 'cafe', minRating: 4.5, browser: true, sort: 'name', page: 3 })
    expect(toParams(q).toString()).toBe('q=cafe&genre=Puzzle&platform=HTML5&rating=4.5&browser=1&sort=name&page=3')
    const junk = parseQuery(new URLSearchParams('rating=2.2&sort=evil&page=-4'))
    expect(junk).toMatchObject({ minRating: null, sort: 'rated', page: 1 })
    expect(toParams(emptyQuery()).toString()).toBe('')
  })
})

describe('filterGames', () => {
  it('searches name, developer and tags without accents or case', () => {
    expect(filterGames(GAMES, { ...emptyQuery(), q: 'CAFE' }).map((g) => g.name)).toEqual(['Café Dreams'])
    expect(filterGames(GAMES, { ...emptyQuery(), q: 'cozy' })).toHaveLength(1)
    expect(filterGames(GAMES, { ...emptyQuery(), q: 'dev' })).toHaveLength(4)
  })

  it('also searches the descriptions loaded so far, once they arrive', () => {
    const q = { ...emptyQuery(), q: 'NEON' }
    expect(filterGames(GAMES, q)).toHaveLength(0)
    expect(filterGames(GAMES, q, undefined, new Map())).toHaveLength(0)
    const descriptions = new Map([[GAMES[2], 'A drive through néon streets']])
    expect(filterGames(GAMES, q, undefined, descriptions).map((g) => g.name)).toEqual(['Night Drive'])
    // Cached per game: a later lookup without it searches without it again.
    expect(filterGames(GAMES, q)).toHaveLength(0)
  })

  it('combines list filters, rating and browser-only', () => {
    const q = emptyQuery()
    q.lists.platform = ['HTML5']
    expect(filterGames(GAMES, q)).toHaveLength(2)
    expect(filterGames(GAMES, { ...q, minRating: 4.5 }).map((g) => g.name)).toEqual(['Café Dreams'])
    expect(filterGames(GAMES, { ...emptyQuery(), browser: true })).toHaveLength(2)
    const status = emptyQuery()
    status.lists.status = ['In development']
    expect(filterGames(GAMES, status).map((g) => g.name)).toEqual(['Night Drive'])
  })

  it('can leave one filter out, for that filter’s option counts', () => {
    const q = emptyQuery()
    q.lists.genre = ['Racing']
    expect(filterGames(GAMES, q, 'genre')).toHaveLength(4)
    expect(facetCounts(GAMES, 'genre')).toEqual([
      { value: 'Puzzle', count: 2 },
      { value: 'Racing', count: 1 },
      { value: 'Visual Novel', count: 1 },
    ])
  })

  it('filters on the AI disclosure, with "not disclosed" as a value of its own', () => {
    const games = [
      game('Hand Made', { ai_disclosure: 'No AI', ai_content: [] }),
      game('Helper', { ai_disclosure: 'AI Assisted', ai_content: ['Graphics'] }),
      game('Quiet', { ai_disclosure: 'N/A', ai_content: [] }),
      game('Not Rechecked'), // a record from before 4.3
    ]
    // A fixed order, not by count.
    expect(facetCounts(games, 'ai')).toEqual([
      { value: 'No AI', count: 1 },
      { value: 'AI Assisted', count: 1 },
      { value: 'N/A', count: 2 },
    ])
    const q = parseQuery(new URLSearchParams('ai=No+AI&ai=N%2FA'))
    expect(q.lists.ai).toEqual(['No AI', 'N/A'])
    expect(filterGames(games, q).map((g) => g.name)).toEqual(['Hand Made', 'Quiet', 'Not Rechecked'])
    expect(toParams(q).toString()).toBe('ai=No+AI&ai=N%2FA')
  })

  it('filters on accessibility features', () => {
    const games = [
      game('Captioned', { accessibility: ['Subtitles', 'High-contrast'] }),
      game('Remappable', { accessibility: ['Configurable controls'] }),
      game('Plain'),
    ]
    const q = emptyQuery()
    q.lists.access = ['Subtitles', 'Configurable controls']
    expect(filterGames(games, q).map((g) => g.name)).toEqual(['Captioned', 'Remappable'])
    expect(facetCounts(games, 'access').map((c) => c.value)).toEqual(['Configurable controls', 'High-contrast', 'Subtitles'])
  })
})

describe('sortGames', () => {
  it('sorts by ratings count, rating, name and recency', () => {
    expect(sortGames(GAMES, 'rated').map((g) => g.name)).toEqual(['Café Dreams', 'Block Stack', 'Night Drive', 'Unrated Thing'])
    expect(sortGames(GAMES, 'rating').map((g) => g.name)).toEqual(['Café Dreams', 'Night Drive', 'Block Stack', 'Unrated Thing'])
    expect(sortGames(GAMES, 'name').map((g) => g.name)).toEqual(['Block Stack', 'Café Dreams', 'Night Drive', 'Unrated Thing'])
    expect(sortGames(GAMES, 'recent').map((g) => g.name)).toEqual(['Unrated Thing', 'Night Drive', 'Block Stack', 'Café Dreams'])
  })

  it('ignores leading punctuation when sorting by name', () => {
    const games = [game('Zebra'), game('"Alpha" Beta'), game('[Demo] Mango')]
    expect(sortGames(games, 'name').map((g) => g.name)).toEqual(['"Alpha" Beta', '[Demo] Mango', 'Zebra'])
  })
})
