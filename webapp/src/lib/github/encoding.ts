/**
 * Base64 ↔ UTF-8 helpers for the GitHub Contents API.
 *
 * GitHub returns file content as a newline-padded base64 string. Decoding it with `atob` alone
 * yields a binary string in Latin-1 — multi-byte UTF-8 sequences (Vietnamese, Chinese, emoji…)
 * become mojibake when JSON.parse later treats those bytes as code points. Always go through
 * `TextDecoder('utf-8')` on the read side and `TextEncoder` on the write side.
 */

export function base64ToUtf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

export function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}
