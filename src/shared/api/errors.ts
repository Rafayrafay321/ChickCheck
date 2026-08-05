// ─── Normalized Error Type ──────────────────────────────────────
// Every API failure (network, timeout, HTTP error, app-level { success: false })
// becomes an ApiError. This gives TanStack Query a single error shape to catch.

export class ApiError extends Error {
  override readonly name = 'ApiError'

  constructor(
    /** HTTP status code (0 for network failures, 408 for timeouts) */
    public readonly statusCode: number,
    /** Original error body from the server, if any */
    public readonly errorBody: unknown,
    message: string
  ) {
    super(message)
  }

  /** Quick check for auth failures — useful for global logout logic */
  get isUnauthorized(): boolean {
    return this.statusCode === 401
  }

  /** Quick check for "not found" — useful for redirect logic */
  get isNotFound(): boolean {
    return this.statusCode === 404
  }
}
