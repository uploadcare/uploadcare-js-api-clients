import '../_envs'

import { generateAuthToken } from '@uploadcare/signed-uploads'
import { expect, jest } from '@jest/globals'
import base from '../../src/api/base'
import { uploadFile } from '../../src/uploadFile/uploadFile'
import { AuthError } from '../../src/tools/AuthError'
import { UploadError } from '../../src/tools/UploadError'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'

jest.setTimeout(60000)

/**
 * The real thing: tokens minted with the project secret key, sent to the real
 * Upload API, against a project with Signed Uploads switched on.
 *
 * The mock server's tokens are well-known strings it agrees with itself about,
 * so it can prove the client sends a header and reacts to a code, and nothing
 * about whether Uploadcare accepts what `generateAuthToken` produces or reports
 * what this client expects. Both of those have been wrong before.
 *
 * Needs a dedicated project, since enabling Signed Uploads rejects every
 * unsigned request to it. Skipped, not failed, where its keys are absent.
 */
const publicKey = process.env.UPLOAD_CLIENT_SECURE_UPLOADS_PUBLIC_KEY
const secretKey = process.env.UPLOAD_CLIENT_SECURE_UPLOADS_SECRET_KEY
const isProduction = process.env.TEST_ENV === 'production'

const describeSecureUploads =
  isProduction && publicKey && secretKey ? describe : describe.skip

/** Trap for errors: resolves to the thrown error, or null on success. */
const caught = (promise: Promise<unknown>): Promise<UploadError | null> =>
  promise.then(
    () => null,
    (error) => error
  )

describeSecureUploads('authToken against the real Upload API', () => {
  const fileToUpload = factory.image('blackSquare')
  // `store: false` so the uploads expire on their own rather than piling up in
  // the project.
  const settings = getSettingsForTesting({
    publicKey: publicKey as string,
    store: false as const
  })
  const mintToken = (
    options: Parameters<typeof generateAuthToken>[1] = { lifetime: 60_000 }
  ) => generateAuthToken(secretKey as string, options)

  it('should refuse an upload carrying no credential at all', async () => {
    // Without this the rest of the suite proves nothing: a project that does
    // not enforce signed uploads would accept every request below, token or
    // not.
    const error = await caught(base(fileToUpload.data, settings))

    expect(error).toBeInstanceOf(UploadError)
    expect(error?.code).toBe('SignatureRequiredError')
  })

  it('should upload with a token minted by generateAuthToken', async () => {
    const { file } = await base(fileToUpload.data, {
      ...settings,
      authToken: mintToken()
    })

    expect(typeof file).toBe('string')
  })

  it('should authenticate every request of an upload from a resolver', async () => {
    // `uploadFile` uploads and then polls `/info/`, so a resolver that is
    // called once would mean a request went out unauthenticated.
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

  it('should reject an endpoint the token scope does not cover', async () => {
    const error = await caught(
      base(fileToUpload.data, {
        ...settings,
        authToken: mintToken({ lifetime: 60_000, scope: ['/multipart/*'] })
      })
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error?.code).toBe('ScopeForbiddenError')
  })

  it('should spend the operation limit and then refuse', async () => {
    const authToken = mintToken({ lifetime: 60_000, operations: 1 })

    const { file } = await base(fileToUpload.data, { ...settings, authToken })
    expect(typeof file).toBe('string')

    // The same token, now out of operations.
    const error = await caught(
      base(fileToUpload.data, { ...settings, authToken })
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error?.code).toBe('OperationsLimitExceededError')
  })
})
