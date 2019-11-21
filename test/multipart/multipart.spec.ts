import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import multipart from '../../src/multipart/multipart'
import CancelError from '../../src/errors/CancelError'

fdescribe('API - multipart', () => {
  const fileToUpload = factory.file(11).data
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart'),
  })

  it('should be able to upload multipart file', async () => {
    const {uuid} = await multipart(fileToUpload, settings)

    expect(uuid).toBeTruthy()
  }, 100000)

  it('should be able to cancel uploading', async () => {
    const upload = multipart(fileToUpload, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const upload = multipart(fileToUpload, settings)
    const onCancel = jasmine.createSpy('onCancel')

    upload.onCancel = onCancel
    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })

  it('should be able to handle progress', async () => {
    let progressValue = 0
    const upload = multipart(fileToUpload, settings)

    upload.onProgress = (progressEvent) => {
      progressValue = Math.round(progressEvent.loaded / progressEvent.total)
    }

    await upload

    expect(progressValue).toBe(1)
  }, 100000)
})
