const PBKDF2_ITERATIONS = 100_000
const SALT_LEN = 16
const IV_LEN = 12

async function deriveKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function bytesToBase64(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function encryptString(plaintext: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = new Uint8Array(SALT_LEN)
  crypto.getRandomValues(salt)
  const iv = new Uint8Array(IV_LEN)
  crypto.getRandomValues(iv)
  const key = await deriveKey(passphrase, salt)
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  )
  const ciphertext = new Uint8Array(ciphertextBuf)
  const buf = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength)
  buf.set(salt, 0)
  buf.set(iv, salt.byteLength)
  buf.set(ciphertext, salt.byteLength + iv.byteLength)
  return bytesToBase64(buf)
}

export async function decryptString(packed: string, passphrase: string): Promise<string> {
  const buf = base64ToBytes(packed)
  if (buf.byteLength <= SALT_LEN + IV_LEN) throw new Error('Invalid ciphertext')
  const salt = buf.slice(0, SALT_LEN)
  const iv = buf.slice(SALT_LEN, SALT_LEN + IV_LEN)
  const ciphertext = buf.slice(SALT_LEN + IV_LEN)
  const key = await deriveKey(passphrase, salt)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plain)
}
