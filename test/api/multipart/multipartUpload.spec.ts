import * as factory from '../../_fixtureFactory'
import multipartUpload from '../../../src/api/multipart/multipartUpload'
import {getSettingsForTesting} from '../../_helpers'
import multipartStart from '../../../src/api/multipart/multipartStart'

describe('API - multipartUpload', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000
  const fileToUpload = factory.file(11).data

  it('should be able to upload multipart file', async(done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {parts} = await multipartStartUpload

    multipartUpload(fileToUpload, parts, settings)
      .then(done)
      .catch(done.fail)
  })

  it('should be able to cancel uploading', async(done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {parts} = await multipartStartUpload

    const upload = multipartUpload(fileToUpload, parts, settings)

    setTimeout(() => {
      upload.cancel()
    }, 1)

    upload
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to handle cancel uploading', async (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {parts} = await multipartStartUpload

    const upload = multipartUpload(fileToUpload, parts, settings)

    setTimeout(() => {
      upload.cancel()
    }, 1)

    upload.onCancel = () => {
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
      publicKey: factory.publicKey('demo'),
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {parts} = await multipartStartUpload

    const upload = multipartUpload(fileToUpload, parts, settings)

    upload.onProgress = (progressEvent) => {
      progressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    }

    upload
      .then(() => progressValue > 0 ? done() : done.fail())
      .catch(error => done.fail(error))
  })
})
