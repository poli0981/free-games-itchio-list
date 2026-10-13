/**
 * Request limits of the admin API, shared with the admin app (webapp/admin),
 * which splits longer lists into batches of these sizes.
 */

/** URLs per add / check / queue decision (one commit each). */
export const MAX_URLS = 200
/** URLs per tracking request. */
export const MAX_TRACK_URLS = 500
/** Games per bulk removal or bulk edit (one commit each). */
export const MAX_BULK = 100
/** Characters of a removal reason (public, on the Removed page). */
export const MAX_REASON = 200
/** itch.io collections the cron follows. */
export const MAX_WATCHED = 50
/** Collection pages read per admin request. */
export const COLLECTION_PAGES_PER_READ = 10
