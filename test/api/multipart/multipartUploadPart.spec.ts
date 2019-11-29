import multipartUploadPart from '../../../src/api/multipart/multipartUploadPart'
import * as factory from '../../_fixtureFactory'
import {getSettingsForTesting} from '../../_helpers'
import multipartStart from '../../../src/api/multipart/multipartStart'
import defaultSettings from '../../../src/defaultSettings'
import CancelError from '../../../src/errors/CancelError'

describe('API - multipartUploadPart', () => {
  const fileToUpload = factory.file(12).data
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart'),
  })

  it('should be able to upload part', async () => {
    const {parts} = await multipartStart(fileToUpload, settings)
    const [firstPart] = parts
    const fileSliceToUpload = fileToUpload.slice(0, defaultSettings.multipartChunkSize)
    const upload = multipartUploadPart(firstPart, fileSliceToUpload)
    const {code} = await upload

    expect(code).toBeTruthy()
  }, 250000)

  it('should be able to cancel uploading', async () => {
    const {parts} = await multipartStart(fileToUpload, settings)
    const [firstPart] = parts
    const fileSliceToUpload = fileToUpload.slice(0, defaultSettings.multipartChunkSize)
    const upload = multipartUploadPart(firstPart, fileSliceToUpload)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const {parts} = await multipartStart(fileToUpload, settings)
    const [firstPart] = parts
    const fileSliceToUpload = fileToUpload.slice(0, defaultSettings.multipartChunkSize)
    const upload = multipartUploadPart(firstPart, fileSliceToUpload)
    const onCancel = jasmine.createSpy('onCancel')

    upload.onCancel = onCancel
    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })

  it('should be able to handle progress', async () => {
    let progressValue = 0
    const {parts} = await multipartStart(fileToUpload, settings)
    const [firstPart] = parts
    const fileSliceToUpload = fileToUpload.slice(0, defaultSettings.multipartChunkSize)

    const upload = multipartUploadPart(firstPart, fileSliceToUpload)

    upload.onProgress = (progressEvent) => {
      progressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    }

    await upload

    expect(progressValue).toBeGreaterThan(0)
  }, 250000)
})
