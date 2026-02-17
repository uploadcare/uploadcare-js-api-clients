import * as factory from '../_fixtureFactory'
import { getSettingsForTesting, assertComputableProgress } from '../_helpers'
import { UploadError } from '../../src/tools/UploadError'
import { uploadMultipart } from '../../src/uploadFile/uploadMultipart'
import { vi, expect } from 'vitest'

vi.setConfig({ testTimeout: 60000 })

// TODO: add tests for metadata
describe('uploadMultipart', () => {
  const fileToUpload = factory.file(12).data
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart')
  })

  it('should resolves when file is ready on CDN', async () => {
    const file = await uploadMultipart(fileToUpload, settings)

    expect(file.cdnUrl).toBeTruthy()
  })

  it('should accept multipartChunkSize option', async () => {
    const file = await uploadMultipart(fileToUpload, {
      ...settings,
      multipartChunkSize: 10 * 1024 * 1024
    })

    expect(file.cdnUrl).toBeTruthy()
  })

  it('should accept store setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })
    const file = await uploadMultipart(fileToUpload, settings)

    expect(file.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new AbortController()
    const upload = uploadMultipart(fileToUpload, {
      ...settings,
      signal: ctrl.signal
    })

    ctrl.abort()

    await expect(upload).rejects.toThrowError(
      new UploadError('Request canceled')
    )
  })

  it('should accept new file name setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      doNotStore: true,
      fileName: 'newFileName.jpg'
    })
    const file = await uploadMultipart(fileToUpload, settings)

    expect(file.name).toEqual('newFileName.jpg')
  })

  it('should be able to handle progress', async () => {
    const onProgress = vi.fn()
    const upload = uploadMultipart(fileToUpload, {
      ...settings,
      onProgress
    })

    await upload

    assertComputableProgress(onProgress)
  })

  it('should be rejected with error code if failed', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    })

    try {
      await uploadMultipart(fileToUpload, settings)
    } catch (error) {
      expect((error as UploadError).message).toEqual(
        'UPLOADCARE_PUB_KEY is invalid.'
      )
      expect((error as UploadError).code).toEqual(
        'ProjectPublicKeyInvalidError'
      )
    }
  })
})
