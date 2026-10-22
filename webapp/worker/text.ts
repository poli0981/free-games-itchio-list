/** The HTML/XML character references itch.io pages and feeds use, decoded. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim()
}

/**
 * `text` without its trailing `char`s. A loop, not `/x+$/`: that regex retries
 * from every character of a long run that is not at the end (quadratic).
 */
export function trimEnd(text: string, char: string): string {
  let end = text.length
  while (end > 0 && text[end - 1] === char) end--
  return text.slice(0, end)
}

/** Code-unit order, like a bare `sort()` and, for these ASCII names, Python's `sorted()`; not locale-aware. */
export function compareCodeUnits(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}
