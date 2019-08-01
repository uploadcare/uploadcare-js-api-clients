import info from '../../src/api/info'
import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import group from '../../src/api/group'
import groupInfo from '../../src/api/groupInfo'

describe('API - info', () => {
  it('should return file info', async() => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const data = await info(factory.uuid('image'), settings)

    expect(data.uuid).toBeTruthy()
  })

  it('should be rejected with bad options', (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('empty'),
    })

    info(factory.uuid('image'), settings)
      .then(() => done.fail('Promise should not to be resolved'))
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })

  it('should be able to cancel uploading', async(done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const upload = info(factory.uuid('image'), settings)

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
    const upload = info(factory.uuid('image'), settings)

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
})
