/**
 * Browser half of signed uploads: holds a token minted elsewhere and fetches a
 * new one before it expires. Nothing here touches the secret key.
 */

/** Fetches a freshly minted token, usually from your own backend. */
export type FetchAuthToken = () => string | Promise<string>

export type AuthTokenCacheOptions = {
  fetchToken: FetchAuthToken
  /**
   * Seconds before `exp` at which a token is treated as stale. Defaults to 30,
   * matching the Upload API's own clock leeway.
   */
  skew?: number
  /**
   * A token minted before the cache existed — typically server-rendered into
   * the page, so the first upload needs no round-trip.
   */
  initialToken?: string
}

const base64urlDecode = (segment: string) => {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Read `exp` out of a JWT without verifying it. A browser has no secret key
 * and so can not verify anything; the Upload API is the one that decides
 * whether a token is genuine. This only decides when to ask for the next one.
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

/**
 * Build the request headers a token authenticates with.
 *
 * Returns an empty object for an absent token, so it can be spread
 * unconditionally into a request that may or may not be authenticated.
 *
 * @example
 *   fetch(url, { headers: { ...getAuthHeaders(await tokens.getToken()) } })
 */
export const getAuthHeaders = (
  token: string | undefined
): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {})

/**
 * Caches an Upload API auth token and replaces it before it expires.
 *
 * Pass `getToken` straight to `@uploadcare/upload-client` as `authToken`; it is
 * bound, and the client calls it before every request.
 *
 * @example
 *   const tokens = new AuthTokenCache({
 *     fetchToken: async () => {
 *       const response = await fetch('/uploadcare-token')
 *       return (await response.json()).token
 *     }
 *   })
 *
 *   uploadFile(file, { publicKey, authToken: tokens.getToken })
 */
export class AuthTokenCache {
  /**
   * Reassign this instead of building a new cache when the function's identity
   * changes but its behavior does not — a React component re-rendering passes
   * a new closure every time, and rebuilding would throw the token away on
   * every render. The cached token is deliberately kept across a swap; call
   * `invalidate()` when the change is real, such as a user signing out.
   */
  fetchToken: FetchAuthToken

  readonly #skew: number
  #token: string | undefined
  #expiresAt: number | undefined
  #inflight: Promise<string> | undefined

  constructor({ fetchToken, skew = 30, initialToken }: AuthTokenCacheOptions) {
    this.fetchToken = fetchToken
    this.#skew = skew
    if (initialToken) this.#store(initialToken)
  }

  getToken = (): Promise<string> => {
    if (this.#token !== undefined && !this.#isStale()) {
      return Promise.resolve(this.#token)
    }

    // Concurrent callers share one request rather than each starting their
    // own.
    this.#inflight ??= Promise.resolve()
      .then(() => this.fetchToken())
      .then((token) => {
        this.#store(token)
        return token
      })
      .finally(() => {
        this.#inflight = undefined
      })

    return this.#inflight
  }

  /** Drop the cached token, so the next `getToken()` fetches a new one. */
  invalidate(): void {
    this.#token = undefined
    this.#expiresAt = undefined
  }

  #store(token: string): void {
    this.#token = token
    this.#expiresAt = getTokenExpiration(token)
  }

  #isStale(): boolean {
    // ponytail: a token whose `exp` we could not read is used until the Upload
    // API refuses it. Refreshing on every request instead would turn one
    // unreadable token into a request storm. Call `invalidate()` to force one.
    if (this.#expiresAt === undefined) return false
    return Date.now() / 1000 >= this.#expiresAt - this.#skew
  }
}
