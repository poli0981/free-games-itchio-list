import { describe, expect, it } from 'vitest'
import indexHtml from '../index.html?raw'
import { challengePage, crawlerUnavailable, gateCsp, pickLanguage, renderChallenge, SOCIAL_TAGS } from './gate-page'

const OPTIONS = { sitekey: '0x4AAA-site', ttlHours: 48 }

function page(path = '/games', init: RequestInit = {}) {
  return challengePage(new Request(`https://freeitchgames.win${path}`, init), OPTIONS)
}

function nonceOf(res: Response): string {
  const m = /'nonce-([^']+)'/.exec(res.headers.get('content-security-policy') ?? '')
  if (!m) throw new Error('no nonce in the CSP')
  return m[1]
}

describe('challengePage', () => {
  it('is a no-store, noindex HTML page with the security headers', () => {
    const res = page()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('cross-origin-opener-policy')).toBe('same-origin')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('etag')).toBeNull()
  })

  it('gives every response its own nonce, on each script it runs', async () => {
    const a = page()
    const b = page()
    expect(nonceOf(a)).not.toBe(nonceOf(b))
    const html = await a.text()
    expect(html.split(`nonce="${nonceOf(a)}"`)).toHaveLength(4) // head script, main script, Turnstile api.js
    expect(html).toContain('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&amp;onload=onGateTurnstile')
  })

  it('keeps host sources working (no strict-dynamic) and inline styles allowed (no style nonce)', () => {
    const csp = gateCsp('abc')
    expect(csp).not.toContain('strict-dynamic')
    expect(csp).toContain("style-src 'unsafe-inline'")
    expect(csp).toContain("script-src 'nonce-abc' https://challenges.cloudflare.com https://static.cloudflareinsights.com")
    expect(csp).toContain('frame-src https://challenges.cloudflare.com')
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('answers HEAD without a body', async () => {
    const res = page('/', { method: 'HEAD' })
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('')
  })

  it('never reflects the request path or query', async () => {
    const html = await page('/games/%3Cscript%3Ealert(1)%3C/script%3E?q=%3Cimg%20src%3Dx%3E').text()
    expect(html).not.toContain('alert(1)')
    expect(html).not.toContain('<img')
  })

  it('carries the og: and twitter: tags of index.html, so link previews keep working', () => {
    const tags = [...indexHtml.matchAll(/<meta (property|name)="((?:og|twitter):[^"]+)" content="([^"]*)"/g)].map(
      (m) => [m[1], m[2], m[3]],
    )
    expect(tags.length).toBeGreaterThan(10)
    expect(SOCIAL_TAGS).toEqual(tags)
  })

  it('embeds the site key as JSON and scripts that compile', () => {
    const html = renderChallenge('en', { ...OPTIONS, nonce: 'n' })
    const config = /<script type="application\/json" id="gate-config">([\s\S]*?)<\/script>/.exec(html)
    expect(JSON.parse(config?.[1] ?? '{}')).toMatchObject({ sitekey: '0x4AAA-site' })
    const scripts = [...html.matchAll(/<script nonce="n">([\s\S]*?)<\/script>/g)].map((m) => m[1])
    expect(scripts).toHaveLength(2)
    for (const source of scripts) expect(() => new Function(source)).not.toThrow()
  })

  it('renders both languages and picks the first one from Accept-Language', async () => {
    const vi = await challengePage(
      new Request('https://freeitchgames.win/', { headers: { 'accept-language': 'vi-VN,vi;q=0.9,en;q=0.8' } }),
      OPTIONS,
    ).text()
    expect(vi).toContain('<html lang="vi">')
    expect(vi).toContain('Kiểm tra nhanh trước khi vào trang')
    expect(vi).toContain('Quick check before you continue')
    expect(vi).toContain('48 giờ')
  })
})

describe('pickLanguage', () => {
  it.each([
    [null, 'en'],
    ['vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7', 'vi'],
    ['en-US,en;q=0.9,vi;q=0.8', 'en'],
    ['fr-FR,fr;q=0.9,vi;q=0.5', 'vi'],
    ['fr', 'en'],
    ['vi;q=0.2, en;q=0.9', 'en'],
  ])('%j → %s', (header, lang) => {
    expect(pickLanguage(header)).toBe(lang)
  })
})

describe('crawlerUnavailable', () => {
  it('is a temporary 503 (not a noindex page), so a broken bypass never de-indexes the site', () => {
    const res = crawlerUnavailable(new Request('https://freeitchgames.win/games'))
    expect(res.status).toBe(503)
    expect(res.headers.get('retry-after')).toBe('3600')
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('x-robots-tag')).toBeNull()
  })
})
