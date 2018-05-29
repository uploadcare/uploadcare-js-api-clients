import {fromUrl} from './index'

describe('fromUrl', () => {
  it('should return UCRequest', () => {
    const source = ''
    const options = {}
    const ucRequest = fromUrl(source, options)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
  })
  it('should upload file from url', async() => {
    const sourceUrl = ''
    const options = {
      publicKey: '',
      store: 0,
      fileName: '',
    }
    const ucRequest = fromUrl(sourceUrl, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(4)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(response.token).toBeTruthy()
    expect(response.token).toBeInstanceOf(String)
  })
  it('should fail with [HTTP 400] Host does not exist.', async() => {
    const sourceUrl = ''
    const options = {
      publicKey: '',
      store: 0,
      fileName: '',
    }
    const ucRequest = fromUrl(sourceUrl, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(response).toBeTruthy()
    expect(response.error).toBe('Host does not exist')
  })
  it('should fail with [HTTP 400] Source is blacklisted.', async() => {
    const sourceUrl = ''
    const options = {
      publicKey: '',
      store: 0,
      fileName: '',
    }
    const ucRequest = fromUrl(sourceUrl, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(response).toBeTruthy()
    expect(response.error).toBe('Source is blacklisted')
  })
  it('should fail with [HTTP 400] URL host is malformed.', async() => {
    const sourceUrl = ''
    const options = {
      publicKey: '',
      store: 0,
      fileName: '',
    }
    const ucRequest = fromUrl(sourceUrl, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(response).toBeTruthy()
    expect(response.error).toBe('URL host is malformed')
  })
  it('should fail with [HTTP 400] Only public IPs are allowed.', async() => {
    const sourceUrl = ''
    const options = {
      publicKey: '',
      store: 0,
      fileName: '',
    }
    const ucRequest = fromUrl(sourceUrl, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(response).toBeTruthy()
    expect(response.error).toBe('Only public IPs are allowed')
  })
})
