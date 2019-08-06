import multipartComplete from '../../../src/api/multipart/multipartComplete'
import * as factory from '../../_fixtureFactory'
import {getSettingsForTesting} from '../../_helpers'
import multipartStart from '../../../src/api/multipart/multipartStart'
import multipartUpload from '../../../src/api/multipart/multipartUpload'

describe('API - multipartComplete', () => {
  it('should be able to complete upload data', async() => {
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {uuid: completedUuid, parts} = await multipartStartUpload

    await multipartUpload(fileToUpload, parts, settings)

    const upload = multipartComplete(completedUuid, settings)
    const {uuid} = await upload

    expect(uuid).toBeTruthy()
  })

  it('should be able to cancel uploading', async(done) => {
    const fileToUpload = factory.file(11).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {uuid: completedUuid, parts} = await multipartStartUpload

    await multipartUpload(fileToUpload, parts, settings)

    const upload = multipartComplete(completedUuid, settings)

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
    const multipartStartUpload = multipartStart(fileToUpload, settings)
    const {uuid: completedUuid, parts} = await multipartStartUpload

    await multipartUpload(fileToUpload, parts, settings)

    const upload = multipartComplete(completedUuid, settings)

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

  it('should be rejected with bad options', (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
    })

    multipartComplete('', settings)
      .then(() => done.fail('Promise should not to be resolved'))
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})
