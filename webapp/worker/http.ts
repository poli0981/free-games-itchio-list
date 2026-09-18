// Headers for responses the Worker builds itself (public/_headers only
// applies to static assets served straight from the assets store).
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS,
      ...headers,
    },
  })
}

/** A request the handler rejects; `status` + `error` become the JSON response. */
export class HttpError extends Error {
  readonly status: number
  readonly error: string

  constructor(status: number, error: string, message?: string) {
    super(message ?? error)
    this.status = status
    this.error = error
  }
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) {
    return json({ error: e.error, ...(e.message !== e.error ? { message: e.message } : {}) }, e.status)
  }
  console.error(e)
  return json({ error: 'internal_error' }, 500)
}

/**
 * The request body, refusing more than `maxBytes` while it streams in: a body
 * sent without Content-Length (chunked) is never buffered past the limit.
 */
export async function readBodyCapped(request: Request, maxBytes: number): Promise<Uint8Array> {
  const declared = request.headers.get('content-length')
  if (declared !== null && !(Number(declared) <= maxBytes)) throw new HttpError(413, 'payload_too_large')
  if (!request.body) return new Uint8Array()
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      reader.cancel().catch(() => {})
      throw new HttpError(413, 'payload_too_large')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

/**
 * Parse a JSON request body of at most `maxBytes`. The media type must be
 * exactly application/json: anything else (e.g. `text/plain; application/json`,
 * which browsers send cross-site without a preflight) is refused.
 */
export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (type !== 'application/json') throw new HttpError(415, 'unsupported_media_type', 'Send application/json')
  const bytes = await readBodyCapped(request, maxBytes)
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new HttpError(400, 'invalid_json')
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
