import uploadRequest from '../../src/api/uploadRequest'
import * as factory from '../fixtureFactory'

describe('API - uploadRequest', () => {
  it('should be able to upload data', async() => {
    const file = factory.image('blackSquare')

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
})
