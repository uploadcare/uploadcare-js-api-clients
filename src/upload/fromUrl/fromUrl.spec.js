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
})
