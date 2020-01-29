import * as factory from '../_fixtureFactory'
import uploadFileGroup from '../../src/uploadFileGroup'
import { getSettingsForTesting } from '../_helpers'
import CancelController from '../../src/tools/CancelController'
import { UploadClientError } from '../../src/tools/errors'

describe('groupFrom Object[]', () => {
  const fileToUpload = factory.image('blackSquare').data
  const files = [fileToUpload, fileToUpload]
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should resolves when file is ready on CDN', async () => {
    const { cdnUrl } = await uploadFileGroup(files, settings)

    expect(cdnUrl).toBeTruthy()
  })

  it('should accept store setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })
    const upload = uploadFileGroup(files, settings)
    const group = await upload

    expect(group.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new CancelController()
    const upload = uploadFileGroup(files, {
      ...settings,
      cancel: ctrl
    })

    ctrl.cancel()

    await expect(upload).rejects.toThrowError(
      new UploadClientError('Request canceled')
    )
  })

  describe('should be able to handle', () => {
    it('cancel uploading', async () => {
      const ctrl = new CancelController()
      const onCancel = jest.fn()

      ctrl.onCancel(onCancel)

      const upload = uploadFileGroup(files, {
        ...settings,
        cancel: ctrl
      })

      ctrl.cancel()

      await expect(upload).rejects.toThrowError(
        new UploadClientError('Request canceled')
      )

      expect(onCancel).toHaveBeenCalled()
    })

    it('progress', async () => {
      let progressValue = 0
      const onProgress = ({ value }): void => {
        progressValue = value
      }
      const upload = uploadFileGroup(files, {
        ...settings,
        onProgress
      })

      await upload

      expect(progressValue).toBe(1)
    })
  })
})
