import { useEffect } from 'react'

const BASE_TITLE = 'Free Itch Games'

/** "<title> — Free Itch Games"; `exact` uses the title as given (the home page's full title). */
export function useDocumentTitle(title?: string, { exact = false }: { exact?: boolean } = {}): void {
  useEffect(() => {
    const previous = document.title
    document.title = title ? (exact ? title : `${title} — ${BASE_TITLE}`) : BASE_TITLE
    return () => {
      document.title = previous
    }
  }, [title, exact])
}
