import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import group from '../../src/api/group'

describe('API - group', () => {
  it('should upload group of files', async() => {
    const files = factory.groupOfFiles('valid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})
    const data = await group(files, settings)

    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
  })
  it('should fail with [HTTP 400] no files[N] parameters found.', (done) => {
    const files = []
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})

    group(files, settings)
      .then(() => done.fail('Promise should not to be resolved'))
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
  it('should fail with [HTTP 400] this is not valid file url: http://invalid/url.', (done) => {
    const files = factory.groupOfFiles('invalid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})

    group(files, settings)
      .then(() => done.fail('Promise should not to be resolved'))
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
  it('should fail with [HTTP 400] some files not found.', (done) => {
    const files = factory.groupOfFiles('valid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('demo')})

    group(files, settings)
      .then(() => done.fail('Promise should not to be resolved'))
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })

  it('should be able to cancel uploading', async(done) => {
    const files = factory.groupOfFiles('valid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})
    const upload = group(files, settings)

    setTimeout(() => {
      upload.cancel()
    }, 1)

    upload
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to handle cancel uploading', async (done) => {
    const files = factory.groupOfFiles('valid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})
    const upload = group(files, settings)

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
