import { describe, expect, it, vi } from 'vitest'
import { isTestSecret, siteverify, type SiteverifyInput } from './turnstile'

const input: SiteverifyInput = {
  secret: '0x4AAAAAAAreal-secret',
  token: 'tok',
  ip: '203.0.113.9',
  action: 'gate',
  hostname: 'freeitchgames.win',
}

const answer = (body: unknown) => vi.fn(async () => Response.json(body))
const run = (fetch: unknown, over: Partial<SiteverifyInput> = {}, timeoutMs?: number) =>
  siteverify({ ...input, ...over }, fetch as typeof globalThis.fetch, timeoutMs)

describe('siteverify', () => {
  it('accepts a token solved on our host for the same action', async () => {
    const fetch = answer({ success: true, hostname: 'freeitchgames.win', action: 'gate' })
    expect(await run(fetch)).toBe('ok')
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    const form = init.body as FormData
    expect([form.get('secret'), form.get('response'), form.get('remoteip')]).toEqual([input.secret, 'tok', '203.0.113.9'])
  })

  it('leaves remoteip out when the IP is unknown', async () => {
    const fetch = answer({ success: true, hostname: 'freeitchgames.win', action: 'gate' })
    await run(fetch, { ip: '' })
    expect(((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData).has('remoteip')).toBe(false)
  })

  it.each([
    ['a failed challenge', { success: false, 'error-codes': ['invalid-input-response'] }],
    ['a spent token', { success: false, 'error-codes': ['timeout-or-duplicate'] }],
    ['a token from another host', { success: true, hostname: 'evil.example', action: 'gate' }],
    ['a token for another action', { success: true, hostname: 'freeitchgames.win', action: 'suggest' }],
    ['a token without an action', { success: true, hostname: 'freeitchgames.win' }],
    ['a token without a hostname', { success: true, action: 'gate' }],
    ['a malformed answer', null],
  ])('rejects %s', async (_name, body) => {
    expect(await run(answer(body))).toBe('rejected')
  })

  it.each([
    ['a 5xx', () => new Response('bad gateway', { status: 502 })],
    ['a non-JSON body', () => new Response('<html>', { status: 200 })],
    ['a network error', () => Promise.reject(new TypeError('fetch failed'))],
    ['an internal error', () => Response.json({ success: false, 'error-codes': ['internal-error'] })],
    ['a refused secret key', () => Response.json({ success: false, 'error-codes': ['invalid-input-secret'] })],
  ])('reports %s as unavailable', async (_name, reply) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await run(vi.fn(async () => reply()))).toBe('unavailable')
  })

  it('gives up after the timeout', async () => {
    const fetch = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(init.signal?.reason))),
    )
    expect(await run(fetch, {}, 20)).toBe('unavailable')
  })

  it('skips the host and action checks for the test secrets', async () => {
    const fetch = answer({ success: true, hostname: 'example.com', action: '' })
    expect(await run(fetch, { secret: '1x0000000000000000000000000000000AA' })).toBe('ok')
    expect(await run(answer({ success: false }), { secret: '2x0000000000000000000000000000000AA' })).toBe('rejected')
  })
})

describe('isTestSecret', () => {
  it.each([
    ['1x0000000000000000000000000000000AA', true],
    ['2x0000000000000000000000000000000AA', true],
    ['3x0000000000000000000000000000000AA', true],
    ['0x4AAAAAAAreal-secret', false],
    ['1x0000000000000000000000000000000AB', false],
  ])('%s → %s', (secret, expected) => {
    expect(isTestSecret(secret)).toBe(expected)
  })
})
