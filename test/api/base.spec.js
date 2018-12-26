import base from '../../src/api/base'
import * as factory from '../fixtureFactory'

describe('API - base', () => {
  it('should be able to upload data', async() => {
    const file = factory.image('blackSquare')

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    const req = uploading.promise

    await expectAsync(req).toBeResolvedTo({file: jasmine.any(String)})
  })

  it('should be able to cancel uploading', (done) => {
    const file = factory.image('blackSquare')

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    setTimeout(() => {
      uploading.cancel()
    }, 10)

    uploading.promise
      .then(() => done.fail())
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to handle cancel uploading', (done) => {
    const file = factory.image('blackSquare')

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    setTimeout(() => {
      uploading.cancel()
    }, 10)

    uploading.onCancel = () => {
      done()
    }

    uploading.promise
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

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    uploading.onProgress = () => {
      progress += 1
    }

    uploading.promise
      .then(() => progress ? done() : done.fail())
      .catch(error => done.fail(error))
  })
})
