import { vi, expect, describe, it } from 'vitest'
import * as factory from '../_fixtureFactory'
import {
  getSettingsForTesting,
  assertComputableProgress,
  assertUploadedFile
} from '../_helpers'
import { CancelError } from '@uploadcare/api-client-utils'
import { uploadFromUploaded } from '../../src/uploadFile/uploadFromUploaded'
import info from '../../src/api/info'
describe('uploadFromUploaded', () => {
  const uuid = factory.uuid('image')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should resolves when file is ready on CDN', async () => {
    const file = await uploadFromUploaded(uuid, settings)

    expect(file.uuid).toBe(uuid)
    assertUploadedFile(file, settings)
  })

  it('should wait until file is ready', async () => {
    const file = await uploadFromUploaded(uuid, settings)
    const fileInfo = await info(file.uuid, settings)

    expect(fileInfo.isReady).toBe(true)
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new AbortController()
    const upload = uploadFromUploaded(uuid, {
      ...settings,
      signal: ctrl.signal
    })

    ctrl.abort()

    await expect(upload).rejects.toThrowError(new CancelError('Poll cancelled'))
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

    await expect(uploadFromUploaded(uuid, settings)).rejects.toMatchObject({
      message: 'pub_key is invalid.',
      code: 'ProjectPublicKeyInvalidError'
    })
  })
})
