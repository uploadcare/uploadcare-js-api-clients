import * as factory from '../../_fixtureFactory'
import multipartUpload from '../../../src/api/multipart/multipartUpload'
import {getSettingsForTesting} from '../../_helpers'
import multipartStart from '../../../src/api/multipart/multipartStart'
import CancelError from '../../../src/errors/CancelError'

describe('API - multipartUpload', () => {
  const fileToUpload = factory.file(11).data
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image'),
  })

  it('should be able to upload multipart file', async () => {
    const {parts} = await multipartStart(fileToUpload, settings)
    const upload = multipartUpload(fileToUpload, parts, settings)

    await (expectAsync(upload) as any).toBeResolved()
  })

  it('should be able to cancel uploading', async () => {
    const {parts} = await multipartStart(fileToUpload, settings)
    const upload = multipartUpload(fileToUpload, parts, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const {parts} = await multipartStart(fileToUpload, settings)
    const upload = multipartUpload(fileToUpload, parts, settings)
    const onCancel = jasmine.createSpy('onCancel')

    upload.onCancel = onCancel
    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })

  it('should be able to handle progress', async () => {
    let progressValue = 0
    const {parts} = await multipartStart(fileToUpload, settings)
    const upload = multipartUpload(fileToUpload, parts, settings)

    upload.onProgress = (progressEvent) => {
      progressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    }

    await upload

    expect(progressValue).toBeGreaterThan(0)
  })
})
