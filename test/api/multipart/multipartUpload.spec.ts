import * as factory from '../../_fixtureFactory'
import multipartUpload from '../../../src/api/multipart/multipartUpload'
import {getSettingsForTesting} from '../../_helpers'
import multipartStart from '../../../src/api/multipart/multipartStart'
import CancelError from '../../../src/errors/CancelError'

describe('API - multipartUpload', () => {
  const fileToUpload = factory.file(12).data
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart'),
  })

  it('should be able to upload multipart file', async () => {
    const {parts} = await multipartStart(fileToUpload, settings)
    const upload = multipartUpload(fileToUpload, parts, settings)

    await (expectAsync(upload) as any).toBeResolved()
  }, 250000)

  it('should be able to cancel uploading', async () => {
    const {parts} = await multipartStart(fileToUpload, settings)
    const upload = multipartUpload(fileToUpload, parts, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const {parts} = await multipartStart(fileToUpload, settings)
    const onCancel = jasmine.createSpy('onCancel')
    const upload = multipartUpload(fileToUpload, parts, settings, {onCancel})

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })

  it('should be able to handle progress', async () => {
    let progressValue = 0
    const {parts} = await multipartStart(fileToUpload, settings)
    const onProgress = (progressEvent) => {
      progressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    }
    const upload = multipartUpload(fileToUpload, parts, settings, {onProgress})

    await upload

    expect(progressValue).toBeGreaterThan(0)
  }, 250000)
})
