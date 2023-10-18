import * as factory from '../_fixtureFactory'
import { getSettingsForTesting, assertComputableProgress } from '../_helpers'
import { uploadFileGroup } from '../../src/uploadFileGroup'
import { UploadClientError } from '../../src/tools/errors'
import { jest, expect } from '@jest/globals'

describe('groupFrom Uploaded[]', () => {
  const files = factory.groupOfFiles('valid')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should resolves when file is ready on CDN', async () => {
    const data = await uploadFileGroup(files, settings)

    expect(data).toBeTruthy()
    expect(data.uuid).toBeTruthy()
    expect(data.files).toBeTruthy()
    expect(data.files[0].uuid).toBe(files[0])
    expect(data.files[0].defaultEffects).toBe('')
    expect(data.files[1].uuid).toBe(files[1].split('/')[0])
    expect(data.files[1].defaultEffects).toBe('resize/x800/')
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
      new UploadClientError('Request canceled')
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

  it('should be rejected with error code if failed', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    })

    try {
      await uploadFileGroup(files, settings)
    } catch (error) {
      expect((error as UploadClientError).message).toEqual(
        'pub_key is invalid.'
      )
      expect((error as UploadClientError).code).toEqual(
        'ProjectPublicKeyInvalidError'
      )
    }
  })
})
