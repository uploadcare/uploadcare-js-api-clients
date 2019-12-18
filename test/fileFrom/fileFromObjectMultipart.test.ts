import * as factory from '../_fixtureFactory'
import fileFrom from '../../src/fileFrom/fileFrom'
import { getSettingsForTesting } from '../_helpers'
import CancelController from '../../src/CancelController'
import { UploadClientError } from '../../src/errors/errors'

describe('fileFrom Object (multipart)', () => {
  const fileToUpload = factory.file(12).data
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart')
  })

  it('should resolves when file is ready on CDN', async () => {
    const file = await fileFrom(fileToUpload, settings)

    expect(file.cdnUrl).toBeTruthy()
  }, 250000)

  it('should accept store setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })
    const file = await fileFrom(fileToUpload, settings)

    expect(file.isStored).toBeFalsy()
  }, 250000)

  it('should be able to cancel uploading', async () => {
    const ctrl = new CancelController()
    const upload = fileFrom(fileToUpload, {
      ...settings,
      cancel: ctrl
    })

    ctrl.cancel()

    await expectAsync(upload).toBeRejectedWithError(
      UploadClientError,
      'Request canceled'
    )
  })

  it('should accept new file name setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      doNotStore: true,
      fileName: 'newFileName.jpg'
    })
    const file = await fileFrom(fileToUpload, settings)

    expect(file.name).toEqual('newFileName.jpg')
  }, 250000)

  describe('should be able to handle', () => {
    it('cancel uploading', async () => {
      const ctrl = new CancelController()
      const onCancel = jasmine.createSpy('onCancel')

      ctrl.onCancel(onCancel)

      const upload = fileFrom(fileToUpload, {
        ...settings,
        cancel: ctrl
      })

      ctrl.cancel()

      await expectAsync(upload).toBeRejectedWithError(
        UploadClientError,
        'Request canceled'
      )

      expect(onCancel).toHaveBeenCalled()
    })

    it('progress', async () => {
      let progressValue = 0
      const onProgress = ({ value }) => {
        progressValue = value
      }
      const upload = fileFrom(fileToUpload, {
        ...settings,
        onProgress
      })

      await upload

      expect(progressValue).toBe(1)
    }, 250000)
  })
})
