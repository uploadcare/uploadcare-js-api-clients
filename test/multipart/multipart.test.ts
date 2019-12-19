import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import multipart from '../../src/multipart/multipart'
import { UploadClientError } from '../../src/tools/errors'
import CancelController from '../../src/tools/CancelController'

describe('API - multipart', () => {
  it('should be able to upload multipart file', async () => {
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream'
    })

    const { uuid } = await multipart(fileToUpload, settings)

    expect(uuid).toBeTruthy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new CancelController()
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream',
      cancel: ctrl
    })

    setTimeout(() => {
      ctrl.cancel()
    })

    await expectAsync(multipart(fileToUpload, settings)).toBeRejectedWithError(
      UploadClientError,
      'Request canceled'
    )
  })

  it('should be able to handle progress', async () => {
    const onProgress = jasmine.createSpy('onProgress')
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream',
      onProgress
    })

    await multipart(fileToUpload, settings)

    expect(onProgress).toHaveBeenCalled()
    expect(onProgress).toHaveBeenCalledWith({ value: 1 })
  })
})
