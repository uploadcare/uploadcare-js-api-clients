import * as factory from '../_fixtureFactory'
import { getSettingsForTesting, assertComputableProgress } from '../_helpers'
import { UploadError } from '../../src/tools/UploadError'
import { uploadFromUploaded } from '../../src/uploadFile/uploadFromUploaded'
import { vi, expect } from 'vitest'

describe('uploadFromUploaded', () => {
  const uuid = factory.uuid('image')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should resolves when file is ready on CDN', async () => {
    const file = await uploadFromUploaded(uuid, settings)

    expect(file.cdnUrl).toBeTruthy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new AbortController()
    const upload = uploadFromUploaded(uuid, {
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
      store: true,
      fileName: 'newFileName.jpg'
    })
    const file = await uploadFromUploaded(uuid, settings)

    expect(file.name).toEqual('newFileName.jpg')
  })

  it('should be able to handle progress', async () => {
    const onProgress = vi.fn()
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      onProgress
    })

    await uploadFromUploaded(uuid, settings)

    assertComputableProgress(onProgress)
  })

  it('should be rejected with error code if failed', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    })

    try {
      await uploadFromUploaded(uuid, settings)
    } catch (error) {
      expect((error as UploadError).message).toEqual('pub_key is invalid.')
      expect((error as UploadError).code).toEqual(
        'ProjectPublicKeyInvalidError'
      )
    }
  })
})
