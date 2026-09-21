/**
 * Runs against the built package, imported by name so the `exports` map is
 * exercised too, rather than against `src`.
 *
 * The build mangles `_`-prefixed properties. The unit tests cannot catch a
 * mistake there because they import source, where the names are intact, so
 * anything reading a private member across a boundary terser cannot see would
 * pass every one of them and fail here.
 *
 * Needs `dist`, so it lives behind its own config and runs from `postbuild`
 * rather than from `npm test`.
 */
import { createHash, createHmac } from 'node:crypto'
import { createRequire } from 'node:module'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AuthTokenCache,
  getAuthHeaders,
  getTokenExpiration
} from '@uploadcare/signed-uploads/client'
import {
  generateAuthToken,
  generateSecureSignature
} from '@uploadcare/signed-uploads'

const NOW = 1700000000000
const base64url = (value: string) => Buffer.from(value).toString('base64url')
const tokenExpiringIn = (seconds: number) =>
  `header.${base64url(
    JSON.stringify({ exp: Math.floor(NOW / 1000) + seconds })
  )}.signature`

describe('client entry', () => {
  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads exp and builds the header', () => {
    const exp = Math.floor(NOW / 1000) + 3600
    expect(getTokenExpiration(tokenExpiringIn(3600))).toBe(exp)
    expect(getAuthHeaders('abc')).toEqual({ Authorization: 'Bearer abc' })
    expect(getAuthHeaders(undefined)).toEqual({})
  })

  it('caches, shares one in-flight fetch, and refetches after invalidate', async () => {
    const token = tokenExpiringIn(3600)
    const fetchToken = vi.fn(() => token)
    const cache = new AuthTokenCache({ fetchToken })

    await Promise.all([cache.getToken(), cache.getToken()])
    expect(await cache.getToken()).toBe(token)
    expect(fetchToken).toHaveBeenCalledTimes(1)

    cache.invalidate()
    await cache.getToken()
    expect(fetchToken).toHaveBeenCalledTimes(2)
  })

  it('refreshes once the token enters the skew window', async () => {
    const fetchToken = vi.fn(() => tokenExpiringIn(3600))
    const cache = new AuthTokenCache({ fetchToken })

    await cache.getToken()
    expect(fetchToken).toHaveBeenCalledTimes(1)

    // One second inside the 30s default skew.
    vi.setSystemTime(NOW + (3600 - 29) * 1000)
    await cache.getToken()
    expect(fetchToken).toHaveBeenCalledTimes(2)
  })

  it('keeps a token whose exp it cannot read', async () => {
    const fetchToken = vi.fn(() => 'opaque')
    const cache = new AuthTokenCache({ fetchToken })

    await cache.getToken()
    vi.setSystemTime(NOW + 10 * 86400_000)
    expect(await cache.getToken()).toBe('opaque')
    expect(fetchToken).toHaveBeenCalledTimes(1)
  })

  it('keeps the cached token when fetchToken is swapped', async () => {
    const cache = new AuthTokenCache({
      fetchToken: () => tokenExpiringIn(3600)
    })
    const first = await cache.getToken()

    const second = vi.fn(() => tokenExpiringIn(3600))
    cache.fetchToken = second

    expect(await cache.getToken()).toBe(first)
    expect(second).not.toHaveBeenCalled()
  })

  it('works from the CJS build', async () => {
    const require = createRequire(import.meta.url)
    const cjs = require('@uploadcare/signed-uploads/client')

    expect(cjs.getAuthHeaders('abc')).toEqual({ Authorization: 'Bearer abc' })
    const token = tokenExpiringIn(3600)
    await expect(
      new cjs.AuthTokenCache({ fetchToken: () => token }).getToken()
    ).resolves.toBe(token)
  })
})

describe('server entry', () => {
  it('mints a token whose signature verifies', () => {
    const secret = 'YOUR_SECRET_KEY'
    const jwt = generateAuthToken(secret, {
      lifetime: 30 * 60 * 1000,
      scope: ['/base/'],
      operations: 5
    })

    const [header = '', payload = '', signature = ''] = jwt.split('.')
    const key = createHash('sha256').update(secret, 'utf8').digest()
    const expected = createHmac('sha256', key)
      .update(`${header}.${payload}`)
      .digest('base64url')

    expect(signature).toBe(expected)
    expect(JSON.parse(Buffer.from(payload, 'base64url').toString()).uc).toEqual(
      { restrictions: { scope: ['/base/'], limits: { operations: 5 } } }
    )
  })

  it('still enforces the lifetime ceiling in the bundle', () => {
    expect(() =>
      generateAuthToken('secret', { lifetime: 25 * 60 * 60 * 1000 })
    ).toThrow(/86400/)
  })

  it('still generates a legacy signature', () => {
    const { secureSignature, secureExpire } = generateSecureSignature(
      'secret',
      {
        lifetime: 60_000
      }
    )

    expect(secureSignature).toMatch(/^[a-f0-9]{64}$/)
    expect(secureExpire).toMatch(/^\d+$/)
  })
})
