import fromUrl, { TypeEnum } from '../../src/api/fromUrl'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import CancelController from '../../src/CancelController'


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

    await expectAsync(fromUrl(sourceUrl, settings)).toBeRejectedWithError('[403] pub_key is invalid.')
  })

  it('should be rejected with image that does not exists', async () => {
    const sourceUrl = factory.imageUrl('doesNotExist')

    await expectAsync(fromUrl(sourceUrl, settings)).toBeRejectedWithError('[400] Host does not exist.')
  })

  it('should be rejected with image from private IP', async () => {
    const sourceUrl = factory.imageUrl('privateIP')

    await expectAsync(fromUrl(sourceUrl, settings)).toBeRejectedWithError('[400] Only public IPs are allowed.')
  })

  it('should be able to cancel uploading', async () => {
    let controller = new CancelController()

    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
      cancel: controller
    })

    setTimeout(() => {
      controller.cancel()
    })

    await expectAsync(fromUrl(sourceUrl, settings)).toBeRejectedWithError(
      'Request canceled'
    )
  })
})
