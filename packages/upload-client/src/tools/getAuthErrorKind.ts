import { UploadError } from './UploadError'

export type AuthErrorKind =
  | 'token-expired'
  | 'quota-exhausted'
  | 'scope-denied'
  | 'token-invalid'

/**
 * Classifies an error thrown by the client into an actionable JWT auth error
 * kind, or `null` for anything else (transport errors, non-auth server errors).
 * `token-expired` is the only kind worth refreshing the token and retrying for;
 * the rest are final.
 */
export const getAuthErrorKind = (error: unknown): AuthErrorKind | null => {
  if (!(error instanceof UploadError)) {
    return null
  }
  switch (error.code) {
    case 'JwtTokenExpiredError':
      return 'token-expired'
    case 'JwtQuotaExceededError':
      return 'quota-exhausted'
    case 'JwtScopeDeniedError':
      return 'scope-denied'
    case 'JwtInvalidError':
      return 'token-invalid'
    default:
      return null
  }
}
