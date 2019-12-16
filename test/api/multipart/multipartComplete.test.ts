import multipartComplete from '../../../src/api/multipartComplete'
import * as factory from '../../_fixtureFactory'
import { getSettingsForTesting } from '../../_helpers'
import { UploadClientError } from '../../../src/errors/errors'


describe('API - multipartComplete', () => {
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart')
  })

  // it('should be able to complete upload data', async () => {
  //   const multipartStartUpload = multipartStart(fileToUpload, settings)
  //   const { uuid: completedUuid, parts } = await multipartStartUpload

  //   await multipartUpload(fileToUpload, parts, settings)

  //   const upload = multipartComplete(completedUuid, settings)
  //   const { uuid } = await upload

  //   expect(uuid).toBeTruthy()
  // }, 250000)

  // it('should be able to cancel uploading', async () => {
  //   const multipartStartUpload = multipartStart(fileToUpload, settings)
  //   const { uuid: completedUuid, parts } = await multipartStartUpload

  //   await multipartUpload(fileToUpload, parts, settings)

  //   const upload = multipartComplete(completedUuid, settings)

  //   upload.cancel()

  //   await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  // })

  // it('should be able to handle cancel uploading', async () => {
  //   const multipartStartUpload = multipartStart(fileToUpload, settings)
  //   const { uuid: completedUuid, parts } = await multipartStartUpload

  //   await multipartUpload(fileToUpload, parts, settings)

  //   const onCancel = jasmine.createSpy('onCancel')
  //   const upload = multipartComplete(completedUuid, settings, { onCancel })

  //   upload.cancel()

  //   await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

  //   expect(onCancel).toHaveBeenCalled()
  // })

  it('should be rejected with bad options', async () => {
    const upload = multipartComplete('', settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadClientError, '[400] uuid is required.')
  })
})
