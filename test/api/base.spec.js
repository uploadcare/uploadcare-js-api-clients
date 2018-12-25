import base from '../../src/api/base'
import * as factory from '../fixtureFactory'

describe('API - base', () => {
  it('should be able to upload data', async() => {
    const file = factory.image('blackSquare')

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    const req = uploading.promise

    await expectAsync(req).toBeResolved()
    req.then(data => {
      expect(data.file).toBeTruthy()
    })
  })

  it('should be able to cancel uploading', async() => {
    const file = factory.image('blackSquare')

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    setTimeout(() => {
      uploading.cancel()
    }, 10)

    const req = uploading.promise

    await expectAsync(req).toBeRejected()
    req.catch(error => {
      expect(error.name).toBe('CancelError')
    })
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

    /* TODO Maybe cancel need to resolve instead of reject? */
    uploading.promise.catch((error) => {
      if (error.name !== 'CancelError') {
        done.fail(error)
      }
    })
  })

  it('should be able to handle progress', async() => {
    let progress = 0
    const file = factory.image('blackSquare')

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    uploading.onProgress = () => {
      progress += 1
    }

    const req = uploading.promise

    await expectAsync(req).toBeResolved()
    req.then(() => {
      expect(progress).toBeGreaterThan(0)
    })
  })
})
