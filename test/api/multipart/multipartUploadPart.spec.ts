import multipartUploadPart from '../../../src/api/multipart/multipartUploadPart'
import * as factory from '../../_fixtureFactory'
import {getSettingsForTesting} from '../../_helpers'
import multipartStart from '../../../src/api/multipart/multipartStart'
import defaultSettings from '../../../src/defaultSettings'

describe('API - multipartUploadPart', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000
  const fileToUpload = factory.file(11).data

  it('should be able to upload part', async() => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {parts} = await multipartStartUpload
    const [firstPart] = parts
    const fileSliceToUpload = fileToUpload.slice(0, defaultSettings.multipartChunkSize)

    const upload = multipartUploadPart(firstPart, fileSliceToUpload)
    const {code} = await upload

    expect(code).toBeTruthy()
  })

  it('should be able to cancel uploading', async(done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {parts} = await multipartStartUpload
    const [firstPart] = parts
    const fileSliceToUpload = fileToUpload.slice(0, defaultSettings.multipartChunkSize)

    const upload = multipartUploadPart(firstPart, fileSliceToUpload)

    setTimeout(() => {
      upload.cancel()
    }, 1)

    upload
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to handle cancel uploading', async (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {parts} = await multipartStartUpload
    const [firstPart] = parts
    const fileSliceToUpload = fileToUpload.slice(0, defaultSettings.multipartChunkSize)

    const upload = multipartUploadPart(firstPart, fileSliceToUpload)

    setTimeout(() => {
      upload.cancel()
    }, 1)

    upload.onCancel = (): void => {
      done()
    }

    upload
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => {
        if (error.name !== 'CancelError') {
          done.fail(error)
        }
      })
  })

  it('should be able to handle progress', async(done) => {
    let progressValue = 0
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {parts} = await multipartStartUpload
    const [firstPart] = parts
    const fileSliceToUpload = fileToUpload.slice(0, defaultSettings.multipartChunkSize)

    const upload = multipartUploadPart(firstPart, fileSliceToUpload)

    upload.onProgress = (progressEvent: ProgressEvent): void => {
      progressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    }

    upload
      .then(() => progressValue > 0 ? done() : done.fail())
      .catch(error => done.fail(error))
  })
})
