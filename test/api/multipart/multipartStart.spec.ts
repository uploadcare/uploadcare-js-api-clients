import multipartStart from '../../../src/api/multipart/multipartStart'
import * as factory from '../../_fixtureFactory'
import { getSettingsForTesting } from '../../_helpers'
import CancelError from '../../../src/errors/CancelError'
import UploadcareError from '../../../src/errors/UploadcareError'

describe('API - multipartStart', () => {
  const fileToUpload = factory.file(12).data
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart')
  })

  it('should be able to start upload data', async () => {
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const { uuid, parts } = await multipartStartUpload

    expect(uuid).toBeTruthy()
    expect(parts).toBeTruthy()
  })

  it('should be able to cancel uploading', async () => {
    const upload = multipartStart(fileToUpload, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const onCancel = jasmine.createSpy('onCancel')
    const upload = multipartStart(fileToUpload, settings, { onCancel })

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })

  it('should be rejected with bad options', async () => {
    const fileToUpload = factory.file(9).data
    const upload = multipartStart(fileToUpload, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })
})
