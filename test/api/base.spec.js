import base from '../../src/api/base'
import * as factory from '../_fixtureFactory'
import {getUserAgent} from '../../src/default-settings'

describe('API - base', () => {
  it('should be able to upload data', async() => {
    const file = factory.image('blackSquare')

    const directUpload = base(file.data, {publicKey: factory.publicKey('demo')})

    await expectAsync(directUpload).toBeResolvedTo({file: jasmine.any(String)})
  })

  it('should accept integration setting', (done) => {
    const settings = {
      publicKey: 'test',
      integration: 'Test',
    }
    const directUpload = base('', settings)

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
    const file = factory.image('blackSquare')

    const directUpload = base(file.data, {publicKey: factory.publicKey('demo')})

    setTimeout(() => {
      directUpload.cancel()
    }, 10)

    directUpload
      .then(() => done.fail())
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to handle cancel uploading', (done) => {
    const file = factory.image('blackSquare')

    const directUpload = base(file.data, {publicKey: factory.publicKey('demo')})

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
    let progress = 0
    const file = factory.image('blackSquare')

    const directUpload = base(file.data, {publicKey: factory.publicKey('demo')})

    directUpload.onProgress = () => {
      progress += 1
    }

    directUpload
      .then(() => progress ? done() : done.fail())
      .catch(error => done.fail(error))
  })
})
