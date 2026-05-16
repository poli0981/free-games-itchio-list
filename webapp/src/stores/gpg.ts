import { create } from 'zustand'
import type { PrivateKey } from 'openpgp'
import {
  clearEncryptedGpg,
  readEncryptedGpg,
  readGpgEnabled,
  readGpgMetadata,
  writeGpgEnabled,
  writeGpgMetadata,
} from '@/lib/gpg/storage'

interface GpgState {
  hasStoredGpg: boolean
  enabled: boolean
  fingerprint: string | null
  uid: string | null
  /** All UID emails from the key, primary first. Persisted so the warning works after reload. */
  emails: string[]
  /** In-memory only — cleared on lock or page refresh. */
  privateKey: PrivateKey | null
  setKey: (key: PrivateKey, fingerprint: string, uid: string, emails: string[]) => void
  lock: () => void
  remove: () => void
  setEnabled: (v: boolean) => void
  refreshStoredFlag: () => void
}

const initialStored = typeof localStorage !== 'undefined' ? !!readEncryptedGpg() : false
const initialMeta = typeof localStorage !== 'undefined' ? readGpgMetadata() : null
const initialEnabled = typeof localStorage !== 'undefined' ? readGpgEnabled() : false

export const useGpg = create<GpgState>()((set) => ({
  hasStoredGpg: initialStored,
  enabled: initialEnabled,
  fingerprint: initialMeta?.fingerprint ?? null,
  uid: initialMeta?.uid ?? null,
  emails: initialMeta?.emails ?? [],
  privateKey: null,
  setKey: (privateKey, fingerprint, uid, emails) => {
    writeGpgMetadata({ fingerprint, uid, emails })
    set({ privateKey, fingerprint, uid, emails, hasStoredGpg: true })
  },
  lock: () => set({ privateKey: null }),
  remove: () => {
    clearEncryptedGpg()
    set({
      privateKey: null,
      hasStoredGpg: false,
      enabled: false,
      fingerprint: null,
      uid: null,
      emails: [],
    })
  },
  setEnabled: (v) => {
    writeGpgEnabled(v)
    set({ enabled: v })
  },
  refreshStoredFlag: () => set({ hasStoredGpg: !!readEncryptedGpg() }),
}))
