/**
 * itch.io game URLs out of any pasted or uploaded text: a plain list, CSV,
 * Markdown, an HTML page or JSON (escaped "\/" slashes included). A link
 * deeper into a game page (devlog, purchase…) counts as the game. The result
 * is canonical (https://creator.itch.io/game, lower case), de-duplicated, in
 * the order the games first appear.
 */

// The creator's subdomain, then the game's slug as the first path segment.
const GAME_URL = /(?:^|[^a-z0-9.-])(?:https?:\/\/)?([a-z0-9][a-z0-9-]*)\.itch\.io\/([a-z0-9][a-z0-9_-]*)/gi
// itch.io's own subdomains, never a creator.
const NOT_CREATORS = new Set(['www', 'static', 'api'])

export interface Extracted {
  urls: string[]
  /** Further mentions of a game already listed. */
  duplicates: number
}

export function extractGameUrls(text: string): Extracted {
  const seen = new Set<string>()
  let duplicates = 0
  for (const m of text.replace(/\\\//g, '/').matchAll(GAME_URL)) {
    const creator = m[1].toLowerCase()
    if (NOT_CREATORS.has(creator)) continue
    const url = `https://${creator}.itch.io/${m[2].toLowerCase()}`
    if (seen.has(url)) duplicates += 1
    else seen.add(url)
  }
  return { urls: [...seen], duplicates }
}
