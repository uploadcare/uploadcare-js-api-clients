import * as factory from '../_fixtureFactory'
import fromUrl from '../../src/api/fromUrl'

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
})
