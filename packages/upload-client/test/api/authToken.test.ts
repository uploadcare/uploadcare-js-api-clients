import { createHash, createHmac } from 'node:crypto'
import { generateAuthToken } from '@uploadcare/signed-uploads'
import { vi, expect, describe, it } from 'vitest'
import base from '../../src/api/base'
import fromUrl from '../../src/api/fromUrl'
import group from '../../src/api/group'
import { uploadDirect } from '../../src/uploadFile/uploadDirect'
import { uploadFile } from '../../src/uploadFile/uploadFile'
import { uploadMultipart } from '../../src/uploadFile/uploadMultipart'
import {
  AuthTokenCache,
  AuthTokenResolverError
} from '@uploadcare/signed-uploads/client'
import { AuthError } from '../../src/tools/AuthError'
import { UploadError } from '../../src/tools/UploadError'
import {
  SIGNED_UPLOADS_PUBLIC_KEY,
  SIGNED_UPLOADS_SECRET_KEY
} from '../../../api-emulator/src/apis/upload/scenarios'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'

vi.setConfig({ testTimeout: 60000 })

/**
 * One suite for both servers.
 *
 * Tokens are minted with `generateAuthToken` and the project secret key, and
 * both servers verify them for real, so these cases say the same thing whether
 * they run against the mock or against `upload.uploadcare.com`. That is the
 * point: the codes this client branches on have twice been names nobody had
 * checked against the API, and a mock that recognizes well-known fake tokens
 * cannot catch that.
 *
 * Both need a project that enforces signed uploads — `pub_test__signed_uploads`
 * on the mock, `UPLOAD_CLIENT_SECURE_UPLOADS_*` in production, where the keys
 * are a dedicated project because enabling the feature rejects every unsigned
 * request to it.
 */
const isProduction = process.env.TEST_ENV === 'production'
const publicKey = isProduction
  ? process.env.UPLOAD_CLIENT_SECURE_UPLOADS_PUBLIC_KEY
  : SIGNED_UPLOADS_PUBLIC_KEY
const secretKey = isProduction
  ? process.env.UPLOAD_CLIENT_SECURE_UPLOADS_SECRET_KEY
  : SIGNED_UPLOADS_SECRET_KEY

/** Skipped rather than failed where the production keys are not configured. */
const describeContract = publicKey && secretKey ? describe : describe.skip
const describeMockOnly = isProduction ? describe.skip : describe

/** Trap for errors: resolves to the thrown error, or null on success. */
const caught = (promise: Promise<unknown>): Promise<UploadError | null> =>
  promise.then(
    () => null,
    (error) => error
  )

const mintToken = (
  options: Parameters<typeof generateAuthToken>[1] = { lifetime: 60_000 }
) => generateAuthToken(secretKey as string, options)

/**
 * Signs whatever claims it is given, the way the Upload API expects. Needed
 * because `generateAuthToken` validates before signing, and some of these cases
 * are exactly the tokens it refuses to mint: an already expired one, or a scope
 * item the API calls malformed. A token can still arrive from another backend,
 * so both servers have to answer for it.
 */
const signTokenWithClaims = (claims: object): string => {
  const issuedAt = Math.floor(Date.now() / 1000)
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({ iat: issuedAt, exp: issuedAt + 600, ...claims })
  const key = createHash('sha256')
    .update(secretKey as string, 'utf8')
    .digest()
  const signature = createHmac('sha256', key)
    .update(`${header}.${payload}`)
    .digest('base64url')

  return `${header}.${payload}.${signature}`
}

/**
 * Expired far enough back to clear the 30 second clock leeway, so both servers
 * reject it for its `exp` rather than for the signature.
 */
const mintExpiredToken = (): string => {
  const issuedAt = Math.floor(Date.now() / 1000) - 3600
  return signTokenWithClaims({ iat: issuedAt, exp: issuedAt + 60 })
}

