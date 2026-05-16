export interface CommitIdentity {
  name: string
  email: string
}

export interface CommitParts {
  tree: string
  parents: string[]
  author: CommitIdentity
  committer: CommitIdentity
  /** Unix timestamp in seconds. Use the same value for both Octokit's `date` and this canonical form. */
  ts: number
  /** Minutes east of UTC. Use `-new Date().getTimezoneOffset()` (JS returns minutes west). */
  tzOffsetMin: number
  message: string
}

function fmtTzCompact(offsetMin: number): string {
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${sign}${hh}${mm}`
}

function fmtTzColon(offsetMin: number): string {
  if (offsetMin === 0) return 'Z'
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${sign}${hh}:${mm}`
}

export function isoFromTs(ts: number, tzOffsetMin: number): string {
  const shiftedMs = ts * 1000 + tzOffsetMin * 60 * 1000
  const iso = new Date(shiftedMs).toISOString().slice(0, 19)
  return `${iso}${fmtTzColon(tzOffsetMin)}`
}

/**
 * Build the canonical Git commit object string for signing.
 *
 * Format (no `gpgsig` header — this is the *detached* signing target):
 *
 *   tree <sha>\n
 *   parent <sha>\n   (one line per parent)
 *   author <name> <<email>> <unix_ts> <±HHMM>\n
 *   committer <name> <<email>> <unix_ts> <±HHMM>\n
 *   \n
 *   <message>
 *
 * IMPORTANT: the message portion is used EXACTLY as provided — no trailing newline is added.
 * GitHub stores the commit message verbatim (observed via `git cat-file -p`: webapp + CI commits
 * end with the last byte of the message, no trailing \n). Adding \n here would make our signed
 * canonical differ from GitHub's recomputed canonical, breaking signature verification.
 *
 * The caller is responsible for passing the same message string to both this function and
 * `octokit.git.createCommit({ message })` so the two byte streams match.
 */
export function buildCommitObject(p: CommitParts): string {
  const tz = fmtTzCompact(p.tzOffsetMin)
  const a = `${p.author.name} <${p.author.email}> ${p.ts} ${tz}`
  const c = `${p.committer.name} <${p.committer.email}> ${p.ts} ${tz}`
  const lines = [`tree ${p.tree}`]
  for (const parent of p.parents) lines.push(`parent ${parent}`)
  lines.push(`author ${a}`)
  lines.push(`committer ${c}`)
  const head = lines.join('\n')
  return `${head}\n\n${p.message}`
}

export function currentTzOffsetMin(): number {
  return -new Date().getTimezoneOffset()
}
