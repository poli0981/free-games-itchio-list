import { useEffect } from 'react'

const BASE_TITLE = 'Itch.io Free Games Database'

export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE
    return () => {
      document.title = previous
    }
  }, [title])
}
