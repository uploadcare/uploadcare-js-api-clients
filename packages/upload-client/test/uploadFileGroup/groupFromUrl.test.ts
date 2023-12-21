import * as factory from '../_fixtureFactory'
import {
  getSettingsForTesting,
  assertComputableProgress,
  assertUnknownProgress
} from '../_helpers'
import { uploadFileGroup } from '../../src/uploadFileGroup'
import { UploadError } from '../../src/tools/UploadError'
import { jest, expect } from '@jest/globals'

describe('groupFrom Url[]', () => {
  const sourceUrl = factory.imageUrl('valid')
  const files = [sourceUrl, sourceUrl]
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should resolves when file is ready on CDN', async () => {
    const { cdnUrl } = await uploadFileGroup(files, settings)

    expect(cdnUrl).toBeTruthy()
  })

  it('should accept store setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })
    const upload = uploadFileGroup(files, settings)
    const group = await upload

    expect(group.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new AbortController()
    const upload = uploadFileGroup(files, {
      ...settings,
      signal: ctrl.signal
    })

    ctrl.abort()

    await expect(upload).rejects.toThrowError(
      new UploadError('Request canceled')
    )
  })

  it('should be able to handle progress', async () => {
    const onProgress = jest.fn()
    const upload = uploadFileGroup(files, {
      ...settings,
      onProgress
    })

    await upload

    assertComputableProgress(onProgress)
  })

  process.env.TEST_ENV !== 'production' &&
    it('should be able to handle non-computable unknown progress', async () => {
      const onProgress = jest.fn()
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('unknownProgress'),
        onProgress
      })
      const upload = uploadFileGroup(
        [...files, factory.imageUrl('valid')],
        settings
      )

      await upload

      assertUnknownProgress(onProgress)
    })

  it('should be rejected with error code if failed', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    })

    try {
      await uploadFileGroup(files, settings)
    } catch (error) {
      expect((error as UploadError).message).toEqual('pub_key is invalid.')
      expect((error as UploadError).code).toEqual(
        'ProjectPublicKeyInvalidError'
      )
    }
  })
})
