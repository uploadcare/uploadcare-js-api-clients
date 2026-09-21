import { createHash, createHmac } from 'node:crypto'
import { errors, jwtVerify } from 'jose'
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
  /**
   * Everything above recomputes the signature the way `generateAuthToken`
   * builds it, which proves the two agree and nothing more. `jose` is an
   * independent implementation that parses the token as a JWT, so a malformed
   * header, a double-encoded payload or the wrong base64 flavour fails here
   * while every self-consistent assertion still passes. It is a devDependency:
   * the package ships with none.
   */
  describe('interop with an independent JWT implementation', () => {
    const signingKey = createHash('sha256')
      .update(FIXTURE_SECRET, 'utf8')
      .digest()

    it('verifies as an HS256 JWT, claims intact', async () => {
      const token = generateAuthToken(FIXTURE_SECRET, {
        lifetime: HOUR,
        scope: ['/base/', '/multipart/*'],
        operations: 20,
        issuer: 'my-app',
        subject: 'user-42',
        tokenId: 'token-1'
      })

      const { payload, protectedHeader } = await jwtVerify(token, signingKey, {
        algorithms: ['HS256']
      })

      expect(protectedHeader).toEqual({ alg: 'HS256', typ: 'JWT' })
      expect(payload).toEqual({
        iat: FIXTURE_IAT,
        exp: FIXTURE_IAT + 3600,
        iss: 'my-app',
        sub: 'user-42',
        jti: 'token-1',
        uc: {
          restrictions: {
            scope: ['/base/', '/multipart/*'],
            limits: { operations: 20 }
          }
        }
      })
    })

    it('encodes non-ASCII claims as UTF-8', async () => {
      const subject = 'пользователь-42 🙂'
      const token = generateAuthToken(FIXTURE_SECRET, {
        lifetime: HOUR,
        subject
      })

      const { payload } = await jwtVerify(token, signingKey)

      expect(payload.sub).toBe(subject)
    })

    it('does not verify under a different secret key', async () => {
      const token = generateAuthToken(FIXTURE_SECRET, { lifetime: HOUR })
      const otherKey = createHash('sha256')
        .update('OTHER_SECRET_KEY', 'utf8')
        .digest()

      await expect(jwtVerify(token, otherKey)).rejects.toBeInstanceOf(
        errors.JWSSignatureVerificationFailed
      )
    })

    it('is refused once `exp` has passed', async () => {
      const token = generateAuthToken(FIXTURE_SECRET, { lifetime: HOUR })

      vi.setSystemTime(FIXTURE_DATE.getTime() + 2 * HOUR)
      await expect(jwtVerify(token, signingKey)).rejects.toBeInstanceOf(
        errors.JWTExpired
      )
      vi.setSystemTime(FIXTURE_DATE)
    })
  })
})
