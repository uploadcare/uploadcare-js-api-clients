import base from '../../src/api/base'
import fromUrl from '../../src/api/fromUrl'
import group from '../../src/api/group'
import { uploadDirect } from '../../src/uploadFile/uploadDirect'
import { uploadMultipart } from '../../src/uploadFile/uploadMultipart'
import { getAuthErrorKind } from '../../src/tools/getAuthErrorKind'
import { UploadError } from '../../src/tools/UploadError'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import { jest, expect } from '@jest/globals'

jest.setTimeout(60000)

// The mock server implements the JWT auth scheme with well-known fake tokens
// ('valid-jwt', 'expired-jwt', ...); production does not, so these run
// against the mock server only.
const describeLocalOnly =
  process.env.TEST_ENV === 'production' ? describe.skip : describe

// Trap for errors: resolves to the thrown error, or null on success.
const caught = (promise: Promise<unknown>): Promise<UploadError | null> =>
  promise.then(
    () => null,
    (error) => error
  )

describeLocalOnly('authToken (JWT auth)', () => {
  const fileToUpload = factory.image('blackSquare')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('demo')
  })
  // The bearer branch runs before the pub_key check on the mock server, so a
  // request that succeeds with an invalid public key proves the header was
  // actually sent and used.
  const settingsWithInvalidKey = getSettingsForTesting({
    publicKey: factory.publicKey('invalid')
  })

  it('should send the Authorization header (invalid token fails despite valid public key)', async () => {
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: 'wrong-jwt' })
    )

    expect(error).toBeInstanceOf(UploadError)
    expect(error?.message).toBe('Token is invalid.')
    expect(error?.code).toBe('JwtInvalidError')
    expect(getAuthErrorKind(error)).toBe('token-invalid')
  })

  it('should authorize with a valid token even when the public key is invalid', async () => {
    const { file } = await base(fileToUpload.data, {
      ...settingsWithInvalidKey,
      authToken: 'valid-jwt'
    })

    expect(typeof file).toBe('string')
  })

  it('should accept an async resolver and call it once per request', async () => {
    const resolver = jest.fn(async () => 'valid-jwt')
    const { file } = await base(fileToUpload.data, {
      ...settings,
      authToken: resolver
    })

    expect(typeof file).toBe('string')
    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('should drop legacy signature params when authToken is set', async () => {
    // The mock server rejects requests carrying both auth schemes, so
    // success here proves signature/expire were not sent.
    const { file } = await base(fileToUpload.data, {
      ...settings,
      authToken: 'valid-jwt',
      secureSignature: 'signature',
      secureExpire: '1234567890'
    })

    expect(typeof file).toBe('string')
  })

  it('should reject with JwtTokenExpiredError for a plain expired token', async () => {
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: 'expired-jwt' })
    )

    expect(error?.code).toBe('JwtTokenExpiredError')
    expect(getAuthErrorKind(error)).toBe('token-expired')
  })

  it('should re-resolve the token and retry once when it is expired', async () => {
    let calls = 0
    const resolver = jest.fn(() =>
      ++calls === 1 ? 'expired-jwt' : 'valid-jwt'
    )
    const { file } = await base(fileToUpload.data, {
      ...settings,
      authToken: resolver
    })

    expect(typeof file).toBe('string')
    expect(resolver).toHaveBeenCalledTimes(2)
  })

  it('should give up when the token is still expired after a refresh', async () => {
    const resolver = jest.fn(() => 'expired-jwt')
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken: resolver })
    )

    expect(error?.code).toBe('JwtTokenExpiredError')
    expect(resolver).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['quota-jwt', 'JwtQuotaExceededError', 'quota-exhausted'],
    ['scope-jwt', 'JwtScopeDeniedError', 'scope-denied']
  ] as const)(
    'should not retry the final error %s even with a resolver',
    async (jwt, code, kind) => {
      const resolver = jest.fn(() => jwt)
      const error = await caught(
        base(fileToUpload.data, { ...settings, authToken: resolver })
      )

      expect(error?.code).toBe(code)
      expect(getAuthErrorKind(error)).toBe(kind)
      expect(resolver).toHaveBeenCalledTimes(1)
    }
  )

  it('should send the header on from_url requests', async () => {
    const response = await fromUrl(factory.imageUrl('valid'), {
      ...settingsWithInvalidKey,
      authToken: 'valid-jwt'
    })

    expect(response.type).toBeDefined()
  })

  it('should send the header on group creation', async () => {
    const groupInfo = await group(factory.groupOfFiles('valid'), {
      ...settingsWithInvalidKey,
      authToken: 'valid-jwt'
    })

    expect(groupInfo.id).toBeTruthy()
  })

  it('should send the header on the info requests the pollers make', async () => {
    // uploadDirect = base + isReadyPoll(info); both are protected routes, so
    // completing with an invalid public key proves the poller carried the
    // token too.
    const file = await uploadDirect(fileToUpload.data, {
      ...settingsWithInvalidKey,
      authToken: 'valid-jwt'
    })

    expect(file.uuid).toBeTruthy()
  })

  it('should authorize multipart start/complete but keep part uploads bare', async () => {
    // The mock storage endpoint drops the connection when it receives an
    // Authorization header, so this only completes if start/complete carry
    // the token (invalid public key otherwise) and the part PUTs do not.
    const bigFile = factory.file(12).data
    const file = await uploadMultipart(bigFile, {
      ...settingsWithInvalidKey,
      authToken: 'valid-jwt'
    })

    expect(file.cdnUrl).toBeTruthy()
  })
})
