const GPG_KEY = 'webapp.gpg.encrypted'
const GPG_FINGERPRINT_KEY = 'webapp.gpg.fingerprint'
const GPG_UID_KEY = 'webapp.gpg.uid'
const GPG_EMAILS_KEY = 'webapp.gpg.emails'
const GPG_ENABLED_KEY = 'webapp.gpg.enabled'

export interface GpgMetadata {
  fingerprint: string
  uid: string
  emails: string[]
}

export function readEncryptedGpg(): string | null {
  return localStorage.getItem(GPG_KEY)
}

export function writeEncryptedGpg(packed: string): void {
  localStorage.setItem(GPG_KEY, packed)
}

export function clearEncryptedGpg(): void {
  localStorage.removeItem(GPG_KEY)
  localStorage.removeItem(GPG_FINGERPRINT_KEY)
  localStorage.removeItem(GPG_UID_KEY)
  localStorage.removeItem(GPG_EMAILS_KEY)
  localStorage.removeItem(GPG_ENABLED_KEY)
}

export function readGpgMetadata(): GpgMetadata | null {
  const fingerprint = localStorage.getItem(GPG_FINGERPRINT_KEY)
  const uid = localStorage.getItem(GPG_UID_KEY)
  if (!fingerprint) return null
  return { fingerprint, uid: uid ?? '', emails: readEmailsField() }
}

function readEmailsField(): string[] {
  const raw = localStorage.getItem(GPG_EMAILS_KEY)
  // Guard against legacy values written before the field existed (could be the literal
  // string "undefined" if a previous build did `localStorage.setItem(key, JSON.stringify(undefined))`).
  if (!raw || raw === 'undefined' || raw === 'null') return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((s): s is string => typeof s === 'string')
  } catch {
    // fall through
  }
  return []
}

export function writeGpgMetadata(meta: GpgMetadata): void {
  localStorage.setItem(GPG_FINGERPRINT_KEY, meta.fingerprint)
  localStorage.setItem(GPG_UID_KEY, meta.uid)
  localStorage.setItem(GPG_EMAILS_KEY, JSON.stringify(meta.emails ?? []))
}

export function readGpgEnabled(defaultValue: boolean = true): boolean {
  const raw = localStorage.getItem(GPG_ENABLED_KEY)
  if (raw === null) return defaultValue
  return raw === '1'
}

export function writeGpgEnabled(value: boolean): void {
  localStorage.setItem(GPG_ENABLED_KEY, value ? '1' : '0')
}
