import { vi, expect, describe, it, beforeAll } from 'vitest'
import * as factory from '../_fixtureFactory'
import multipartUpload from '../../src/api/multipartUpload'
import { getSettingsForTesting, assertComputableProgress } from '../_helpers'
import multipartStart from '../../src/api/multipartStart'
import { CancelError } from '@uploadcare/api-client-utils'
let parts: [string, Blob | Buffer][] = []

vi.setConfig({ testTimeout: 60000 })

beforeAll(async () => {
  const file = factory.file(11)
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart'),
    contentType: 'application/octet-stream'
  })

  const { parts: urls } = await multipartStart(file.size, settings)

  parts = urls.map((url, index) => {
    const start = settings.multipartChunkSize * index
    const end = Math.min(start + settings.multipartChunkSize, file.size)
    return [url, file.data.slice(start, end)]
  })
})

describe('API - multipartUpload', () => {
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart')
  })

  it('should be able to upload multipart file', async () => {
    const [url, part] = parts[0]

    await expect(multipartUpload(part, url, settings)).resolves.toEqual({
      code: 200
    })
  })

  it('should be able to cancel uploading', async () => {
    const [url, part] = parts[1]

    const cntr = new AbortController()
    const options = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      signal: cntr.signal
    })

    setTimeout(() => {
      cntr.abort()
    })

    await expect(multipartUpload(part, url, options)).rejects.toThrowError(
      new CancelError('Request canceled')
    )
  })

  it('should be able to handle progress', async () => {
    const onProgress = vi.fn()
    const options = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      onProgress
    })

    const [url, part] = parts[2]
    await multipartUpload(part, url, options)

    assertComputableProgress(onProgress)
  })
})
