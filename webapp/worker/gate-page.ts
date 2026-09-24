/**
 * The verification page of the bot gate (gate.ts). Self-contained: inline CSS
 * and scripts, system fonts, the logo inline — nothing of the app loads before
 * the visitor passes. Built by the Worker, so it sets its own security headers
 * (public/_headers only covers static assets).
 *
 * Status 200 with noindex: link-preview bots still read the site's og: tags,
 * search engines don't index the page. Verified crawlers never see it (gate.ts);
 * anything else that claims to be a search crawler gets a 503 instead, so a
 * broken bypass rule makes the site look briefly down to Google, not noindexed.
 */
import { PAGE_HEADERS } from './http'

type Lang = 'en' | 'vi'

const PRIVACY = {
  en: 'https://github.com/poli0981/free-games-itchio-list/blob/main/docs/PrivacyPolicy.md',
  vi: 'https://github.com/poli0981/free-games-itchio-list/blob/main/docs/i18n/vi/PrivacyPolicy.md',
}

// Static text of the page, both languages rendered, CSS shows the one in <html lang>.
const TEXT = {
  heading: { en: 'Quick check before you continue', vi: 'Kiểm tra nhanh trước khi vào trang' },
  lead: {
    en: 'Free Itch Games uses Cloudflare Turnstile to keep automated traffic out. It usually finishes by itself in a few seconds.',
    vi: 'Free Itch Games dùng Cloudflare Turnstile để chặn truy cập tự động. Thường chỉ mất vài giây và tự hoàn tất.',
  },
  note: {
    en: 'This browser will not be asked again for {hours} hours.',
    vi: 'Trình duyệt này sẽ không phải kiểm tra lại trong {hours} giờ.',
  },
  privacy: { en: 'Privacy Policy', vi: 'Chính sách quyền riêng tư' },
  retry: { en: 'Try again', vi: 'Thử lại' },
  noscript: {
    en: 'Please enable JavaScript: the site and this check need it.',
    vi: 'Vui lòng bật JavaScript: trang web và bước kiểm tra này cần nó.',
  },
}

// Messages the script shows while and after checking.
const STATUS: Record<Lang, Record<string, string>> = {
  en: {
    working: 'Verifying…',
    done: 'Verified. Loading the site…',
    failed: 'The check did not pass. Please try again.',
    unavailable: 'The verification service is not responding. Try again in a minute.',
    limited: 'Too many attempts. Wait a minute, then try again.',
    cookies: 'Your browser blocked the cookie that remembers this check. Allow cookies for this site, then try again.',
    blocked:
      'The check could not load. If you use an ad or script blocker, allow challenges.cloudflare.com on this site.',
  },
  vi: {
    working: 'Đang xác minh…',
    done: 'Đã xác minh. Đang tải trang…',
    failed: 'Kiểm tra chưa thành công. Vui lòng thử lại.',
    unavailable: 'Dịch vụ xác minh chưa phản hồi. Hãy thử lại sau một phút.',
    limited: 'Thử quá nhiều lần. Đợi một phút rồi thử lại.',
    cookies: 'Trình duyệt đã chặn cookie ghi nhớ bước kiểm tra này. Hãy cho phép cookie cho trang này rồi thử lại.',
    blocked:
      'Không tải được bước kiểm tra. Nếu bạn dùng trình chặn quảng cáo hoặc script, hãy cho phép challenges.cloudflare.com trên trang này.',
  },
}

const TITLE: Record<Lang, string> = { en: 'Verifying — Free Itch Games', vi: 'Đang xác minh — Free Itch Games' }

/** The site-wide og:/twitter: tags of index.html (gate-page.test.ts keeps them equal). */
export const SOCIAL_TAGS: ReadonlyArray<readonly ['property' | 'name', string, string]> = [
  ['property', 'og:type', 'website'],
  ['property', 'og:site_name', 'Free Itch Games'],
  ['property', 'og:title', 'Free Itch Games'],
  ['property', 'og:description', 'A curated, auto-updating catalog of 2,600+ free games on itch.io. Browse, filter, and analyze.'],
  ['property', 'og:image', 'https://freeitchgames.win/og.png'],
  ['property', 'og:image:type', 'image/png'],
  ['property', 'og:image:width', '1200'],
  ['property', 'og:image:height', '630'],
  ['property', 'og:image:alt', 'Free Itch Games — 2,600+ free itch.io games, kept fresh'],
  ['property', 'og:locale', 'en_US'],
  ['property', 'og:locale:alternate', 'vi_VN'],
  ['name', 'twitter:card', 'summary_large_image'],
  ['name', 'twitter:site', '@SkullMute0011'],
  ['name', 'twitter:creator', '@SkullMute0011'],
  ['name', 'twitter:title', 'Free Itch Games'],
  ['name', 'twitter:description', 'A curated, auto-updating catalog of 2,600+ free games on itch.io.'],
  ['name', 'twitter:image', 'https://freeitchgames.win/og.png'],
]

