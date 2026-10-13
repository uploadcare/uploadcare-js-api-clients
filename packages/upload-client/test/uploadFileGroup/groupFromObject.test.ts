import { vi, expect, describe, it } from 'vitest'
import * as factory from '../_fixtureFactory'
import { uploadFileGroup } from '../../src/uploadFileGroup'
import {
  getSettingsForTesting,
  assertComputableProgress,
  assertUploadedGroup
} from '../_helpers'
import { CancelError } from '@uploadcare/api-client-utils'
describe('groupFrom Object[]', () => {
  const fileToUpload = factory.image('blackSquare').data
  const files = [fileToUpload, fileToUpload]
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should resolves when file is ready on CDN', async () => {
    const group = await uploadFileGroup(files, settings)

    assertUploadedGroup(group, settings, 2)
  })

  it('should accept store setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })
    const upload = uploadFileGroup(files, settings)
    const group = await upload

    expect(group.isStored).toBe(false)
    expect(group.files.map((file) => file.isStored)).toEqual([false, false])
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
      message: 'UPLOADCARE_PUB_KEY is invalid.',
      code: 'ProjectPublicKeyInvalidError'
    })
  })
})
