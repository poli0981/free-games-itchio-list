import { isTauri } from './runtime'

export async function openExternal(href: string): Promise<void> {
  if (isTauri()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(href)
    return
  }
  window.open(href, '_blank', 'noopener,noreferrer')
}
