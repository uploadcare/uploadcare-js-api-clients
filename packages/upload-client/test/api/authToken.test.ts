import { createHash, createHmac } from 'node:crypto'
import { generateAuthToken } from '@uploadcare/signed-uploads'
import { expect, jest } from '@jest/globals'
import base from '../../src/api/base'
import fromUrl from '../../src/api/fromUrl'
import fromUrlStatus from '../../src/api/fromUrlStatus'
import group from '../../src/api/group'
import { uploadDirect } from '../../src/uploadFile/uploadDirect'
import { uploadFile } from '../../src/uploadFile/uploadFile'
import { uploadMultipart } from '../../src/uploadFile/uploadMultipart'
import { AuthError } from '../../src/tools/AuthError'
import { UploadError } from '../../src/tools/UploadError'
import {
  SIGNED_UPLOADS_PUBLIC_KEY,
  SIGNED_UPLOADS_SECRET_KEY
} from '../../mock-server/config'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'

jest.setTimeout(60000)

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
 * `generateAuthToken` refuses to mint a token that is already expired, which is
 * the right call for a minting API and leaves this the only way to get one.
 * Signed properly, so both servers reject it for its `exp` rather than for the
 * signature, and far enough back to clear the 30 second clock leeway.
 */
const mintExpiredToken = (): string => {
  const issuedAt = Math.floor(Date.now() / 1000) - 3600
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({ iat: issuedAt, exp: issuedAt + 60 })
  const key = createHash('sha256')
    .update(secretKey as string, 'utf8')
    .digest()
  const signature = createHmac('sha256', key)
    .update(`${header}.${payload}`)
    .digest('base64url')

  return `${header}.${payload}.${signature}`
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
    const resolver = jest.fn(() => mintToken())
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
    const resolver = jest.fn(() =>
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
    const resolver = jest.fn(() => mintExpiredToken())
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: resolver })
    )

    expect(error?.code).toBe('AccessTokenExpiredError')
    expect(resolver).toHaveBeenCalledTimes(2)
  })

  it('should reject an endpoint the token scope does not cover', async () => {
    const resolver = jest.fn(() =>
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
})

/**
 * Cases that need a server willing to answer with a public key it would
 * otherwise refuse: an invalid one plus a valid token must succeed, which is
 * what proves the header reached the server and was used. Production has no
 * such project, so these stay on the mock.
 */
describeMockOnly('authToken (mock server only)', () => {
  const fileToUpload = factory.image('blackSquare')
  const settings = getSettingsForTesting({
    publicKey: SIGNED_UPLOADS_PUBLIC_KEY
  })
  const settingsWithInvalidKey = getSettingsForTesting({
    publicKey: factory.publicKey('invalid')
  })

  it('should drop legacy signature params when authToken is set', async () => {
    const warnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined)
    try {
      // The mock rejects requests carrying both auth schemes, so success here
      // proves signature/expire were not sent.
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

  it('should send the header on from_url requests', async () => {
    const response = await fromUrl(factory.imageUrl('valid'), {
      ...settingsWithInvalidKey,
      authToken: mintToken()
    })

    expect(response.type).toBeDefined()
  })

  it('should send the header on group creation', async () => {
    const groupInfo = await group(factory.groupOfFiles('valid'), {
      ...settingsWithInvalidKey,
      authToken: mintToken()
    })

    expect(groupInfo.id).toBeTruthy()
  })

  it('should send the header on the info requests the pollers make', async () => {
    // uploadDirect = base + isReadyPoll(info); both are protected routes, so
    // completing with an invalid public key proves the poller carried the
    // token too.
    const file = await uploadDirect(fileToUpload.data, {
      ...settingsWithInvalidKey,
      authToken: mintToken()
    })

    expect(file.uuid).toBeTruthy()
  })

  it('should validate the token on the from_url status poller', async () => {
    // `/from_url/status` is an unprotected route, so the mock used to skip the
    // bearer check there and an invalid token sailed through the poller.
    const error = await caught(
      fromUrlStatus(factory.token('valid'), {
        ...settings,
        authToken: 'not-a-jwt'
      })
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error?.code).toBe('AccessTokenInvalidError')
  })

  it('should authorize multipart start/complete but keep part uploads bare', async () => {
    // The mock storage endpoint drops the connection when it receives an
    // Authorization header, so this only completes if start/complete carry the
    // token (invalid public key otherwise) and the part PUTs do not.
    const bigFile = factory.file(12).data
    const file = await uploadMultipart(bigFile, {
      ...settingsWithInvalidKey,
      authToken: mintToken()
    })

    expect(file.cdnUrl).toBeTruthy()
  })
})
