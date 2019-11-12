import * as factory from './_fixtureFactory'
import checkFileIsUploadedFromUrl from '../src/checkFileIsUploadedFromUrl'
import {StatusEnum} from '../src/api/fromUrlStatus'
import {getSettingsForTesting} from './_helpers'
import fromUrl from '../src/api/fromUrl'

describe('checkFileIsUploadedFromUrl', () => {
  const sourceUrl = factory.imageUrl('valid')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('demo')
  })

  it('should be resolved if file is uploaded', async() => {
    const data = await fromUrl(sourceUrl, settings)
    // @ts-ignore
    const {token} = data
    const info = await checkFileIsUploadedFromUrl({
      token,
      settings,
    }).promise

    expect(info.status).toBe(StatusEnum.Success)
  })
  it('should be cancelable', async () => {
    const data = await fromUrl(sourceUrl, settings)
    // @ts-ignore
    const {token} = data

    const polling = checkFileIsUploadedFromUrl({
      token,
      settings,
    })

    try {
      await polling.promise

      setTimeout(() => {
        polling.cancel()
      }, 1)
    } catch (error) {
      expect(error.name === 'CancelError').toBeTruthy()
    }
  })
  it('should be rejected after timeout', async () => {
    const data = await fromUrl(sourceUrl, settings)
    // @ts-ignore
    const {token} = data

    try {
      const polling = checkFileIsUploadedFromUrl({
        token,
        settings,
      })

      await polling.promise
    } catch (error) {
      expect(error.name === 'TimeoutError').toBeTruthy()
    }
  })
})
