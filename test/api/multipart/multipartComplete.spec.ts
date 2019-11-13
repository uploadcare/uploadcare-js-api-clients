import multipartComplete from '../../../src/api/multipart/multipartComplete'
import * as factory from '../../_fixtureFactory'
import {getSettingsForTesting} from '../../_helpers'
import multipartStart from '../../../src/api/multipart/multipartStart'
import multipartUpload from '../../../src/api/multipart/multipartUpload'
import UploadcareError from '../../../src/errors/UploadcareError'
import CancelError from '../../../src/errors/CancelError'

describe('API - multipartComplete', () => {
  const fileToUpload = factory.file(11).data
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image'),
  })

  it('should be able to complete upload data', async () => {
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {uuid: completedUuid, parts} = await multipartStartUpload

    await multipartUpload(fileToUpload, parts, settings)

    const upload = multipartComplete(completedUuid, settings)
    const {uuid} = await upload

    expect(uuid).toBeTruthy()
  })

  it('should be able to cancel uploading', async () => {
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {uuid: completedUuid, parts} = await multipartStartUpload

    await multipartUpload(fileToUpload, parts, settings)

    const upload = multipartComplete(completedUuid, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {uuid: completedUuid, parts} = await multipartStartUpload

    await multipartUpload(fileToUpload, parts, settings)

    const upload = multipartComplete(completedUuid, settings)

    const onCancel = jasmine.createSpy('onCancel')

    upload.onCancel = onCancel
    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })

  it('should be rejected with bad options', async () => {
    const upload = multipartComplete('', settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })
})
