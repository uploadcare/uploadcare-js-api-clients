import fromUrl, {TypeEnum} from '../../src/api/fromUrl'
import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'

describe('API - from url', () => {
  it('should return token for file', async() => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })
    const data = await fromUrl(sourceUrl, settings)

    expect(data.type).toEqual(TypeEnum.Token)

    if (data.type === TypeEnum.Token) {
      expect(data.token).toBeTruthy()
    }
  })

  it('should return file info', async() => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      checkForUrlDuplicates: true,
      saveUrlForRecurrentUploads: true,
    })
    const data = await fromUrl(sourceUrl, settings)

    expect(data.type).toEqual(TypeEnum.FileInfo)
  })

  it('should be rejected with bad options', (done) => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    })

    fromUrl(sourceUrl, settings)
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })

  it('should be rejected with image that does not exists', (done) => {
    const sourceUrl = factory.imageUrl('doesNotExist')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })

    fromUrl(sourceUrl, settings)
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })

  it('should be rejected with image from private IP', (done) => {
    const sourceUrl = factory.imageUrl('privateIP')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })

    fromUrl(sourceUrl, settings)
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})
