import { createHash, createHmac } from 'node:crypto'
import { beforeEach, expect, it } from 'vitest'
import {
  handle,
  resetSession,
  SIGNED_UPLOADS_PUBLIC_KEY,
  SIGNED_UPLOADS_SECRET_KEY
} from '../src/index.js'
import { assertMatchesSpec, jsonError } from './spec.js'

/**
 * Bearer-token auth, the signed-uploads key and throttle-once — the gate
 * `auth.ts`'s `protect` puts in front of every protected route.
 *
 * Token rejections are asserted directly rather than through
 * `assertMatchesSpec`: the vendored 2024-02-12 spec documents no 401 and none
 * of the token error codes.
 */

beforeEach(() => resetSession())

const now = () => Math.floor(Date.now() / 1000)

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url')

/** HS256 keyed with `sha256(secret)`, the way `generateAuthToken` signs. */
const sign = (
  claims: object,
  secret = SIGNED_UPLOADS_SECRET_KEY,
  protectedHeader: object = { alg: 'HS256', typ: 'JWT' }
) => {
  const header = encode(protectedHeader)
  const payload = encode(claims)
  const key = createHash('sha256').update(secret, 'utf8').digest()
  const signature = createHmac('sha256', key)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${signature}`
}

const token = (claims: object = {}) => sign({ exp: now() + 600, ...claims })

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
  return handle(
    new Request(
      `https://upload.uploadcare.com/base/?jsonerrors=1${options.query ?? ''}`,
      {
        method: 'POST',
        body,
        headers: options.authorization
          ? { authorization: options.authorization }
          : {}
      }
    )
  )
}

const bearer = (value: string) => base({ authorization: `Bearer ${value}` })

const expectUploaded = async (response: Response | undefined) => {
  const body = (await response!.clone().json()) as { file?: string }
  expect(body.file).toEqual(expect.any(String))
}

const expectRejected = async (
  response: Response | undefined,
  status: number,
  code: string,
  content?: string | RegExp
) => {
  const error = await jsonError(response!)
  expect(error.status_code).toBe(status)
  expect(error.error_code).toBe(code)
  if (content) expect(error.content).toMatch(content)
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

it('accepts a token expired within the 30s clock leeway', async () => {
  await expectUploaded(await bearer(token({ exp: now() - 10 })))
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
    'ScopeForbiddenError'
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
    'OperationsLimitExceededError'
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
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/from_url/status/?jsonerrors=1&token=nope',
      { headers: { authorization: 'Bearer rubbish' } }
    )
  )
  const body = (await response!.clone().json()) as { status?: string }
  expect(body.status).toBe('unknown')
})

it('requires a signature for the signed-uploads key without a token', async () => {
  const response = await base({ publicKey: SIGNED_UPLOADS_PUBLIC_KEY })
  const error = await jsonError(response!)
  expect(error).toMatchObject({
    status_code: 400,
    error_code: 'SignatureRequiredError'
  })
  await assertMatchesSpec({
    method: 'post',
    path: '/base/',
    status: 400,
    response: response!,
    body: await response!.clone().json()
  })
})

it('throttles the first request with a throttle key, once per session', async () => {
  const throttled = () =>
    base({
      publicKey: 'demopublickey',
      fields: { 'metadata[mock_throttle]': 'case' }
    })

  const first = await throttled()
  expect(first!.headers.get('retry-after')).toBe('1')
  const error = await jsonError(first!)
  expect(error).toMatchObject({
    status_code: 429,
    error_code: 'RequestThrottledError'
  })
  await assertMatchesSpec({
    method: 'post',
    path: '/base/',
    status: 429,
    response: first!,
    body: await first!.clone().json()
  })

  await expectUploaded(await throttled())

  resetSession()
  expect((await jsonError((await throttled())!)).status_code).toBe(429)
})

it('forgets spent operations on resetSession', async () => {
  const limited = token({ uc: { restrictions: { limits: { operations: 1 } } } })
  await expectUploaded(await bearer(limited))
  resetSession()
  await expectUploaded(await bearer(limited))
})
