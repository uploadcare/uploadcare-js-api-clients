import { asAuthTokenResolverError } from './AuthTokenResolverError'
import { getTokenExpiration } from './getTokenExpiration'

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

const DEFAULT_SKEW_SECONDS = 30

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

  private readonly _skew: number
  private _token: string | undefined
  private _expiresAt: number | undefined
  private _inflight: Promise<string> | undefined
  /**
   * Bumped by `invalidate()`. A fetch that started before it cannot be
   * cancelled, so its result is dropped on arrival instead.
   */
  private _generation = 0

  constructor({
    fetchToken,
    skew = DEFAULT_SKEW_SECONDS,
    initialToken
  }: AuthTokenCacheOptions) {
    this.fetchToken = fetchToken
    this._skew = skew
    if (initialToken) this._store(initialToken)
  }

  getToken = (): Promise<string> => {
    if (this._token !== undefined && !this._isStale()) {
      return Promise.resolve(this._token)
    }

    // Concurrent callers share one request rather than each starting their
    // own.
    const generation = this._generation
    const isCurrent = () => generation === this._generation

    this._inflight ??= Promise.resolve()
      .then(() => this.fetchToken())
      .then(
        (token) => {
          // Dropped when `invalidate()` ran while this was in flight: the token
          // belongs to whoever was signed in when the fetch started, and
          // storing it now would hand it to the next caller.
          if (isCurrent()) this._store(token)
          return token
        },
        (cause) => {
          throw asAuthTokenResolverError(cause)
        }
      )
      .finally(() => {
        // Never clear a newer fetch that `invalidate()` has already started.
        if (isCurrent()) this._inflight = undefined
      })

    return this._inflight
  }

  /**
   * Drop the cached token, so the next `getToken()` fetches a new one.
   *
   * A fetch already in flight is abandoned with it: whoever is awaiting that
   * one still receives its token, since there is nothing else to give them,
   * but it is not stored and the next call starts a fresh fetch.
   */
  invalidate(): void {
    this._generation++
    this._token = undefined
    this._expiresAt = undefined
    this._inflight = undefined
  }

  private _store(token: string): void {
    this._token = token
    this._expiresAt = getTokenExpiration(token)
  }

  private _isStale(): boolean {
    // ponytail: a token whose `exp` we could not read is used until the Upload
    // API refuses it. Refreshing on every request instead would turn one
    // unreadable token into a request storm. Call `invalidate()` to force one.
    if (this._expiresAt === undefined) return false
    return Date.now() / 1000 >= this._expiresAt - this._skew
  }
}
