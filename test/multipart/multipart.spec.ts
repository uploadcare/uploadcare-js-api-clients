import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import multipart from '../../src/multipart/multipart'

describe('API - multipart', () => {
  it('should be able to upload multipart file', async() => {
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const {uuid} = await multipart(fileToUpload, settings)

    expect(uuid).toBeTruthy()
  })

  it('should be able to cancel uploading', async(done) => {
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const upload = multipart(fileToUpload, settings)

    setTimeout(() => {
      upload.cancel()
    }, 1)

    upload
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to handle cancel uploading', async (done) => {
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const upload = multipart(fileToUpload, settings)

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
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const upload = multipart(fileToUpload, settings)

    upload.onProgress = (progressEvent): void => {
      progressValue = Math.round(progressEvent.loaded / progressEvent.total)
    }

    upload
      .then(() => progressValue > 0 && progressValue <= 1 ? done() : done.fail())
      .catch(error => done.fail(error))
  })
})
