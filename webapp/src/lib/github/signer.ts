import type { PrivateKey } from 'openpgp'
import { useAuth } from '@/stores/auth'
import { useGpg } from '@/stores/gpg'
import { usePrefs } from '@/stores/prefs'

interface CommitIdentity {
  name: string
  email: string
}

export interface CommitSigner {
  identity: CommitIdentity
  /** Returns an armored detached PGP signature over the canonical commit object string. */
  sign: (canonical: string) => Promise<string>
}

/**
 * Resolve the author/committer identity. Priority:
 *   1. prefs override (user set name/email in Settings → Commit author)
 *   2. imported GPG key's primary UID (so signed commits Verify out of the box)
 *   3. GitHub user
 *   4. fallback string
 *
 * For GPG-signed commits to show as "Verified" on GitHub, the email MUST match a UID in the
 * uploaded public key — that's why we prefer the GPG key's email over the GitHub noreply.
 */
function resolveCommitIdentity(): CommitIdentity {
  const prefs = usePrefs.getState()
  const gpg = useGpg.getState()
  const user = useAuth.getState().user
  const gpgEmail = gpg.emails[0] ?? ''
  const name =
    prefs.authorName.trim() ||
    user?.name?.trim() ||
    user?.login ||
    'webapp'
  const email =
    prefs.authorEmail.trim() ||
    gpgEmail ||
    (user ? `${user.login}@users.noreply.github.com` : 'webapp@local')
  return { name, email }
}

function makeSigner(privateKey: PrivateKey): CommitSigner {
  return {
    identity: resolveCommitIdentity(),
    sign: async (canonical) => {
      const { signCommit } = await import('@/lib/gpg/sign')
      return signCommit(privateKey, canonical)
    },
  }
}

/**
 * Return a signer iff the user has imported a GPG key, unlocked it, and toggled signing on.
 * Each commit call site simply does `atomicCommit(o, changes, msg, getSignerIfEnabled())` — or
 * relies on `atomicCommit`'s default which itself calls this.
 */
export function getSignerIfEnabled(): CommitSigner | undefined {
  const gpg = useGpg.getState()
  if (!gpg.enabled || !gpg.privateKey) return undefined
  return makeSigner(gpg.privateKey)
}