const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#7c5cff"/><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="#fff" transform="translate(7.375 7) scale(.75)"/></svg>'

const CSS = `
:root{--bg:#fafaf9;--fg:#17171a;--card:#fff;--border:#e4e4e0;--muted:#5e5e66;--primary:#7c5cff;--danger:#dc2626;--ok:#16a34a;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not(.light){--bg:#0b0b0c;--fg:#ededef;--card:#111114;--border:#232328;--muted:#9b9ba4;--danger:#ef4444;--ok:#22c55e;color-scheme:dark}}
:root.dark{--bg:#0b0b0c;--fg:#ededef;--card:#111114;--border:#232328;--muted:#9b9ba4;--danger:#ef4444;--ok:#22c55e;color-scheme:dark}
html[lang=en] [lang=vi],html[lang=vi] [lang=en]{display:none}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}
main{width:100%;max-width:440px;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:28px}
.brand{display:flex;align-items:center;gap:10px;font-weight:600;margin-bottom:22px}
.brand svg{width:28px;height:28px}
h1{font-size:20px;line-height:1.3;margin:0 0 8px;letter-spacing:-.01em}
.lead{margin:0 0 20px;color:var(--muted)}
.widget{min-height:65px}
.status{min-height:1.55em;margin:12px 0 0;font-size:14px;color:var(--muted)}
.status.error{color:var(--danger)}
.status.ok{color:var(--ok)}
button{margin-top:12px;font:inherit;font-size:14px;font-weight:500;padding:8px 16px;border:0;border-radius:8px;background:var(--primary);color:#fff;cursor:pointer}
button:focus-visible,a:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
.foot{margin:22px 0 0;padding-top:16px;border-top:1px solid var(--border);font-size:12.5px;color:var(--muted)}
.foot a{color:inherit;text-underline-offset:2px}
`

// Before first paint: the app's saved theme and language (stores/theme.ts, stores/prefs.ts).
const HEAD_SCRIPT = `(function(){var r=document.documentElement,t='system',l=null;
try{t=JSON.parse(localStorage.getItem('webapp.theme')).state.theme||t}catch(e){}
try{l=JSON.parse(localStorage.getItem('webapp.prefs')).state.language}catch(e){}
var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
r.classList.add(d?'dark':'light');
if(l==='en'||l==='vi'){r.lang=l;document.title=${JSON.stringify(TITLE).replace(/</g, '\\u003c')}[l]}})();`

// The check itself: render the widget, trade its token for the cookie, make
// sure the cookie stuck, then reload into the page that was asked for.
const MAIN_SCRIPT = `(function(){
var cfg=JSON.parse(document.getElementById('gate-config').textContent);
var root=document.documentElement,status=document.getElementById('status'),retry=document.getElementById('retry');
var widget=null,loaded=false;
function say(key,tone){status.textContent=key?cfg.text[root.lang==='vi'?'vi':'en'][key]:'';status.className='status'+(tone?' '+tone:'')}
function fail(key){say(key,'error');retry.hidden=false}
function check(){return fetch('/api/verify',{credentials:'same-origin',cache:'no-store'}).then(function(r){return r.json()})}
function enter(ttl){
try{localStorage.setItem('webapp.gate',JSON.stringify({until:Date.now()+ttl*1000}))}catch(e){}
say('done','ok');location.reload()}
function verify(token){
say('working');retry.hidden=true;
fetch('/api/verify',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token})})
.then(function(r){
if(!r.ok){fail(r.status===429?'limited':r.status===503?'unavailable':'failed');return}
return r.json().then(function(b){return check().then(function(s){if(s.valid)enter(b.ttl);else fail('cookies')})})})
.catch(function(){fail('unavailable')})}
window.onGateTurnstile=function(){
if(loaded)return;
loaded=true;say('');retry.hidden=true;
widget=window.turnstile.render('#widget',{sitekey:cfg.sitekey,action:'gate',
theme:root.classList.contains('dark')?'dark':'light',language:root.lang==='vi'?'vi':'en',
appearance:'always',size:'flexible',callback:verify,
'error-callback':function(){fail('failed')},
'expired-callback':function(){window.turnstile.reset(widget)},
'timeout-callback':function(){window.turnstile.reset(widget)}})};
retry.addEventListener('click',function(){
retry.hidden=true;say('');
if(window.turnstile&&widget!==null)window.turnstile.reset(widget);else location.reload()});
setTimeout(function(){if(!loaded)fail('blocked')},10000);
window.addEventListener('storage',function(e){
if(e.key==='webapp.gate')check().then(function(s){if(s.valid)location.reload()}).catch(function(){})});
})();`

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onGateTurnstile'

