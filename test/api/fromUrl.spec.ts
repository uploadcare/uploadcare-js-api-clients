import fromUrl from '../../src/api/fromUrl'
import * as factory from '../_fixtureFactory'

describe('API - from url', () => {
  it('should return token for file', async() => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = {publicKey: factory.publicKey('demo')}
    const data = await fromUrl({sourceUrl}, settings)

    expect(data.type).toEqual('token')

    if (data.type === 'token') {
      expect(data.token).toBeTruthy()
    }
  })

  it('should return file info', async() => {
    const sourceUrl = factory.imageUrl('valid')
    const urlData = {
      sourceUrl,
      checkForUrlDuplicates: true,
    }
    const settings = {publicKey: factory.publicKey('demo')}
    const data = await fromUrl(urlData, settings)

    expect(data.type).toEqual('file_info')
  })

  it('should be rejected with bad options', (done) => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = {publicKey: factory.publicKey('invalid')}

    fromUrl({sourceUrl}, settings)
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })

  it('should be rejected with image that does not exists', (done) => {
    const sourceUrl = factory.imageUrl('doesNotExist')
    const settings = {publicKey: factory.publicKey('demo')}

    fromUrl({sourceUrl}, settings)
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })

  it('should be rejected with image from private IP', (done) => {
    const sourceUrl = factory.imageUrl('privateIP')
    const settings = {publicKey: factory.publicKey('demo')}

    fromUrl({sourceUrl}, settings)
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})
