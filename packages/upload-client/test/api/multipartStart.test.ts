import { describe, it, expect } from 'vitest'
import multipartStart from '../../src/api/multipartStart'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting, UUID } from '../_helpers'
import { UploadError } from '../../src/tools/UploadError'
import { CancelError } from '@uploadcare/api-client-utils'

describe('API - multipartStart', () => {
  const size = factory.file(12).size

  it('should be able to start upload data', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream'
    })
    const { uuid, parts } = await multipartStart(size, settings)

    expect(uuid).toMatch(UUID)
    // 12 MiB in the Upload API's 5 MiB parts.
    expect(parts).toHaveLength(3)
  })

  it('should be able to cancel uploading', async () => {
    const cntr = new AbortController()
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream',
      signal: cntr.signal
    })
    const upload = multipartStart(size, settings)

    setTimeout(() => {
      cntr.abort()
    })

    await expect(upload).rejects.toThrowError(
      new CancelError('Request canceled')
    )
  })

  it('should be rejected with bad options', async () => {
    const size = factory.file(9).size
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream'
    })

    const upload = multipartStart(size, settings)

    await expect(upload).rejects.toThrow(UploadError)

    await expect(upload).rejects.toThrow(
      /File size can not be less than \d+ bytes\. Please use direct upload instead of multipart\./
    )
  })

  it('should be rejected with error code if failed', async () => {
    const size = factory.file(9).size
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid'),
      contentType: 'application/octet-stream'
    })

    await expect(multipartStart(size, settings)).rejects.toMatchObject({
      message: 'UPLOADCARE_PUB_KEY is invalid.',
      code: 'ProjectPublicKeyInvalidError'
    })
  })
})
