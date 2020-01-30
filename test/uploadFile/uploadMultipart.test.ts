import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import uploadMultipart from '../../src/uploadFile/uploadMultipart'
import { UploadClientError } from '../../src/tools/errors'
import CancelController from '../../src/tools/CancelController'

jest.setTimeout(60000)

describe('API - multipart', () => {
  it('should be able to upload multipart file', async () => {
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream'
    })

    const { uuid } = await uploadMultipart(fileToUpload, settings)

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

    await expect(uploadMultipart(fileToUpload, settings)).rejects.toThrowError(
      new UploadClientError('Request canceled')
    )
  })

  it('should be able to handle progress', async () => {
    const onProgress = jest.fn()
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream',
      onProgress
    })

    await uploadMultipart(fileToUpload, settings)

    expect(onProgress).toHaveBeenCalled()
    expect(onProgress).toHaveBeenCalledWith({ value: 1 })
  })
})
