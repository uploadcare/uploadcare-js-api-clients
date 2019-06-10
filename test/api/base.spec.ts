import base from '../../src/api/base'
import * as factory from '../_fixtureFactory'
import {getUserAgent} from '../../src/defaultSettings'
import {getSettingsForTesting} from '../_helpers'

describe('API - base', () => {
  const fileToUpload = factory.image('blackSquare')

  it('should be able to upload data', async() => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })
    const directUpload = base(fileToUpload.data, settings)
    const {file} = await directUpload

    expect(typeof file).toBe('string')
  })

  it('should accept integration setting', (done) => {
    const settings = getSettingsForTesting({
      publicKey: 'test',
      integration: 'Test',
    })
    const directUpload = base(fileToUpload.data, settings)

    directUpload
      .then(() => done.fail())
      .catch((error) => {
        if (
          error.request &&
          error.request.headers &&
          error.request.headers.hasOwnProperty('X-UC-User-Agent') &&
          error.request.headers['X-UC-User-Agent'] === getUserAgent(settings)
        ) {
          done()
        }
        else {
          done.fail(error)
        }
      })
  })

  it('should be able to cancel uploading', (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })
    const directUpload = base(fileToUpload.data, settings)

    setTimeout(() => {
      directUpload.cancel()
    }, 5)

    directUpload
      .then(() => done.fail())
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to handle cancel uploading', (done) => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })
    const directUpload = base(fileToUpload.data, settings)

    setTimeout(() => {
      directUpload.cancel()
    }, 10)

    directUpload.onCancel = () => {
      done()
    }

    directUpload
      .then(() => done.fail())
      .catch((error) => {
        if (error.name !== 'CancelError') {
          done.fail(error)
        }
      })
  })

  it('should be able to handle progress', (done) => {
    let progressValue = 0
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })
    const directUpload = base(fileToUpload.data, settings)

    directUpload.onProgress = (progressEvent) => {
      progressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    }

    directUpload
      .then(() => progressValue > 0 ? done() : done.fail())
      .catch(error => done.fail(error))
  })
})
