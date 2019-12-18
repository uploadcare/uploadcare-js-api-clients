import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import groupFrom from '../../src/groupFrom/groupFrom'
import CancelError from '../../src/errors/CancelError'

describe('groupFrom Url[]', () => {
  const sourceUrl = factory.imageUrl('valid')
  const files = [sourceUrl, sourceUrl]
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should resolves when file is ready on CDN', async () => {
    const { cdnUrl } = await groupFrom(files, settings)

    expect(cdnUrl).toBeTruthy()
  })

  it('should accept store setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      doNotStore: true
    })
    const upload = groupFrom(files, settings)
    const group = await upload

    expect(group.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const upload = groupFrom(files, settings)

    upload.cancel()

    await expectAsync(upload).toBeRejectedWithError(CancelError)
  })

  describe('should be able to handle', () => {
    it('cancel uploading', async () => {
      const onCancel = jasmine.createSpy('onCancel')
      const upload = groupFrom(files, settings, { onCancel })

      upload.cancel()

      await expectAsync(upload).toBeRejectedWithError(CancelError)

      expect(onCancel).toHaveBeenCalled()
    })

    it('progress', async () => {
      let progressValue = 0
      const onProgress = progress => {
        const { value } = progress

        progressValue = value
      }
      const upload = groupFrom(files, settings, { onProgress })

      await upload

      expect(progressValue).toBe(1)
    })

    it('uploaded', async () => {
      const onUploaded = jasmine.createSpy('onUploaded')
      const upload = groupFrom(files, settings, { onUploaded })

      await expectAsync(upload).toBeResolved()

      expect(onUploaded).toHaveBeenCalled()
    })

    it('ready', async () => {
      const onReady = jasmine.createSpy('onReady')
      const upload = groupFrom(files, settings, { onReady })

      await expectAsync(upload).toBeResolved()

      expect(onReady).toHaveBeenCalled()
    })
  })
})
