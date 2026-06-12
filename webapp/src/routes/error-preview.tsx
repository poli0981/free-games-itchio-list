import { useParams } from 'react-router-dom'
import { ErrorPage } from '@/components/error-page'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useT } from '@/lib/i18n'

/**
 * Hidden route (`/errors/:code`) for previewing the error pages — not linked
 * from the nav. Try `#/errors/403`, `#/errors/500`, `#/errors/999`.
 */
export default function ErrorPreview() {
  const { code } = useParams()
  const t = useT()
  const status = Number(code)
  useDocumentTitle(`Error ${code ?? ''}`)
  return (
    <div className="flex h-full flex-col">
      <p className="px-6 pt-4 text-center text-xs text-muted-foreground">
        {t('error.preview.hint', { status: code ?? '?' })}
      </p>
      <ErrorPage status={Number.isFinite(status) ? status : undefined} />
    </div>
  )
}
