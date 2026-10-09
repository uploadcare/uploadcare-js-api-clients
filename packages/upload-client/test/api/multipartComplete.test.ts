import { vi, expect, describe, it } from 'vitest'
import multipartStart from '../../src/api/multipartStart'
import multipartUpload from '../../src/api/multipartUpload'
import multipartComplete from '../../src/api/multipartComplete'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import { UploadError } from '../../src/tools/UploadError'
import { CancelError } from '@uploadcare/api-client-utils'
const getChunk = (
  file: Buffer | Blob,
  index: number,
  fileSize: number,
  chunkSize: number
): Buffer | Blob => {
  const start = chunkSize * index
  const end = Math.min(start + chunkSize, fileSize)

  return file.slice(start, end)
}

vi.setConfig({ testTimeout: 60000 })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const naiveMultipart = (file, parts, options): Promise<any> =>
  Promise.all(
    parts.map((url, index) =>
      multipartUpload(
        getChunk(file.data, index, file.size, options.multipartChunkSize),
        url,
        options
      )
    )
  )

describe('API - multipartComplete', () => {
  it('should be able to complete upload data', async () => {
    const file = factory.file(11)
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream'
    })
    const { uuid: completedUuid, parts } = await multipartStart(
      file.size,
      settings
    )

    await naiveMultipart(file, parts, settings)

    const { uuid } = await multipartComplete(completedUuid, settings)

    expect(uuid).toBe(completedUuid)
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new AbortController()
    const file = factory.file(11)
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream',
      signal: ctrl.signal
    })
    const { uuid: completedUuid, parts } = await multipartStart(
      file.size,
      settings
    )

    await naiveMultipart(file, parts, settings)

    setTimeout(() => ctrl.abort())

    await expect(
      multipartComplete(completedUuid, settings)
    ).rejects.toThrowError(new CancelError('Request canceled'))
  })

  it('should be rejected with bad options', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart')
    })

    const upload = multipartComplete('', settings)

    // A real `UploadError` carries the round trip's request/response/headers,
    // so check its class and message rather than comparing a literal instance.
    await expect(upload).rejects.toThrow(UploadError)
    await expect(upload).rejects.toThrow('uuid is required.')
  })

  it('should be rejected with error code if failed', async () => {
    const publicKey = factory.publicKey('invalid')

    await expect(
      multipartComplete('', getSettingsForTesting({ publicKey }))
    ).rejects.toMatchObject({
      message: 'UPLOADCARE_PUB_KEY is invalid.',
      code: 'ProjectPublicKeyInvalidError'
    })
  })
})
