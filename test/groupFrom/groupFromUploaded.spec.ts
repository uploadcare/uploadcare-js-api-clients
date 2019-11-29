import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import groupFrom from '../../src/groupFrom/groupFrom'
import CancelError from '../../src/errors/CancelError'

describe('groupFrom Uploaded[]', () => {
  const uuid = factory.uuid('image')
  const files = [uuid]
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image'),
  })

  it('should resolves when file is ready on CDN', async () => {
    const {cdnUrl} = await groupFrom(files, settings)

    expect(cdnUrl).toBeTruthy()
  })

  it('should accept doNotStore setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      doNotStore: true,
    })
    const upload = groupFrom(files, settings)
    const group = await upload

    expect(group.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const upload = groupFrom(files, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  describe('should be able to handle', () => {
    it('cancel uploading', async () => {
      const upload = groupFrom(files, settings)
      const onCancel = jasmine.createSpy('onCancel')

      upload.onCancel = onCancel
      upload.cancel()

      await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

      expect(onCancel).toHaveBeenCalled()
    })

    it('progress', async () => {
      let progressValue = 0
      const upload = groupFrom(files, settings)

      upload.onProgress = (progress) => {
        const {value} = progress

        progressValue = value
      }

      await upload

      expect(progressValue).toBe(1)
    })

    it('uploaded', async () => {
      const upload = groupFrom(files, settings)
      const onUploaded = jasmine.createSpy('onUploaded')

      upload.onUploaded = onUploaded

      await (expectAsync(upload) as any).toBeResolved()

      expect(onUploaded).toHaveBeenCalled()
    })

    it('ready', async () => {
      const upload = groupFrom(files, settings)
      const onReady = jasmine.createSpy('onReady')

      upload.onReady = onReady

      await (expectAsync(upload) as any).toBeResolved()

      expect(onReady).toHaveBeenCalled()
    })
  })
})
