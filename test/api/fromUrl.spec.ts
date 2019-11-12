import fromUrl, { TypeEnum } from '../../src/api/fromUrl'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import CancelError from '../../src/errors/CancelError'

describe('API - from url', () => {
  it('should return token for file', async () => {
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

  it('should be rejected with bad options', (done) => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    })

    fromUrl(sourceUrl, settings)
      .then(() => done.fail('Promise should not to be resolved'))
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
      .then(() => done.fail('Promise should not to be resolved'))
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
      .then(() => done.fail('Promise should not to be resolved'))
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })

  it('should be able to cancel uploading', async (done) => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })
    const upload = fromUrl(sourceUrl, settings)

    setTimeout(() => {
      upload.cancel()
    }, 1)

    upload
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  it('should be able to handle cancel uploading', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })
    const upload = fromUrl(sourceUrl, settings)

    const onCancel = jasmine.createSpy('onCancel');

    upload.onCancel = onCancel
    upload.cancel()

    // TODO: update jasmine 3.5.0 typings
    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })
})
