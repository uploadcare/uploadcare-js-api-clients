import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthTokenCache, getAuthHeaders, getTokenExpiration } from './client'

const NOW = 1678359840000
const now = () => Math.floor(NOW / 1000)

/** A token the cache can read `exp` out of. The signature is never checked. */
const tokenExpiringIn = (seconds: number, label = 'token') => {
  const payload = Buffer.from(
    JSON.stringify({ exp: now() + seconds, label })
  ).toString('base64url')
  return `header.${payload}.signature`
}

describe('getTokenExpiration', () => {
  it('reads `exp`', () => {
    expect(getTokenExpiration(tokenExpiringIn(60))).toBe(now() + 60)
  })

  it.each([
    ['a token with no payload segment', 'notajwt'],
    ['an unparseable payload', 'header.@@@.signature'],
    [
      'a payload without exp',
      `header.${Buffer.from('{"a":1}').toString('base64url')}.signature`
    ]
  ])('returns undefined for %s', (_name, token) => {
    expect(getTokenExpiration(token)).toBeUndefined()
  })
})

describe('getAuthHeaders', () => {
  it('builds the bearer header', () => {
    expect(getAuthHeaders('eyJ')).toEqual({ Authorization: 'Bearer eyJ' })
  })

  it('is spreadable when there is no token', () => {
    expect(getAuthHeaders(undefined)).toEqual({})
  })
})

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
})