describeContract('authToken', () => {
  const fileToUpload = factory.image('blackSquare')
  // `store: false` so production uploads expire on their own rather than
  // piling up in the project.
  const settings = getSettingsForTesting({
    publicKey: publicKey as string,
    store: false as const
  })

  it('should refuse an upload carrying no credential at all', async () => {
    // Without this the rest proves nothing: a project that does not enforce
    // signed uploads would accept every request below, token or not.
    const error = await caught(base(fileToUpload.data, settings))

    expect(error).toBeInstanceOf(UploadError)
    expect(error?.code).toBe('SignatureRequiredError')
  })

  it('should upload with a minted token', async () => {
    const { file } = await base(fileToUpload.data, {
      ...settings,
      authToken: mintToken()
    })

    expect(typeof file).toBe('string')
  })

  it('should authenticate every request of an upload from a resolver', async () => {
    // `uploadFile` uploads and then polls `/info/`, so a resolver called once
    // would mean a request went out unauthenticated.
    const resolver = vi.fn(() => mintToken())
    const fileInfo = await uploadFile(fileToUpload.data, {
      ...settings,
      authToken: resolver
    })

    expect(fileInfo.uuid).toEqual(expect.any(String))
    expect(resolver.mock.calls.length).toBeGreaterThan(1)
  })

  it('should reject a token signed with the wrong secret key', async () => {
    const error = await caught(
      base(fileToUpload.data, {
        ...settings,
        authToken: generateAuthToken('not-the-project-secret-key', {
          lifetime: 60_000
        })
      })
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error?.code).toBe('AccessTokenInvalidError')
  })

  it('should reject anything that is not a JWT', async () => {
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: 'not-a-jwt' })
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error?.code).toBe('AccessTokenInvalidError')
  })

  it('should reject an expired token', async () => {
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: mintExpiredToken() })
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error?.code).toBe('AccessTokenExpiredError')
  })

  it('should re-resolve the token and retry once when it has expired', async () => {
    let calls = 0
    const resolver = vi.fn(() =>
      ++calls === 1 ? mintExpiredToken() : mintToken()
    )
    const { file } = await base(fileToUpload.data, {
      ...settings,
      authToken: resolver
    })

    expect(typeof file).toBe('string')
    expect(resolver).toHaveBeenCalledTimes(2)
  })

  it('should give up when the token is still expired after a refresh', async () => {
    const resolver = vi.fn(() => mintExpiredToken())
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: resolver })
    )

    expect(error?.code).toBe('AccessTokenExpiredError')
    expect(resolver).toHaveBeenCalledTimes(2)
  })

  it('should reject a scope item the Upload API calls malformed', async () => {
    // `generateAuthToken` refuses to mint this, but a token can come from
    // anywhere, so both the mock and production have to refuse it. Measured
    // against production: `uc.restrictions.scope items must start with \`/\``.
    const bareWildcard = signTokenWithClaims({
      uc: { restrictions: { scope: ['*'] } }
    })

    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: bareWildcard })
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error?.code).toBe('AccessTokenInvalidError')
  })

  it('should allow every endpoint with a `/*` scope', async () => {
    const authToken = mintToken({ lifetime: 60_000, scope: ['/*'] })

    const { file } = await base(fileToUpload.data, { ...settings, authToken })

    expect(typeof file).toBe('string')
  })

  it('should reject an endpoint the token scope does not cover', async () => {
    const resolver = vi.fn(() =>
      mintToken({ lifetime: 60_000, scope: ['/multipart/*'] })
    )
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: resolver })
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error?.code).toBe('ScopeForbiddenError')
    // Final, so no refresh is attempted: a new token would be refused too.
    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('should spend the operation limit and then refuse', async () => {
    const authToken = mintToken({ lifetime: 60_000, operations: 1 })

    const { file } = await base(fileToUpload.data, { ...settings, authToken })
    expect(typeof file).toBe('string')

    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken })
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error?.code).toBe('OperationsLimitExceededError')
  })

  it('should refuse a spent limit without a way to get another token', async () => {
    // A resolver that keeps handing back the same spent token: the retry
    // happens, and fails the same way, which is the end of it.
    //
    // `tokenId` because two tokens minted in the same second with the same
    // claims are the same string, and an operation count is per token. It is
    // the same reason the API reference recommends `jti` or `sub` for tokens
    // issued to different clients.
    const spent = mintToken({
      lifetime: 60_000,
      operations: 1,
      tokenId: 'spent-no-recovery'
    })
    const resolver = vi.fn(() => spent)

    await base(fileToUpload.data, { ...settings, authToken: resolver })
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: resolver })
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error?.code).toBe('OperationsLimitExceededError')
  })

  it('should recover from a spent limit with a cache it can invalidate', async () => {
    // One operation per token, so the second upload starts out refused. The
    // provider lets the client drop the spent token and ask for another.
    let minted = 0
    const fetchToken = vi.fn(() =>
      mintToken({
        lifetime: 60_000,
        operations: 1,
        tokenId: `spent-recovery-${++minted}`
      })
    )
    const tokens = new AuthTokenCache({ fetchToken })

    const first = await base(fileToUpload.data, {
      ...settings,
      authToken: tokens
    })
    expect(typeof first.file).toBe('string')

    const second = await base(fileToUpload.data, {
      ...settings,
      authToken: tokens
    })
    expect(typeof second.file).toBe('string')

    // One for each upload: the cached token is dropped when the API refuses
    // it, not kept and re-sent.
    expect(fetchToken).toHaveBeenCalledTimes(2)
  })

  it('should keep the cached token when the failure is not about the token', async () => {
    const fetchToken = vi.fn(() =>
      mintToken({ lifetime: 60_000, tokenId: 'kept-across-uploads' })
    )
    const tokens = new AuthTokenCache({ fetchToken })

    await base(fileToUpload.data, { ...settings, authToken: tokens })
    await base(fileToUpload.data, { ...settings, authToken: tokens })

    expect(fetchToken).toHaveBeenCalledTimes(1)
  })

  it('should report an auth failure as an UploadError carrying its response', async () => {
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: 'not-a-jwt' })
    )

    // `AuthError` extends `UploadError`, which is the documented way to catch
    // every failure this client throws.
    expect(error).toBeInstanceOf(UploadError)
    expect(error?.message).toEqual(expect.any(String))
    expect(error?.message).not.toBe('')
    // The context the error type exists to carry, rather than a bare code.
    expect(error?.request).toBeDefined()
    expect(error?.response?.error?.errorCode).toBe(error?.code)
    // 401 for a token the API will not accept at all; scope and operation
    // failures answer 403, and a missing credential 400.
    expect(error?.response?.error?.statusCode).toBe(401)
  })

  it('should surface a throwing token function as AuthTokenResolverError', async () => {
    // The failure every integrator meets first: their own token endpoint is
    // down. Nothing was sent, so there is no server code and nothing to retry.
    const cause = new Error('token endpoint is down')
    const resolver = vi.fn(() => {
      throw cause
    })

    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: resolver })
    )

    expect(error).toBeInstanceOf(AuthTokenResolverError)
    expect((error as unknown as { cause: unknown })?.cause).toBe(cause)
    expect(error?.code).toBeUndefined()
    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('should reject a rejecting token function the same way', async () => {
    const error = await caught(
      base(fileToUpload.data, {
        ...settings,
        authToken: async () => {
          throw new Error('401 from the token endpoint')
        }
      })
    )

    expect(error).toBeInstanceOf(AuthTokenResolverError)
    expect(error?.message).toContain('401 from the token endpoint')
  })

  it('should reject an empty token before sending anything', async () => {
    // Rejected like a throwing token function, rather than sent unsigned.
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: () => '' })
    )

    expect(error).toBeInstanceOf(AuthTokenResolverError)
    expect(error?.message).toContain('token function returned no token')
  })

  it('should authenticate a from_url request', async () => {
    const { uuid, cdnUrl } = await uploadFile(fileToUpload.data, {
      ...settings,
      authToken: mintToken()
    })
    expect(uuid).toEqual(expect.any(String))

    // Re-uploading a file we just put there keeps this self-contained: the
    // source is a URL the project itself serves.
    const response = await fromUrl(cdnUrl, {
      ...settings,
      authToken: mintToken()
    })
    expect(response.type).toBeDefined()

    // Deliberately nothing about `/from_url/status/`: the Upload API answers it
    // identically with a rubbish Bearer token and with none at all, so there is
    // no behaviour there for either server to hold to.
  })

  it('should authenticate group creation', async () => {
    const { uuid } = await uploadFile(fileToUpload.data, {
      ...settings,
      authToken: mintToken()
    })

    const groupInfo = await group([uuid], {
      ...settings,
      authToken: mintToken()
    })

    expect(groupInfo.id).toBeTruthy()
  })

  it('should authenticate the info requests a poller makes', async () => {
    // uploadDirect = base + isReadyPoll(info). The upload alone would pass with
    // an unauthenticated poll, so this only completes if `/info/` carried the
    // token as well.
    const file = await uploadDirect(fileToUpload.data, {
      ...settings,
      authToken: mintToken()
    })

    expect(file.uuid).toBeTruthy()
  })

  it('should authenticate multipart start and complete, and leave the parts bare', async () => {
    // Part uploads go to presigned storage URLs, which reject a request
    // carrying an `Authorization` header of their own, so completing proves
    // both halves of that: start/complete authenticated, parts not.
    const file = await uploadMultipart(factory.file(12).data, {
      ...settings,
      authToken: mintToken()
    })

    expect(file.cdnUrl).toBeTruthy()
  })

  it('should drop legacy signature params when authToken is set', async () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
    try {
      // A request carrying both is checked the old way, and these values are
      // nonsense, so success proves `signature`/`expire` were never sent.
      const { file } = await base(fileToUpload.data, {
        ...settings,
        authToken: mintToken(),
        secureSignature: 'signature',
        secureExpire: '1234567890'
      })

      expect(typeof file).toBe('string')
      expect(warnSpy).toHaveBeenCalledTimes(1)
    } finally {
      warnSpy.mockRestore()
    }
  })
})

