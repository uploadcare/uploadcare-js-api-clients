import fromUrl from '../../src/api/fromUrl'
import * as factory from '../_fixtureFactory'

describe('API - from url', () => {
  it('should return token for file', async() => {
    const data = await fromUrl(factory.imageUrl('valid'), {publicKey: factory.publicKey('demo')})

    expect(data.uuid).toBeTruthy()
  })

  it('should be rejected with bad options', (done) => {
    fromUrl(factory.imageUrl('valid'), {publicKey: ''})
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })

  it('should be rejected with image that does not exists', (done) => {
    fromUrl(factory.imageUrl('doesNotExist'), {publicKey: factory.publicKey('demo')})
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })

  it('should be rejected with image from private IP', (done) => {
    fromUrl(factory.imageUrl('privateIP'), {publicKey: factory.publicKey('demo')})
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})
