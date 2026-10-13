import { describe, expect, it } from 'vitest'
import { canonicalize } from '../worker/canonical'
import { extractGameUrls } from './extract'

describe('extractGameUrls', () => {
  it('finds game URLs in a plain list, in order, once each', () => {
    const { urls, duplicates } = extractGameUrls(
      'https://Alpha.itch.io/First-Light/\nbeta.itch.io/rock\nhttps://alpha.itch.io/first-light?ref=x\n',
    )
    expect(urls).toEqual(['https://alpha.itch.io/first-light', 'https://beta.itch.io/rock'])
    expect(duplicates).toBe(1)
  })

  it('reads Markdown, CSV, HTML and JSON', () => {
    const text = [
      '- [Rock](https://beta.itch.io/rock) and <https://gamma.itch.io/tower>',
      'name,url\n"Delta",https://delta.itch.io/maze',
      '<a HREF="https://epsilon.itch.io/park/devlog/12">devlog</a>',
      JSON.stringify({ games: ['https://zeta.itch.io/walk'] }).replaceAll('/', '\\/'), // PHP-style escaped slashes
    ].join('\n')
    expect(extractGameUrls(text).urls).toEqual([
      'https://beta.itch.io/rock',
      'https://gamma.itch.io/tower',
      'https://delta.itch.io/maze',
      'https://epsilon.itch.io/park',
      'https://zeta.itch.io/walk',
    ])
  })

  it('skips itch.io pages that are not games and look-alike hosts', () => {
    const text = 'https://itch.io/games/free https://www.itch.io/x https://static.itch.io/y https://creator.itch.io https://evil.com.itch.io.example/x https://img.itch.zone/abc'
    expect(extractGameUrls(text).urls).toEqual([])
  })

  it('returns canonical URLs only (the same form the Worker stores)', () => {
    const { urls } = extractGameUrls('HTTP://My-Dev.ITCH.io/Game_2 my-dev.itch.io/7days')
    for (const url of urls) expect(canonicalize(url)).toBe(url)
  })
})
