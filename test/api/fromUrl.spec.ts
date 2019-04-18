import fromUrl, {TypeEnum} from '../../src/api/fromUrl'
import * as factory from '../_fixtureFactory'
import {Environment, getSettingsForTesting} from '../_helpers'

const environment = Environment.Testing

describe('API - from url', () => {
  it('should return token for file', async() => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    }, environment)
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
    }, environment)
    const data = await fromUrl(sourceUrl, settings)

    expect(data.type).toEqual(TypeEnum.FileInfo)
  })

  it('should be rejected with bad options', (done) => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    }, environment)

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
    }, environment)

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
    }, environment)

    fromUrl(sourceUrl, settings)
      .then(() => done.fail())
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})
