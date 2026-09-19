import { UploadError } from './UploadError'

/**
 * The `authToken` resolver threw or rejected, so there is no token to send.
 *
 * This is the one auth failure that never reaches the server: nothing was
 * requested, `code` stays empty, and retrying is pointless because the resolver
 * is the caller's own code. The original failure is kept on `cause`.
 */
export class AuthTokenResolverError extends UploadError {
  constructor(cause: unknown) {
    super(
      `Failed to resolve the auth token: ${
        cause instanceof Error ? cause.message : String(cause)
      }`
    )

    this.name = 'AuthTokenResolverError'
    this.cause = cause

    Object.setPrototypeOf(this, AuthTokenResolverError.prototype)
  }
}
