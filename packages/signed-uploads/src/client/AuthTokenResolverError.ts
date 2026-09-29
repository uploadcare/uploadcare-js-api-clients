/**
 * Your token function threw or rejected, so there is no token to send.
 *
 * This is the one auth failure that never reaches the Upload API: nothing was
 * requested, and retrying is pointless because the source of the token is your
 * own code. The original failure is kept on `cause`.
 */
export class AuthTokenResolverError extends Error {
  constructor(cause: unknown) {
    super(
      `Failed to resolve the auth token: ${
        cause instanceof Error ? cause.message : String(cause)
      }`
    )

    this.name = 'AuthTokenResolverError'
    // Assigned rather than passed to `super`, which needs Node 16.9; the
    // package supports the whole 16 line.
    this.cause = cause

    Object.setPrototypeOf(this, AuthTokenResolverError.prototype)
  }
}

/**
 * Wraps `cause` unless it is already wrapped, so a token function that is
 * itself an `AuthTokenCache.getToken` does not nest two of these.
 */
export const asAuthTokenResolverError = (
  cause: unknown
): AuthTokenResolverError =>
  cause instanceof AuthTokenResolverError
    ? cause
    : new AuthTokenResolverError(cause)
