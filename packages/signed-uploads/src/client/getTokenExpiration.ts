import { base64urlDecode } from './base64url'

/**
 * Read `exp` out of a JWT without verifying it.
 *
 * A browser has no secret key and so can not verify anything; the Upload API is
 * the one that decides whether a token is genuine. This only decides when to
 * ask for the next one.
 *
 * Returns `undefined` for anything it can not read, which the caller must treat
 * as "no known expiry" rather than "expired".
 */
export const getTokenExpiration = (token: string): number | undefined => {
  const payload = token.split('.')[1]
  if (!payload) return undefined

  try {
    const claims: unknown = JSON.parse(base64urlDecode(payload))
    const exp =
      typeof claims === 'object' && claims !== null
        ? (claims as { exp?: unknown }).exp
        : undefined
    return typeof exp === 'number' ? exp : undefined
  } catch {
    return undefined
  }
}
