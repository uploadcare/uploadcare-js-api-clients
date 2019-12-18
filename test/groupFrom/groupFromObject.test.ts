import * as factory from '../_fixtureFactory'
import groupFrom from '../../src/groupFrom/groupFrom'
import { getSettingsForTesting } from '../_helpers'
import CancelController from '../../src/CancelController'
import { UploadClientError } from '../../src/errors/errors'

describe('groupFrom Object[]', () => {
  const fileToUpload = factory.image('blackSquare').data
  const files = [fileToUpload, fileToUpload]
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
      store: false
    })
    const upload = groupFrom(files, settings)
    const group = await upload

    expect(group.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new CancelController()
    const upload = groupFrom(files, {
      ...settings,
      cancel: ctrl
    })

    ctrl.cancel()

    await expectAsync(upload).toBeRejectedWithError(
      UploadClientError,
      'Request canceled'
    )
  })

  describe('should be able to handle', () => {
    it('cancel uploading', async () => {
      const ctrl = new CancelController()
      const onCancel = jasmine.createSpy('onCancel')

      ctrl.onCancel(onCancel)

      const upload = groupFrom(files, settings)

      ctrl.cancel()

      await expectAsync(upload).toBeRejectedWithError(
        UploadClientError,
        'Request canceled'
      )

      expect(onCancel).toHaveBeenCalled()
    })

    it('progress', async () => {
      let progressValue = 0
      const onProgress = ({ value }): void => {
        progressValue = value
      }
      const upload = groupFrom(files, {
        ...settings,
        onProgress
      })

      await upload

      expect(progressValue).toBe(1)
    })
  })
})