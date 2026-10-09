import { vi, expect, describe, it } from 'vitest'
import { resetSession } from '@uploadcare/api-emulator'
import * as factory from '../_fixtureFactory'
import {
  getSettingsForTesting,
  assertComputableProgress,
  assertUnknownProgress,
  assertUploadedGroup
} from '../_helpers'
import { uploadFileGroup } from '../../src/uploadFileGroup'
import { CancelError } from '@uploadcare/api-client-utils'
describe('groupFrom Url[]', () => {
  const sourceUrl = factory.imageUrl('valid')
  const files = [sourceUrl, sourceUrl]
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

  it.skipIf(process.env.TEST_ENV === 'production')(
    'should be able to handle non-computable unknown progress',
    async () => {
      resetSession().use('unknownProgress')
      const onProgress = vi.fn()
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
        onProgress
      })
      const upload = uploadFileGroup(
        [...files, factory.imageUrl('valid')],
        settings
      )

      await upload

      assertUnknownProgress(onProgress)
    }
  )

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
