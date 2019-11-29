import * as factory from '../_fixtureFactory'
import fileFrom from '../../src/fileFrom/fileFrom'
import {getSettingsForTesting} from '../_helpers'
import CancelError from '../../src/errors/CancelError'

describe('fileFrom URL', () => {
  const sourceUrl = factory.imageUrl('valid')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image'),
  })

  it('should resolves when file is ready on CDN', async () => {
    const file = await fileFrom(sourceUrl, settings)

    expect(file.cdnUrl).toBeTruthy()
  })

  it('should accept doNotStore setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      doNotStore: true,
    })
    const file = await fileFrom(sourceUrl, settings)

    expect(file.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const upload = fileFrom(sourceUrl, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should accept new file name setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      doNotStore: true,
      fileName: 'newFileName.jpg',
    })
    const file = await fileFrom(sourceUrl, settings)

    expect(file.name).toEqual('newFileName.jpg')
  })

  describe('should be able to handle', () => {
    it('cancel uploading', async () => {
      const upload = fileFrom(sourceUrl, settings)

      const onCancel = jasmine.createSpy('onCancel')

      upload.onCancel = onCancel
      upload.cancel()

      await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

      expect(onCancel).toHaveBeenCalled()
    })

    it('progress', async () => {
      let progressValue = 0
      const upload = fileFrom(sourceUrl, settings)

      upload.onProgress = (progress) => {
        const {value} = progress

        progressValue = value
      }

      await upload

      expect(progressValue).toBe(1)
    })

    it('uploaded', async () => {
      const upload = fileFrom(sourceUrl, settings)
      const onUploaded = jasmine.createSpy('onUploaded')

      upload.onUploaded = onUploaded

      await (expectAsync(upload) as any).toBeResolved()

      expect(onUploaded).toHaveBeenCalled()
    })

    it('ready', async () => {
      const upload = fileFrom(sourceUrl, settings)
      const onReady = jasmine.createSpy('onReady')

      upload.onReady = onReady

      await (expectAsync(upload) as any).toBeResolved()

      expect(onReady).toHaveBeenCalled()
    })
  })
})
