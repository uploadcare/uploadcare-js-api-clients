import {fromUrlStatus} from './fromUrlStatus'
import * as factory from '../../../test/fixtureFactory'
import * as helpers from '../../../test/helpers'
import {fromUrl} from '../fromUrl/fromUrl'

describe('fromUrlStatus', () => {
  it('should return UCRequest', () => {
    const token = factory.token('valid')
    const ucRequest = fromUrlStatus(token)

    expect(ucRequest).toBeInstanceOf(Promise)
  })
  it('should return info about file uploaded from url', async() => {
    const sourceUrl = factory.imageUrl('valid')
    const options = {
      publicKey: factory.publicKey('demo'),
      store: true,
      fileName: 'newFileName',
    }
    const ucFromUrlRequest = fromUrl(sourceUrl, options)

    const {data: {token}} = await ucFromUrlRequest

    await helpers.wait(1000)

    const ucRequest = fromUrlStatus(token)

    const {code, data} = await ucRequest

    expect.assertions(3)

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.status).toBe('success')
  })
  it('should fail with error: [HTTP 400] token is required.', async() => {
    const token = factory.token('empty')
    const ucRequest = fromUrlStatus(token)

    const {code, data} = await ucRequest

    expect.assertions(3)

    expect(code).toBe(400)
    expect(data).toBeTruthy()
    expect(data.error.content).toBe('token is required.')
  })
})
