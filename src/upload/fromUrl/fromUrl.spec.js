import {fromUrl} from './fromUrl'
import * as factory from '../../../test/fixtureFactory'

describe('fromUrl', () => {
  it('should return UCRequest', () => {
    const sourceUrl = factory.imageUrl('valid')
    const options = {
      publicKey: factory.publicKey('demo'),
      store: false,
    }
    const ucRequest = fromUrl(sourceUrl, options)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })
  it('should return token for file from url', async() => {
    const sourceUrl = factory.imageUrl('valid')
    const options = {
      publicKey: factory.publicKey('demo'),
      store: true,
      fileName: 'newFileName',
    }
    const ucRequest = fromUrl(sourceUrl, options)

    const {code, data} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.token).toBeTruthy()
  })
  it('should fail with [HTTP 400] Host does not exist.', async() => {
    const sourceUrl = factory.imageUrl('doesNotExist')
    const options = {
      publicKey: factory.publicKey('demo'),
      store: true,
      fileName: 'newFileName',
    }
    const ucRequest = fromUrl(sourceUrl, options)

    const {code, data} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(data).toBeTruthy()
    expect(data.error).toBe('Host does not exist')
  })
  it('should fail with [HTTP 400] Only public IPs are allowed.', async() => {
    const sourceUrl = factory.imageUrl('privateIP')
    const options = {
      publicKey: factory.publicKey('demo'),
      store: false,
    }
    const ucRequest = fromUrl(sourceUrl, options)

    const {code, data} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(data).toBeTruthy()
    expect(data.error.content).toBe('Only public IPs are allowed.')
  })
})
