import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'

import fileFrom from '../../src/fileFrom/fileFrom'
import CancelController from '../../src/CancelController'

describe('fileFrom Object', () => {
  const fileToUpload = factory.image('blackSquare').data
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should resolves when file is ready on CDN', async () => {
    const file = await fileFrom(fileToUpload, settings)

    expect(file.cdnUrl).toBeTruthy()
  })

  it('should accept store setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })
    const file = await fileFrom(fileToUpload, settings)

    expect(file.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new CancelController()
    const upload = fileFrom(fileToUpload, {
      ...settings,
      cancel: ctrl
    })

    ctrl.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError('Request canceled')
  })

  it('should accept new file name setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      doNotStore: true,
      fileName: 'newFileName.jpg'
    })
    const file = await fileFrom(fileToUpload, settings)

    expect(file.name).toEqual('newFileName.jpg')
  })

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

      await (expectAsync(upload) as any).toBeRejectedWithError(
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
    })
  })
})
