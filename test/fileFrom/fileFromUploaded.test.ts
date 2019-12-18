import * as factory from '../_fixtureFactory'
import fileFrom from '../../src/fileFrom/fileFrom'
import { getSettingsForTesting } from '../_helpers'
import CancelController from '../../src/CancelController'
import { UploadClientError } from '../../src/errors/errors'

describe('fileFrom Uploaded', () => {
  const uuid = factory.uuid('image')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should resolves when file is ready on CDN', async () => {
    const file = await fileFrom(uuid, settings)

    expect(file.cdnUrl).toBeTruthy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new CancelController()
    const upload = fileFrom(uuid, {
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
      store: true,
      fileName: 'newFileName.jpg'
    })
    const file = await fileFrom(uuid, settings)

    expect(file.name).toEqual('newFileName.jpg')
  })

  describe('should be able to handle', () => {
    it('cancel uploading', async () => {
      const ctrl = new CancelController()
      const onCancel = jasmine.createSpy('onCancel')
      ctrl.onCancel(onCancel)
      const upload = fileFrom(uuid, {
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
      const onProgress = jasmine.createSpy('onProgress')
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
        onProgress
      })

      await fileFrom(uuid, settings)

      expect(onProgress).toHaveBeenCalled()
      expect(onProgress).toHaveBeenCalledWith({ value: 1 })
    })
  })
})
