import type { PrivateKey, Key } from 'openpgp'

type OpenPGP = typeof import('openpgp')

let mod: OpenPGP | null = null
async function load(): Promise<OpenPGP> {
  if (!mod) mod = await import('openpgp')
  return mod
}

export interface LoadedKey {
  key: PrivateKey
  fingerprint: string
  uid: string
  /** All UID emails from the key (primary first). For GitHub Verified, author email must match one. */
  emails: string[]
}

/**
 * Parse an armored private key and (if needed) decrypt it with the user-supplied GPG passphrase.
 *
 * Returns the decrypted PrivateKey suitable for signing, plus extracted metadata.
 */
export async function loadPrivateKey(
  armored: string,
  gpgPassphrase: string | null,
): Promise<LoadedKey> {
  const openpgp = await load()
  const raw = await openpgp.readPrivateKey({ armoredKey: armored })
  const key = raw.isDecrypted()
    ? raw
    : await openpgp.decryptKey({ privateKey: raw, passphrase: gpgPassphrase ?? '' })
  const fingerprint = key.getFingerprint().toUpperCase()
  const primaryUser = await key.getPrimaryUser()
  const uid = primaryUser.user.userID?.userID ?? ''
  const primaryEmail = primaryUser.user.userID?.email ?? ''
  const otherEmails = key.users
    .map((u) => u.userID?.email)
    .filter((e): e is string => !!e && e !== primaryEmail)
  const emails = primaryEmail ? [primaryEmail, ...otherEmails] : otherEmails
  return { key, fingerprint, uid, emails }
}

/**
 * Re-export an already-decrypted private key in armored form (so we can store it without the
 * original GPG passphrase wrapper, encrypted instead by the webapp's own AES-GCM passphrase).
 */
export async function armorPrivateKey(key: PrivateKey): Promise<string> {
  return key.armor()
}

/**
 * Produce a detached, armored PGP signature over the canonical commit object.
 *
 * Signs in BINARY mode (the same mode `gpg --detach-sign --armor` produces). Git/GitHub
 * verify signatures over the raw bytes of the commit object — using text mode here would
 * trigger OpenPGP's line-ending normalization and break verification on platforms where
 * LF/CRLF differ.
 *
 * The result is suitable for the `signature` field of GitHub's `POST /repos/.../git/commits`.
 */
export async function signCommit(key: PrivateKey, canonical: string): Promise<string> {
  const openpgp = await load()
  const binary = new TextEncoder().encode(canonical)
  const message = await openpgp.createMessage({ binary })
  const armored = await openpgp.sign({
    message,
    signingKeys: key,
    detached: true,
    format: 'armored',
  })
  return armored as string
}

/**
 * Round-trip verification: useful for the Settings "Test sign" button.
 * Pass the public half (exported via `key.toPublic().armor()`).
 */
export async function verifyDetached(
  publicKeyArmored: string,
  signedText: string,
  signatureArmored: string,
): Promise<boolean> {
  const openpgp = await load()
  const publicKey = (await openpgp.readKey({ armoredKey: publicKeyArmored })) as Key
  const binary = new TextEncoder().encode(signedText)
  const message = await openpgp.createMessage({ binary })
  const signature = await openpgp.readSignature({ armoredSignature: signatureArmored })
  const result = await openpgp.verify({ message, signature, verificationKeys: publicKey })
  try {
    await result.signatures[0]?.verified
    return true
  } catch {
    return false
  }
}
