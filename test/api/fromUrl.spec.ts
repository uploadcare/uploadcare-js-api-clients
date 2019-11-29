import fromUrl, {TypeEnum} from '../../src/api/fromUrl'
import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import CancelError from '../../src/errors/CancelError'
import UploadcareError from '../../src/errors/UploadcareError'

describe('API - from url', () => {
  const sourceUrl = factory.imageUrl('valid')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('demo')
  })

  it('should return token for file', async () => {
    const data = await fromUrl(sourceUrl, settings)

    expect(data.type).toEqual(TypeEnum.Token)

    if (data.type === TypeEnum.Token) {
      expect(data.token).toBeTruthy()
    }
  })

  it('should be rejected with bad options', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    })
    const upload = fromUrl(sourceUrl, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })

  it('should be rejected with image that does not exists', async () => {
    const sourceUrl = factory.imageUrl('doesNotExist')
    const upload = fromUrl(sourceUrl, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })

  it('should be rejected with image from private IP', async () => {
    const sourceUrl = factory.imageUrl('privateIP')
    const upload = fromUrl(sourceUrl, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })

  it('should be able to cancel uploading', async () => {
    const upload = fromUrl(sourceUrl, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const upload = fromUrl(sourceUrl, settings)
    const onCancel = jasmine.createSpy('onCancel')

    upload.onCancel = onCancel
    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })
})
