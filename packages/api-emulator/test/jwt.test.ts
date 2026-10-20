import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mintAuthToken,
  resetSession,
  SIGNED_UPLOADS_SECRET_KEY
} from '../src/index.js'
import { call, now, sign, token } from './emulator.js'
import { jsonError } from './spec.js'

/**
 * Bearer-token auth — the gate `auth.ts`'s `protect` puts in front of every
 * protected route.
 *
 * Token rejections are asserted directly rather than through
 * `assertMatchesSpec`: the vendored 2024-02-12 spec documents no 401 and none
 * of the token error codes.
 */

beforeEach(() => resetSession())

const base = (
  options: {
    authorization?: string
    publicKey?: string
    fields?: Record<string, string>
    query?: string
  } = {}
) => {
  const body = new FormData()
  body.set('UPLOADCARE_PUB_KEY', options.publicKey ?? 'invalid_key')
  for (const [name, value] of Object.entries(options.fields ?? {}))
    body.set(name, value)
  body.set('file', new File([new Uint8Array([1])], 'a.bin'))
  return call(
    `https://upload.uploadcare.com/base/?jsonerrors=1${options.query ?? ''}`,
    {
      method: 'POST',
      body,
      headers: options.authorization
        ? { authorization: options.authorization }
        : {}
    },
    { offSpec: 'the spec documents no 401 and no token error (see above)' }
  )
}

const bearer = (value: string) => base({ authorization: `Bearer ${value}` })

const expectUploaded = async (response: Response) => {
  const body = (await response.clone().json()) as { file?: string }
  expect(body.file).toEqual(expect.any(String))
}

const expectRejected = async (
  response: Response,
  status: number,
  code: string,
  content: string | RegExp
) => {
  const error = await jsonError(response)
  expect(error.status_code).toBe(status)
  expect(error.error_code).toBe(code)
  expect(error.content).toMatch(content)
}

it('accepts a valid token on /base/, even with an invalid public key', async () => {
  await expectUploaded(await bearer(token()))
})

it('rejects something that is not a JWT', async () => {
  await expectRejected(
    await bearer('not-a-jwt'),
    401,
    'AccessTokenInvalidError',
    'Invalid token. Reason: unreadable or not a JWT'
  )
})

it('rejects a token signed with the wrong secret', async () => {
  await expectRejected(
    await bearer(sign({ exp: now() + 600 }, 'not-the-secret')),
    401,
    'AccessTokenInvalidError',
    'Invalid token. Reason: signature does not match'
  )
})

it('rejects a correctly signed token whose `alg` is not HS256', async () => {
  await expectRejected(
    await bearer(
      sign({ exp: now() + 600 }, SIGNED_UPLOADS_SECRET_KEY, { alg: 'none' })
    ),
    401,
    'AccessTokenInvalidError',
    'Invalid token. Reason: `alg` must be HS256'
  )
})

it('rejects a token without `exp`', async () => {
  await expectRejected(
    await bearer(sign({})),
    401,
    'AccessTokenInvalidError',
    /`exp` is required/
  )
})

it('rejects an expired token', async () => {
  await expectRejected(
    await bearer(token({ exp: now() - 3600 })),
    401,
    'AccessTokenExpiredError',
    'Expired token.'
  )
})

describe('on a frozen clock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('accepts a token expired 29s ago, inside the 30s clock leeway', async () => {
    await expectUploaded(await bearer(token({ exp: now() - 29 })))
  })

  it('rejects a token expired 31s ago, past the 30s clock leeway', async () => {
    await expectRejected(
      await bearer(token({ exp: now() - 31 })),
      401,
      'AccessTokenExpiredError',
      'Expired token.'
    )
  })

  it('mints tokens issued now', async () => {
    expect(claimsOf(await mintAuthToken()).iat).toBe(now())
  })
})

it('rejects a malformed scope item', async () => {
  await expectRejected(
    await bearer(token({ uc: { restrictions: { scope: ['*'] } } })),
    401,
    'AccessTokenInvalidError',
    /must start with `\/`/
  )
})

it('refuses an endpoint outside the scope', async () => {
  await expectRejected(
    await bearer(token({ uc: { restrictions: { scope: ['/multipart/*'] } } })),
    403,
    'ScopeForbiddenError',
    '`uc.restrictions.scope` does not allow this endpoint.'
  )
})

it('accepts every endpoint with a `/*` scope', async () => {
  await expectUploaded(
    await bearer(token({ uc: { restrictions: { scope: ['/*'] } } }))
  )
})

it('spends `limits.operations`, then refuses', async () => {
  const limited = token({ uc: { restrictions: { limits: { operations: 1 } } } })
  await expectUploaded(await bearer(limited))
  await expectRejected(
    await bearer(limited),
    403,
    'OperationsLimitExceededError',
    'The operation limit of the token is exhausted.'
  )
})

it('refuses a Bearer token sent with `signature`', async () => {
  await expectRejected(
    await base({
      authorization: `Bearer ${token()}`,
      fields: { signature: 'x' }
    }),
    403,
    'AccessTokenInvalidError'
  )
})

it('refuses a Bearer token sent with `expire` in the query', async () => {
  await expectRejected(
    await base({ authorization: `Bearer ${token()}`, query: '&expire=1' }),
    403,
    'AccessTokenInvalidError'
  )
})

it('refuses an Authorization header that is not Bearer', async () => {
  await expectRejected(
    await base({ authorization: 'Basic x' }),
    401,
    'AccessTokenInvalidError',
    'Invalid Authorization header format.'
  )
})

it('ignores Authorization on /from_url/status/', async () => {
  const response = await call(
    'https://upload.uploadcare.com/from_url/status/?jsonerrors=1&token=nope',
    { headers: { authorization: 'Bearer rubbish' } }
  )
  const body = (await response.clone().json()) as { status?: string }
  expect(body.status).toBe('unknown')
})

it('forgets spent operations on resetSession', async () => {
  const limited = token({ uc: { restrictions: { limits: { operations: 1 } } } })
  await expectUploaded(await bearer(limited))
  resetSession()
  await expectUploaded(await bearer(limited))
})

const claimsOf = (jwt: string) =>
  JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
    iat: number
    exp: number
    jti?: string
    uc?: unknown
  }

it('mints tokens it accepts, a minute long by default', async () => {
  const minted = await mintAuthToken()
  await expectUploaded(await bearer(minted))
  const { iat, exp, jti, uc } = claimsOf(minted)
  expect(exp - iat).toBe(60)
  expect(jti).toBeUndefined()
  expect(uc).toBeUndefined()
})

it('mints with a lifetime, a token id, a scope and an operation limit', async () => {
  const minted = await mintAuthToken({
    lifetime: 600_000,
    tokenId: 'abc',
    scope: ['/multipart/*'],
    operations: 1
  })
  expect(claimsOf(minted)).toMatchObject({
    jti: 'abc',
    uc: { restrictions: { scope: ['/multipart/*'], limits: { operations: 1 } } }
  })
  const { iat, exp } = claimsOf(minted)
  expect(exp - iat).toBe(600)
  await expectRejected(
    await bearer(minted),
    403,
    'ScopeForbiddenError',
    '`uc.restrictions.scope` does not allow this endpoint.'
  )
})

it('verifies against the exported secret', async () => {
  await expectUploaded(
    await bearer(sign({ exp: now() + 600 }, SIGNED_UPLOADS_SECRET_KEY))
  )
})