const ATTR_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
function esc(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ATTR_ESCAPES[c])
}

function both(pair: Record<Lang, string>, vars: Record<string, string> = {}): string {
  const fill = (s: string) => esc(s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`))
  return `<span lang="en">${fill(pair.en)}</span><span lang="vi">${fill(pair.vi)}</span>`
}

/** The visitor's language for the first paint, from Accept-Language (the script then prefers the app's setting). */
export function pickLanguage(acceptLanguage: string | null): Lang {
  const ranked = (acceptLanguage ?? '')
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';')
      const q = params.map((p) => /^\s*q=([\d.]+)\s*$/.exec(p)?.[1]).find(Boolean)
      return { lang: tag.split('-')[0], q: q === undefined ? 1 : Number(q), i }
    })
    .filter((e) => e.lang === 'en' || e.lang === 'vi')
    .sort((a, b) => b.q - a.q || a.i - b.i)
  return ranked[0]?.lang === 'vi' ? 'vi' : 'en'
}

/**
 * CSP of the page. No 'strict-dynamic': it would switch off the host sources,
 * and the Web Analytics beacon the zone injects into every HTML response has no
 * nonce. No nonce in style-src either: it would disable 'unsafe-inline', which
 * the page's and Turnstile's style attributes need.
 */
export function gateCsp(nonce: string): string {
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' https://challenges.cloudflare.com https://static.cloudflareinsights.com`,
    "style-src 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self' https://cloudflareinsights.com",
    'frame-src https://challenges.cloudflare.com',
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ')
}

function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
}

export interface ChallengeOptions {
  sitekey: string
  ttlHours: number
  /** Tests pass a fixed one; otherwise a fresh random nonce per response. */
  nonce?: string
}

/** The HTML of the page; never includes anything from the request but its language. */
export function renderChallenge(lang: Lang, opts: ChallengeOptions & { nonce: string }): string {
  const hours = String(opts.ttlHours)
  const config = JSON.stringify({ sitekey: opts.sitekey, text: STATUS }).replace(/</g, '\\u003c')
  const social = SOCIAL_TAGS.map(([attr, key, content]) => `<meta ${attr}="${key}" content="${esc(content)}">`).join('\n')
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#0b0b0c" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#fafaf9" media="(prefers-color-scheme: light)">
<title>${esc(TITLE[lang])}</title>
${social}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>${CSS}</style>
<script nonce="${opts.nonce}">${HEAD_SCRIPT}</script>
</head>
<body>
<main>
<div class="brand">${LOGO}<span>Free Itch Games</span></div>
<h1>${both(TEXT.heading)}</h1>
<p class="lead">${both(TEXT.lead)}</p>
<div id="widget" class="widget"></div>
<p id="status" class="status" role="status" aria-live="polite"></p>
<button id="retry" type="button" hidden>${both(TEXT.retry)}</button>
<noscript><p class="status error">${both(TEXT.noscript)}</p></noscript>
<p class="foot">${both(TEXT.note, { hours })} <a lang="en" href="${PRIVACY.en}" rel="noopener">${esc(TEXT.privacy.en)}</a><a lang="vi" href="${PRIVACY.vi}" rel="noopener">${esc(TEXT.privacy.vi)}</a></p>
</main>
<script type="application/json" id="gate-config">${config}</script>
<script nonce="${opts.nonce}">${MAIN_SCRIPT}</script>
<script nonce="${opts.nonce}" src="${esc(TURNSTILE_SRC)}" async defer></script>
</body>
</html>
`
}

/** The verification page for an app page request that has not passed yet. */
export function challengePage(request: Request, opts: ChallengeOptions): Response {
  const nonce = opts.nonce ?? newNonce()
  const lang = pickLanguage(request.headers.get('accept-language'))
  return new Response(request.method === 'HEAD' ? null : renderChallenge(lang, { ...opts, nonce }), {
    status: 200,
    headers: {
      ...PAGE_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Content-Security-Policy': gateCsp(nonce),
    },
  })
}

/** For a client that claims to be a search crawler but did not come through the verified-bot rule. */
export function crawlerUnavailable(request: Request): Response {
  return new Response(request.method === 'HEAD' ? null : 'Temporarily unavailable. Please retry later.\n', {
    status: 503,
    headers: {
      ...PAGE_HEADERS,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': '3600',
    },
  })
}