/**
 * The one thing production cannot answer: a public key it would refuse,
 * carrying a valid token. Succeeding there is what proves the header is read
 * before the key, and no real project will play along.
 */
describeMockOnly('authToken (mock server only)', () => {
  it('should refresh an expired token that surfaces after a throttle retry', async () => {
    // The sequence that made the refresh unreachable: the retrier's `attempt`
    // counter is shared, so keying the refresh off it meant a token which
    // expired on any attempt after the first was never replaced. Throttling is
    // what puts another attempt in front of the expiry, and it cannot be
    // provoked on demand against the Upload API.
    let calls = 0
    const resolver = vi.fn(() => {
      calls += 1
      // Valid for the throttled attempt, expired for the one after it.
      return calls === 2 ? mintExpiredToken() : mintToken()
    })

    const startedAt = Date.now()
    const { file } = await base(factory.image('blackSquare').data, {
      ...getSettingsForTesting({ publicKey: SIGNED_UPLOADS_PUBLIC_KEY }),
      authToken: resolver,
      // Unique per run: the mock spends a throttle key once per process, and
      // a fixed one would quietly stop throttling on the second run against the
      // same server.
      metadata: { mock_throttle: `auth-token-retry-${Date.now()}` },
      retryThrottledRequestMaxTimes: 1
    })

    expect(typeof file).toBe('string')
    // Throttled, expired, then accepted.
    expect(resolver).toHaveBeenCalledTimes(3)
    // `retry-after: 1`, so an immediate retry would land well under a second.
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1000)
  })

  it('should check the header before the public key', async () => {
    const { file } = await base(factory.image('blackSquare').data, {
      ...getSettingsForTesting({ publicKey: factory.publicKey('invalid') }),
      authToken: mintToken()
    })

    expect(typeof file).toBe('string')
  })
})
