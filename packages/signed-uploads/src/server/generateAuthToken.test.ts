import { createHash, createHmac } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  generateAuthToken,
  type GenerateAuthTokenOptions
} from './generateAuthToken'

const FIXTURE_SECRET = 'YOUR_SECRET_KEY'
const FIXTURE_DATE = new Date(1678359840000)
const FIXTURE_IAT = 1678359840
const HOUR = 60 * 60 * 1000

const decode = (token: string) => {
  const [header = '', payload = '', signature = ''] = token.split('.')
  return {
    header: JSON.parse(Buffer.from(header, 'base64url').toString()),
    payload: JSON.parse(Buffer.from(payload, 'base64url').toString()),
    signature
  }
}

/** Verify the way the Upload API does, rather than trusting our own helper. */
const isSignatureValid = (token: string, secretKey: string) => {
  const [header, payload, signature] = token.split('.')
  const key = createHash('sha256').update(secretKey, 'utf8').digest()
  const expected = createHmac('sha256', key)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return signature === expected
}

describe('generateAuthToken', () => {
  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(FIXTURE_DATE)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('signs with the SHA-256 digest of the secret key', () => {
    const token = generateAuthToken(FIXTURE_SECRET, { lifetime: HOUR })

    expect(isSignatureValid(token, FIXTURE_SECRET)).toBe(true)
    expect(isSignatureValid(token, 'OTHER_SECRET_KEY')).toBe(false)
  })

  it('produces an HS256 JWT header', () => {
    const { header } = decode(
      generateAuthToken(FIXTURE_SECRET, { lifetime: HOUR })
    )

    expect(header).toEqual({ alg: 'HS256', typ: 'JWT' })
  })

  it('sets exp from `lifetime`', () => {
    const { payload } = decode(
      generateAuthToken(FIXTURE_SECRET, { lifetime: HOUR })
    )

    expect(payload.iat).toBe(FIXTURE_IAT)
    expect(payload.exp).toBe(FIXTURE_IAT + 3600)
  })

  it('sets exp from `expire` as number and as Date', () => {
    const expire = FIXTURE_DATE.getTime() + HOUR

    expect(
      decode(generateAuthToken(FIXTURE_SECRET, { expire })).payload.exp
    ).toBe(FIXTURE_IAT + 3600)
    expect(
      decode(generateAuthToken(FIXTURE_SECRET, { expire: new Date(expire) }))
        .payload.exp
    ).toBe(FIXTURE_IAT + 3600)
  })

  it('omits `uc` entirely when there are no restrictions', () => {
    const { payload } = decode(
      generateAuthToken(FIXTURE_SECRET, { lifetime: HOUR })
    )

    expect(payload).toEqual({ iat: FIXTURE_IAT, exp: FIXTURE_IAT + 3600 })
  })

  it('nests scope and operations under `uc.restrictions`', () => {
    const { payload } = decode(
      generateAuthToken(FIXTURE_SECRET, {
        lifetime: HOUR,
        scope: ['/base/', '/multipart/*'],
        operations: 10
      })
    )

    expect(payload.uc).toEqual({
      restrictions: {
        scope: ['/base/', '/multipart/*'],
        limits: { operations: 10 }
      }
    })
  })

  it('carries the optional standard claims', () => {
    const { payload } = decode(
      generateAuthToken(FIXTURE_SECRET, {
        lifetime: HOUR,
        issuer: 'my-app',
        subject: 'user-42',
        tokenId: 'abc'
      })
    )

    expect(payload.iss).toBe('my-app')
    expect(payload.sub).toBe('user-42')
    expect(payload.jti).toBe('abc')
  })

  describe('rejects what the Upload API would reject', () => {
    it.each([
      [
        'a missing secret key',
        '',
        { lifetime: HOUR },
        '`secretKey` is required'
      ],
      [
        'an expiration in the past',
        FIXTURE_SECRET,
        { expire: FIXTURE_DATE.getTime() - HOUR },
        '`expire` must be in the future'
      ],
      [
        'a lifetime over 24 hours',
        FIXTURE_SECRET,
        { lifetime: 25 * HOUR },
        '`expire` can not be more than 86400 seconds ahead'
      ],
      [
        'an empty scope',
        FIXTURE_SECRET,
        { lifetime: HOUR, scope: [] },
        '`scope` can not be empty'
      ],
      [
        'a scope item without a leading slash',
        FIXTURE_SECRET,
        { lifetime: HOUR, scope: ['base/'] },
        '`scope` items must start with `/`'
      ],
      [
        'a wildcard mid-segment',
        FIXTURE_SECRET,
        { lifetime: HOUR, scope: ['/base*'] },
        '`scope` supports `*` only as the last symbol of an item, after a `/`'
      ],
      [
        'more than 16 scope items',
        FIXTURE_SECRET,
        {
          lifetime: HOUR,
          scope: Array.from({ length: 17 }, (_, i) => `/e${i}/`)
        },
        '`scope` can not contain more than 16 items'
      ],
      [
        'zero operations',
        FIXTURE_SECRET,
        { lifetime: HOUR, operations: 0 },
        '`operations` must be an integer between 1 and 100000'
      ],
      [
        'more operations than allowed',
        FIXTURE_SECRET,
        { lifetime: HOUR, operations: 100_001 },
        '`operations` must be an integer between 1 and 100000'
      ]
    ])('%s', (_name, secret, options, message) => {
      expect(() =>
        generateAuthToken(secret, options as GenerateAuthTokenOptions)
      ).toThrow(message)
    })

    it('accepts a bare `*` scope', () => {
      expect(() =>
        generateAuthToken(FIXTURE_SECRET, { lifetime: HOUR, scope: ['*'] })
      ).not.toThrow()
    })
  })
})
