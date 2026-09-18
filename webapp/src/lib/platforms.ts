/** itch.io platform names, in the order the UI lists them. */
const ORDER = ['HTML5', 'Windows', 'macOS', 'Linux', 'Android']
const SHORT: Record<string, string> = { HTML5: 'Web', Windows: 'Win', macOS: 'Mac' }
const LABEL: Record<string, string> = { HTML5: 'Web (HTML5)' }

export function orderPlatforms(list: string[] | undefined): string[] {
  const rank = (p: string) => {
    const i = ORDER.indexOf(p)
    return i === -1 ? ORDER.length : i
  }
  return [...(list ?? [])].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

/** "Web", "Win", "Mac" … for dense rows. */
export const platformShort = (platform: string): string => SHORT[platform] ?? platform

/** "Web (HTML5)", "Windows" … for filters and the detail page. */
export const platformLabel = (platform: string): string => LABEL[platform] ?? platform
