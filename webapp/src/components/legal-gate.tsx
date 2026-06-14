import { useState, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { usePrefs, LEGAL_VERSION } from '@/stores/prefs'
import { useT } from '@/lib/i18n'
import { LEGAL_LINKS, LEGAL_VI_INDEX_URL } from '@/lib/about'
import { ExtLink } from '@/components/ext-link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

/**
 * Full-screen first-launch legal-acceptance gate. Renders INSTEAD of the app
 * shell until the user accepts the current `LEGAL_VERSION`; the sidebar and
 * routes never mount while it is up. Acceptance persists in the `webapp.prefs`
 * localStorage blob (synchronous Zustand hydration → no flash on reload).
 *
 * Built on the raw Radix Dialog primitives (not `ui/dialog.tsx`) so it has no
 * close "X" and cannot be dismissed via Esc / outside-click. Radix still
 * provides the focus trap and aria-modal labelling.
 */

// Policy links + the canonical License — reuse about.ts, never hardcode URLs.
const GATE_LINKS = LEGAL_LINKS.filter(
  (l) => l.group === 'policy' || l.name === 'License (MIT)',
)

export function LegalGate({ children }: { children: ReactNode }) {
  const accepted = usePrefs((s) => s.acceptedLegalVersion)
  if (accepted === LEGAL_VERSION) return <>{children}</>
  return <LegalGateModal />
}

function LegalGateModal() {
  const t = useT()
  const lang = usePrefs((s) => s.language)
  const acceptLegal = usePrefs((s) => s.acceptLegal)
  const [checked, setChecked] = useState(false)
  const [declined, setDeclined] = useState(false)

  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto border bg-background p-6 shadow-lg sm:rounded-lg"
        >
          <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
            {t('legal.gate.title')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            {t('legal.gate.intro')}
          </DialogPrimitive.Description>

          <ul className="space-y-1.5 text-sm">
            {GATE_LINKS.map((link) => (
              <li key={link.name}>
                <ExtLink
                  href={link.url}
                  className="inline-flex items-center gap-1 font-medium hover:underline"
                >
                  {link.name}
                  <ExternalLinkIcon className="h-3 w-3 opacity-50" />
                </ExtLink>
                <span className="text-muted-foreground"> — {link.description}</span>
              </li>
            ))}
          </ul>

          {lang === 'vi' && (
            <p className="text-xs text-muted-foreground">
              <ExtLink href={LEGAL_VI_INDEX_URL} className="font-medium hover:underline">
                docs/i18n/vi/
              </ExtLink>{' '}
              — {t('legal.gate.viLink')}
            </p>
          )}

          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              className="mt-0.5"
            />
            <span>{t('legal.gate.checkboxLabel')}</span>
          </label>

          {declined && (
            <p className="text-sm text-destructive" role="alert">
              {t('legal.gate.declinedMsg')}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeclined(true)}>
              {t('legal.gate.decline')}
            </Button>
            <Button disabled={!checked} onClick={() => acceptLegal()}>
              {t('legal.gate.accept')}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
