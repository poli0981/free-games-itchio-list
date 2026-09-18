import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import { useNsfwPrompt } from '@/lib/nsfw'
import { usePrefs } from '@/stores/prefs'

/** The 18+ age confirmation; opened with requestNsfw() from lib/nsfw.ts. */
export function NsfwDialog() {
  const t = useT()
  const open = useNsfwPrompt((s) => s.open)
  const setShowNsfw = usePrefs((s) => s.setShowNsfw)
  const close = () => useNsfwPrompt.setState({ open: false })

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl border bg-popover p-6 text-popover-foreground shadow-2xl">
          <div className="space-y-2">
            <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
              {t('nsfw.dialog.title')}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm leading-relaxed text-muted-foreground">
              {t('nsfw.confirm')}
            </DialogPrimitive.Description>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                setShowNsfw(true)
                close()
              }}
            >
              {t('nsfw.dialog.confirm')}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
