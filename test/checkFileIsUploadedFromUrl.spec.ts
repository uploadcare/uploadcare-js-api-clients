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
    })

    // @ts-ignore
    expect(info.status).toBe(StatusEnum.Success)
  })
  it('should be cancelable', async(done) => {
    const data = await fromUrl(sourceUrl, settings)
    // @ts-ignore
    const {token} = data
    const polling = checkFileIsUploadedFromUrl({
      token,
      settings,
    })

    setTimeout(() => {
      polling.cancel()
    }, 1)

    polling
      .then(() => done.fail('Promise should not to be resolved'))
      .catch((error) => {
        if (error.name === 'CancelError') {
          done()
        } else {
          done.fail(error)
        }
      })
  })
})
