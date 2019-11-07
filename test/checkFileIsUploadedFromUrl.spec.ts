import * as factory from './_fixtureFactory'
import checkFileIsUploadedFromUrl from '../src/checkFileIsUploadedFromUrl'
import {StatusEnum} from '../src/api/fromUrlStatus'
import {getSettingsForTesting} from './_helpers'
import fromUrl from '../src/api/fromUrl'
import CancelError from '../src/errors/CancelError'

fdescribe('checkFileIsUploadedFromUrl', () => {
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

  it('should be cancelable', async(done) => {
    const data = await fromUrl(sourceUrl, settings)
    // @ts-ignore
    const {token} = data
    const polling = checkFileIsUploadedFromUrl({
      token,
      settings,
    })

    polling
      .promise
      .catch((error) => {
        if (error.name === 'CancelError') {
          done()
        } else {
          done.fail(error)
        }
      })

    setTimeout(() => {
      polling.cancel()
    }, 1)
  })

  it('should be rejected after timeout', async(done) => {
    const data = await fromUrl(sourceUrl, settings)
    // @ts-ignore
    const {token} = data
    const polling = checkFileIsUploadedFromUrl({
      token,
      settings,
      timeout: 1
    })

    polling
      .promise
      .catch((error) => {
        if (error.name === 'TimeoutError') {
          done()
        } else {
          done.fail(error)
        }
      })
  })
})
