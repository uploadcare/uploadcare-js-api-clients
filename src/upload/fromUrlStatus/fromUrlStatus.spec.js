import {fromUrlStatus} from './fromUrlStatus'
import * as factory from '../../../test/fixtureFactory'
import {fromUrl} from '../fromUrl/fromUrl'

describe('fromUrlStatus', () => {
  it('should return UCRequest', () => {
    const token = factory.token('valid')
    const ucRequest = fromUrlStatus(token)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })
  it('should return info about file uploaded from url', async() => {
    const sourceUrl = factory.imageUrl('valid')
    const options = {
      publicKey: factory.publicKey('demo'),
      store: true,
      fileName: 'newFileName',
    }
    const ucFromUrlRequest = fromUrl(sourceUrl, options)

    const {data: {token}} = await ucFromUrlRequest.promise
    const ucRequest = fromUrlStatus(token)

    const {code, data} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.status).toBe('success')
  })
  it('should fail with error: [HTTP 400] token is required.', async() => {
    const token = factory.token('empty')
    const ucRequest = fromUrlStatus(token)

    const {code, data} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(data).toBeTruthy()
    expect(data.error.content).toBe('token is required.')
  })
})
