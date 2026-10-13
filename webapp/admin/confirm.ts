/**
 * In-app confirmation (the browser's confirm() is blocking and unstyled; it
 * also does nothing in some webviews). `confirm()` resolves when the
 * maintainer answers the dialog that ConfirmDialog (admin/ui.tsx) shows.
 */
import { create } from 'zustand'

export interface ConfirmRequest {
  title: string
  body?: string
  action: string
  destructive?: boolean
}

interface ConfirmState {
  request: (ConfirmRequest & { resolve: (ok: boolean) => void }) | null
}

export const useConfirm = create<ConfirmState>(() => ({ request: null }))

export function confirm(request: ConfirmRequest): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirm.getState().request?.resolve(false)
    useConfirm.setState({ request: { ...request, resolve } })
  })
}

export function answer(ok: boolean): void {
  const pending = useConfirm.getState().request
  useConfirm.setState({ request: null })
  pending?.resolve(ok)
}
