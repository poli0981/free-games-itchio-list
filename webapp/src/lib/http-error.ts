/**
 * Typed HTTP error so UI layers can map a real status code to an error page.
 * `fetchRaw` throws this; Octokit's RequestError already carries `.status`.
 */
export class HttpError extends Error {
  readonly status: number
  readonly url?: string

  constructor(status: number, message: string, url?: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.url = url
  }
}

/** Extract an HTTP status code from any thrown value, if one exists. */
export function errorStatus(err: unknown): number | undefined {
  if (err instanceof HttpError) return err.status
  if (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number'
  ) {
    // Octokit RequestError (and friends) shape
    return (err as { status: number }).status
  }
  return undefined
}

/** fetch() rejects with a TypeError when the network itself is unreachable. */
export function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError
}
