import { useState, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ArrowUpRight } from 'lucide-react'
import { ExtLink } from '@/components/ext-link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LEGAL_LINKS, LEGAL_VI_INDEX_URL } from '@/lib/about'
import { useT, type MessageKey } from '@/lib/i18n'
import { isTauri } from '@/lib/runtime'
import { usePrefs, LEGAL_VERSION } from '@/stores/prefs'

/**
 * First-visit legal gate: a non-dismissible overlay. On the website the page
 * renders behind it (a deep link lands where it pointed once accepted; its
 * data and covers come from this site). The apps load covers straight from
 * itch.io, so there nothing behind the gate loads until it is accepted.
 * Radix Dialog provides the focus trap, aria-modal and hides the rest of the
 * page from assistive technology while it is open. It re-appears whenever
 * `LEGAL_VERSION` changes.
 */

// The documents being accepted — URLs come from about.ts, never hardcoded.
const GATE_LINKS = LEGAL_LINKS.filter((l) => l.inGate && (!l.appOnly || isTauri()))

// Translated title and one-line summary per document (about.ts keeps the English names).
const DOC_TEXT: Record<string, { name: MessageKey; desc: MessageKey }> = {
  'Terms of Use': { name: 'legal.doc.terms.name', desc: 'legal.doc.terms.desc' },
  'Privacy Policy': { name: 'legal.doc.privacy.name', desc: 'legal.doc.privacy.desc' },
  Disclaimer: { name: 'legal.doc.disclaimer.name', desc: 'legal.doc.disclaimer.desc' },
  EULA: { name: 'legal.doc.eula.name', desc: 'legal.doc.eula.desc' },
  'Licenses & notice': { name: 'legal.doc.licenses.name', desc: 'legal.doc.licenses.desc' },
}

export function LegalGate({ children }: { children: ReactNode }) {
  const accepted = usePrefs((s) => s.acceptedLegalVersion)
  if (accepted === LEGAL_VERSION) return <>{children}</>
  if (isTauri()) return <LegalGateDialog />
  return (
    <>
      {children}
      <LegalGateDialog />
    </>
  )
}

function LegalGateDialog() {
  const t = useT()
  const lang = usePrefs((s) => s.language)
  const acceptLegal = usePrefs((s) => s.acceptLegal)
  const [checked, setChecked] = useState(false)

  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[92dvh] w-[calc(100%-2rem)] max-w-[540px] -translate-x-1/2 -translate-y-1/2 flex-col gap-[18px] overflow-y-auto rounded-2xl border bg-popover p-6 text-popover-foreground shadow-2xl sm:p-7"
        >
          <div className="space-y-2">
            <DialogPrimitive.Title className="text-[22px] font-semibold tracking-tight">
              {t('legal.gate.title')}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm leading-relaxed text-muted-foreground">
              {t('legal.gate.intro')}
            </DialogPrimitive.Description>
          </div>

          <ul className="overflow-hidden rounded-xl border">
            {GATE_LINKS.map((link) => {
              const text = DOC_TEXT[link.name]
              return (
                <li key={link.name} className="border-b last:border-b-0">
                  <ExtLink href={link.url} className="flex items-center gap-3 px-3.5 py-3 hover:bg-accent">
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">{text ? t(text.name) : link.name}</span>
                      <span className="text-[13px] text-muted-foreground">
                        {text ? t(text.desc) : link.description}
                      </span>
                    </span>
                    <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </ExtLink>
                </li>
              )
            })}
          </ul>

          {lang === 'vi' && (
            <p className="text-xs text-muted-foreground">
              <ExtLink href={LEGAL_VI_INDEX_URL} className="font-medium underline-offset-4 hover:underline">
                docs/i18n/vi/
              </ExtLink>{' '}
              — {t('legal.gate.viLink')}
            </p>
          )}

          <label className="flex items-start gap-2.5 text-sm leading-normal">
            <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5 size-[18px]" />
            <span>{t('legal.gate.checkboxLabel')}</span>
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {/* In the apps a link would replace the app itself; closing it is the way out there. */}
            {!isTauri() && (
              <Button variant="ghost" asChild>
                <a href="https://itch.io">{t('legal.gate.leave')}</a>
              </Button>
            )}
            <Button disabled={!checked} onClick={() => acceptLegal()}>
              {t('legal.gate.accept')}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
