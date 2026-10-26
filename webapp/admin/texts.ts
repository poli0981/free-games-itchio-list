/** The admin's wording for API errors, skip reasons and outcomes (the admin is English only). */
import { ApiError, SessionExpired } from './api'

export const PUBLISH_NOTE = 'The public site shows it after the next build (a few minutes).'

/** Every error code the Worker's admin API can answer (admin/texts.test.ts checks that none is missing). */
export const ERROR_TEXT: Record<string, string> = {
  forbidden: 'This account is not allowed to use the admin.',
  not_configured: 'The admin is not configured yet (Cloudflare Access / D1).',
  github_not_configured: 'Writes are off: the GitHub App is not configured.',
  github_error: 'GitHub refused the change.',
  network_error: 'The server could not be reached. Check the connection and try again.',
  internal_error: 'Something went wrong on the server.',
  rate_limited: 'Too many requests from this connection. Wait a minute, then try again.',
  not_found: 'Not found.',
  invalid_body: 'The request was malformed.',
  invalid_json: 'The request was malformed.',
  unsupported_media_type: 'The request was malformed.',
  payload_too_large: 'Too much at once: send fewer games per request.',
  too_many_urls: 'Too many URLs in one request.',
  too_many_edits: 'Too many games in one bulk edit.',
  invalid_url: 'Not an itch.io game URL.',
  invalid_status: 'Unknown queue status.',
  invalid_action: 'Unknown queue action.',
  invalid_edit: 'Only the virus check, 18+ and notes can be changed, with allowed values.',
  invalid_reason: 'A reason is required (200 characters at most).',
  not_in_catalog: 'That game is not in the catalog (any more).',
  needs_override: 'Previously removed: approve with override.',
  invalid_settings: 'Those settings are not valid.',
  invalid_collection_url: 'Not an itch.io collection URL (https://itch.io/c/<id>/<name>).',
  collection_unavailable: 'itch.io has no such collection, or it is not public.',
  collection_unreadable: 'itch.io answered, but its page could not be read: its markup may have changed.',
  collection_exists: 'That collection is already followed.',
  too_many_collections: 'No more collections can be followed.',
  itch_rate_limited: 'itch.io asks to slow down.',
  itch_error: 'itch.io could not be reached.',
}

export function errorText(e: unknown): string {
  if (e instanceof SessionExpired) return e.message
  if (e instanceof ApiError) {
    const known = ERROR_TEXT[e.code] ?? `Error: ${e.code.replace(/_/g, ' ')}.`
    // The server's message adds the specifics (which field, how long to wait…).
    return e.message && e.message !== e.code ? `${known}\n${e.message}` : known
  }
  return e instanceof Error ? e.message : String(e)
}

/** Why an approval skipped a URL. */
export const SKIP_TEXT: Record<string, string> = {
  not_in_queue: 'not in the queue',
  already_queued: 'already queued',
  already_ingested: 'already in the catalog',
  needs_override: 'removed before: needs override',
}

/** How a queued game's ingest ended (the pipeline's outcomes, or the cron's timeout). */
export const INGEST_TEXT: Record<string, string> = {
  added: 'added',
  duplicate: 'already in the catalog',
  paid: 'paid: not added',
  dead: 'page gone',
  private: 'password-protected',
  deleted: 'removed before: blocked',
  gave_up: 'failed 3 times: given up',
  timeout: 'no result within 3 days',
}

export const WARNING_TEXT: Record<string, string> = {
  covers_failed: 'the resized covers could not be deleted (they expire from the cache on their own)',
  audit_failed: 'the activity log entry could not be written',
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`
}

export function when(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}
