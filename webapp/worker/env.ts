/**
 * Secrets live only in Cloudflare (`wrangler secret put`, or .dev.vars for
 * `wrangler dev`) and are typed here instead of in the generated
 * worker-configuration.d.ts (`npm run cf:types` ignores .dev.vars, so the
 * committed file never depends on who generated it). They are optional at
 * runtime: a route whose configuration is incomplete answers 503.
 */
interface Secrets {
  GH_APP_PRIVATE_KEY?: string // GitHub App PEM (PKCS#1 as downloaded, or PKCS#8)
  ADMIN_EMAILS?: string // comma-separated maintainer emails
  TURNSTILE_SECRET?: string
  /** 32+ random characters: signs the verification-gate cookie (gate.ts). */
  GATE_SECRET?: string
  /** 32+ random characters: the value the zone's Transform Rule sends for verified bots (gate.ts). */
  GATE_BOT_TOKEN?: string
  /** Local `wrangler dev` only (admin without Access); ignored off localhost. */
  DEV_ADMIN_EMAIL?: string
}

export type WorkerEnv = Env & Secrets

/** Names of the settings in `keys` that are empty or unset. */
export function missingConfig<K extends keyof WorkerEnv>(env: WorkerEnv, keys: readonly K[]): K[] {
  return keys.filter((k) => !env[k])
}

export const ACCESS_CONFIG = ['ACCESS_TEAM_DOMAIN', 'SITE_ORIGIN'] as const
export const GITHUB_CONFIG = ['GITHUB_REPO', 'GH_APP_ID', 'GH_APP_INSTALLATION_ID', 'GH_APP_PRIVATE_KEY'] as const
