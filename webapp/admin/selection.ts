/** A set of selected game URLs, capped at the bulk limit (one commit). */
import { useCallback, useState } from 'react'
import { MAX_BULK } from '../worker/limits'

export function useSelection(max = MAX_BULK) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const toggle = useCallback(
    (url: string) =>
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(url)) next.delete(url)
        else if (next.size < max) next.add(url)
        return next
      }),
    [max],
  )
  /** Add (or, with `on` false, drop) several; adding stops at the cap. */
  const setMany = useCallback(
    (urls: string[], on: boolean) =>
      setSelected((prev) => {
        const next = new Set(prev)
        for (const url of urls) {
          if (!on) next.delete(url)
          else if (next.size < max) next.add(url)
        }
        return next
      }),
    [max],
  )
  const clear = useCallback(() => setSelected(new Set()), [])
  return { selected, toggle, setMany, clear, max, full: selected.size >= max }
}
