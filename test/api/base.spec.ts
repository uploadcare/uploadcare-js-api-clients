import base from '../../src/api/base'
import * as factory from '../_fixtureFactory'
import {getUserAgent} from '../../src/defaultSettings'

describe('API - base', () => {
  const fileToUpload = factory.image('blackSquare')

  it('should be able to upload data', async() => {
    const directUpload = base(fileToUpload.data, {publicKey: factory.publicKey('demo')})
    const {file} = await directUpload

    expect(file).toEqual(jasmine.any(String))
  })

  it('should accept integration setting', (done) => {
    const settings = {
      publicKey: 'test',
      integration: 'Test',
    }
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
    const directUpload = base(fileToUpload.data, {publicKey: factory.publicKey('demo')})

    setTimeout(() => {
      directUpload.cancel()
    }, 10)

    directUpload
      .then(() => done.fail())
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to handle cancel uploading', (done) => {
    const directUpload = base(fileToUpload.data, {publicKey: factory.publicKey('demo')})

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
    const directUpload = base(fileToUpload.data, {publicKey: factory.publicKey('demo')})

    directUpload.onProgress = (progress) => {
      progressValue = Math.round((progress.loaded * 100) / progress.total)
    }

    directUpload
      .then(() => progressValue > 0 ? done() : done.fail())
      .catch(error => done.fail(error))
  })
})
