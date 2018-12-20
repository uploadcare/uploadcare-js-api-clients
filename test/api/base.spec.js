import base from '../../src/api/base'
import * as factory from '../fixtureFactory'

describe('API - base', () => {
  it('should be able to upload data', async() => {
    const file = factory.image('blackSquare')

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    const response = await uploading.promise

    expect(response.file).toBeTruthy()
  })

  it('should be able to cancel uploading', async() => {
    const file = factory.image('blackSquare')

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    setTimeout(() => {
      uploading.cancel()
    }, 10)

    await expectAsync(uploading.promise).toBeRejected()
  })

  it('should be able to handle cancel uploading', (done) => {
    const file = factory.image('blackSquare')

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    /* TODO Maybe cancel need to resolve instead of reject? */
    uploading.promise.catch(() => {})

    uploading.onCancel = () => {
      done()
    }

    setTimeout(() => {
      uploading.cancel()
    }, 10)
  })

  it('should be able to handle progress', (done) => {
    const file = factory.image('blackSquare')

    const uploading = base(file.data, {publicKey: factory.publicKey('demo')})

    uploading.onProgress = () => {
      done()
    }
  })
})
