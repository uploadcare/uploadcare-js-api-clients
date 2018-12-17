import uploadRequest from '../../src/api/uploadRequest'
import * as factory from '../fixtureFactory'

describe('API - uploadRequest', () => {
  it('should be able to upload data', async() => {
    const file = factory.file(1)

    const uploading = uploadRequest({
      method: 'POST',
      path: '/base/',
      body: {
        UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
        file: file.data,
      },
    })

    const response = await uploading.promise

    expect(response.status).toBe(200)
    expect(response.data.file).toBeTruthy()
  })

  it('should be able to cancel uploading', async() => {
    const file = factory.image('blackSquare')

    const uploading = uploadRequest({
      method: 'POST',
      path: '/base/',
      body: {
        UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
        file: file.data,
      },
    })

    setTimeout(() => {
      uploading.cancel()
    }, 10)

    await expectAsync(uploading.promise).toBeRejected()
  })

  it('should be able to handle cancel uploading', (done) => {
    const file = factory.image('blackSquare')

    const uploading = uploadRequest({
      method: 'POST',
      path: '/base/',
      body: {
        UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
        file: file.data,
      },
    })

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

    const uploading = uploadRequest({
      method: 'POST',
      path: '/base/',
      body: {
        UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
        file: file.data,
      },
    })

    uploading.onProgress = () => {
      done()
    }
  })
})
