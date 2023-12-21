import * as factory from '../_fixtureFactory'
import { getSettingsForTesting, assertComputableProgress } from '../_helpers'
import { UploadError } from '../../src/tools/UploadError'
import { uploadDirect } from '../../src/uploadFile/uploadDirect'
import { jest, expect } from '@jest/globals'

// TODO: add tests for metadata
describe('uploadDirect', () => {
  it('should resolves when file is ready on CDN', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await uploadDirect(fileToUpload, settings)

    expect(file.cdnUrl).toBeTruthy()
  })

  it('should accept store setting', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })
    const file = await uploadDirect(fileToUpload, settings)

    expect(file.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new AbortController()
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      signal: ctrl.signal
    })
    const upload = uploadDirect(fileToUpload, settings)

    setTimeout(() => {
      ctrl.abort()
    })

    await expect(upload).rejects.toThrowError('Request canceled')
  })

  it('should accept new file name setting', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false,
      fileName: 'newFileName.jpg'
    })
    const file = await uploadDirect(fileToUpload, settings)

    expect(file.name).toEqual('newFileName.jpg')
  })

  it('should accept custom contenType', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false,
      contentType: 'image/jpeg'
    })
    const file = await uploadDirect(fileToUpload, settings)
    expect(file.mimeType).toEqual('image/jpeg')
  })

  it('should be able to handle progress', async () => {
    const onProgress = jest.fn()
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      onProgress
    })

    await uploadDirect(fileToUpload, settings)

    assertComputableProgress(onProgress)
  })

  it('should be rejected with error code if failed', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    })

    try {
      await uploadDirect(fileToUpload, settings)
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
