import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthTokenCache } from './AuthTokenCache'
import { AuthTokenResolverError } from './AuthTokenResolverError'

const NOW = 1678359840000
const now = () => Math.floor(NOW / 1000)

/** A token the cache can read `exp` out of. The signature is never checked. */
const tokenExpiringIn = (seconds: number, label = 'token') => {
  const payload = Buffer.from(
    JSON.stringify({ exp: now() + seconds, label })
  ).toString('base64url')
  return `header.${payload}.signature`
}

/** One microtask turn, which is all the cache ever defers by. */
const tick = () => Promise.resolve()

describe('AuthTokenCache', () => {
  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches once and reuses the token while it is fresh', async () => {
    const fetchToken = vi.fn(() => tokenExpiringIn(3600))
    const cache = new AuthTokenCache({ fetchToken })

    await expect(cache.getToken()).resolves.toBe(await cache.getToken())
    expect(fetchToken).toHaveBeenCalledTimes(1)
  })

  it('refetches once the token is within the skew of expiring', async () => {
    const fetchToken = vi
      .fn()
      .mockReturnValueOnce(tokenExpiringIn(60, 'first'))
      .mockReturnValueOnce(tokenExpiringIn(3600, 'second'))
    const cache = new AuthTokenCache({ fetchToken, skew: 30 })

    const first = await cache.getToken()

    // One second short of the skew window: still fresh.
    vi.setSystemTime(NOW + 29_000)
    expect(await cache.getToken()).toBe(first)
    expect(fetchToken).toHaveBeenCalledTimes(1)

    vi.setSystemTime(NOW + 30_000)
    expect(await cache.getToken()).not.toBe(first)
    expect(fetchToken).toHaveBeenCalledTimes(2)
  })

  it('shares one request between concurrent callers', async () => {
    let resolve!: (token: string) => void
    const pending = new Promise<string>((r) => {
      resolve = r
    })
    const fetchToken = vi.fn(() => pending)
    const cache = new AuthTokenCache({ fetchToken })

    const calls = [cache.getToken(), cache.getToken(), cache.getToken()]
    const token = tokenExpiringIn(3600)
    resolve(token)

    await expect(Promise.all(calls)).resolves.toEqual([token, token, token])
    expect(fetchToken).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed fetch instead of caching the rejection', async () => {
    const fetchToken = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(tokenExpiringIn(3600))
    const cache = new AuthTokenCache({ fetchToken })

    await expect(cache.getToken()).rejects.toThrow('offline')
    await expect(cache.getToken()).resolves.toContain('header.')
    expect(fetchToken).toHaveBeenCalledTimes(2)
  })

  it('keeps the cached token when fetchToken is swapped', async () => {
    // A React component passes a new closure on every render; the token must
    // survive that, or every render costs a round-trip.
    const first = vi.fn(() => tokenExpiringIn(3600, 'first'))
    const cache = new AuthTokenCache({ fetchToken: first })
    const token = await cache.getToken()

    const second = vi.fn(() => tokenExpiringIn(3600, 'second'))
    cache.fetchToken = second

    expect(await cache.getToken()).toBe(token)
    expect(second).not.toHaveBeenCalled()
  })

  it('uses the swapped fetchToken once the token is dropped', async () => {
    const cache = new AuthTokenCache({
      fetchToken: () => tokenExpiringIn(3600, 'first')
    })
    const token = await cache.getToken()

    const second = vi.fn(() => tokenExpiringIn(3600, 'second'))
    cache.fetchToken = second
    cache.invalidate()

    expect(await cache.getToken()).not.toBe(token)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('drops a token that arrives after invalidate()', async () => {
    // Sign-out while the app's token endpoint is still answering. The reply
    // belongs to the user who just left, so the cache must not keep it.
    let settle: (token: string) => void = () => {}
    const signedOutUser = tokenExpiringIn(3600, 'signed-out-user')
    const nextUser = tokenExpiringIn(3600, 'next-user')
    const fetchToken = vi
      .fn<() => string | Promise<string>>()
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            settle = resolve
          })
      )
      .mockImplementation(() => nextUser)
    const cache = new AuthTokenCache({ fetchToken })

    const inFlight = cache.getToken()
    // The cache calls `fetchToken` in a microtask, so let it, or there is
    // nothing in flight to race with.
    await tick()
    cache.invalidate()
    settle(signedOutUser)

    // The caller that was already waiting has nothing else to be given.
    await expect(inFlight).resolves.toBe(signedOutUser)

    expect(await cache.getToken()).toBe(nextUser)
    expect(fetchToken).toHaveBeenCalledTimes(2)
  })

  it('keeps the fetch started after invalidate(), not the one before it', async () => {
    // The late arrival must not clear the newer request either, or the token
    // it brings would be fetched again by every later caller.
    let settleFirst: (token: string) => void = () => {}
    const stale = tokenExpiringIn(3600, 'stale')
    const fresh = tokenExpiringIn(3600, 'fresh')
    const fetchToken = vi
      .fn<() => string | Promise<string>>()
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            settleFirst = resolve
          })
      )
      .mockImplementation(() => fresh)
    const cache = new AuthTokenCache({ fetchToken })

    cache.getToken()
    await tick()
    cache.invalidate()
    expect(await cache.getToken()).toBe(fresh)

    settleFirst(stale)
    await tick()

    expect(await cache.getToken()).toBe(fresh)
    expect(fetchToken).toHaveBeenCalledTimes(2)
  })

  it('serves a server-rendered initialToken without fetching', async () => {
    const fetchToken = vi.fn(() => tokenExpiringIn(3600, 'fetched'))
    const initialToken = tokenExpiringIn(3600, 'ssr')
    const cache = new AuthTokenCache({ fetchToken, initialToken })

    expect(await cache.getToken()).toBe(initialToken)
    expect(fetchToken).not.toHaveBeenCalled()
  })

  it('replaces an initialToken once it expires', async () => {
    const fresh = tokenExpiringIn(3600, 'fetched')
    const fetchToken = vi.fn(() => fresh)
    const initialToken = tokenExpiringIn(60, 'ssr')
    const cache = new AuthTokenCache({ fetchToken, initialToken })

    vi.setSystemTime(NOW + 60_000)

    expect(await cache.getToken()).toBe(fresh)
    expect(fetchToken).toHaveBeenCalledTimes(1)
  })

  it('keeps using a token whose exp it can not read', async () => {
    const fetchToken = vi.fn(() => 'opaque-token')
    const cache = new AuthTokenCache({ fetchToken })

    await cache.getToken()
    vi.setSystemTime(NOW + 10 * 86400_000)

    expect(await cache.getToken()).toBe('opaque-token')
    expect(fetchToken).toHaveBeenCalledTimes(1)
  })
  it('wraps a failing fetchToken and stays usable afterwards', async () => {
    const cause = new Error('token endpoint is down')
    const token = tokenExpiringIn(60)
    const fetchToken = vi
      .fn<() => string>()
      .mockImplementationOnce(() => {
        throw cause
      })
      .mockImplementation(() => token)
    const cache = new AuthTokenCache({ fetchToken })

    const error = await cache.getToken().catch((e) => e)

    expect(error).toBeInstanceOf(AuthTokenResolverError)
    expect(error.cause).toBe(cause)
    // The failed fetch must not be left in flight, or every later call would
    // wait on a promise that already rejected.
    expect(await cache.getToken()).toBe(token)
  })
})
