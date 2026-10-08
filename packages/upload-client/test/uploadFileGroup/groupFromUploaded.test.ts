import { beforeEach, vi, expect, describe, it } from 'vitest'
import { resetSession } from '@uploadcare/api-emulator'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting, assertComputableProgress } from '../_helpers'
import { uploadFileGroup } from '../../src/uploadFileGroup'
import { CancelError } from '@uploadcare/api-client-utils'
describe('groupFrom Uploaded[]', () => {
  const files = factory.groupOfFiles('valid')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  // Already in the project in production; `demopublickey`'s can't see it.
  beforeEach(() => {
    resetSession().use('storedFile', {
      uuid: files[0],
      publicKey: settings.publicKey
    })
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
      new CancelError('Request canceled')
    )
  })

  it('should be able to handle progress', async () => {
    const onProgress = vi.fn()
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

    await expect(uploadFileGroup(files, settings)).rejects.toMatchObject({
      message: 'pub_key is invalid.',
      code: 'ProjectPublicKeyInvalidError'
    })
  })
})
