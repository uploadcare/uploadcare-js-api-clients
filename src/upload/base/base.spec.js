import base from './base'
import * as factory from '/test/fileFactory'

describe('request', () => {
  it('should return UCRequest', () => {
    const ucRequest = base({})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.response).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })

  it('should upload simple image', async() => {
    const file = factory.image('blackSquare')

    const ucRequest = base(file, {
      UPLOADCARE_PUB_KEY: 'demopublickey',
      UPLOADCARE_STORE: 0,
    })

    const {code, response} = await ucRequest.response

    expect.assertions(3)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(response.file).toBeTruthy()
  })
})
