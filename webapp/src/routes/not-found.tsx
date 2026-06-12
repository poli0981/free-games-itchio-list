import { ErrorPage } from '@/components/error-page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useT } from '@/lib/i18n'

export default function NotFound() {
  const t = useT()
  useDocumentTitle(t('titles.notFound'))
  return <ErrorPage status={404} />
}
