import info from './info'
import * as factory from '/test/fileFactory'

describe('info', () => {
  it('should return UCRequest', () => {
    const ucRequest = info({})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.response).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })

  it('should get info about some file', async() => {
    const uuid = factory.uuid('image')
    const publicKey = factory.publicKey('image')

    const ucRequest = info(uuid, {
      pub_key: publicKey,
      file_id: uuid,
      jsonerrors: 1,
    })

    const {code, response} = await ucRequest.response

    expect.assertions(4)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(response.is_image).toBeTruthy()
    expect(response.uuid).toBe(uuid)
  })
})
