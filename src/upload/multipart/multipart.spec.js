import multipart from './multipart'
import * as factory from '/test/fileFactory'

describe('multipart', () => {
  it('should return UCRequest', () => {
    const ucRequest = multipart({})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.response).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })

  it('should upload some big file', async() => {
    const file = factory.file(30)

    const ucRequest = multipart(file, {
      filename: 'myBigFile',
      source: 'local',
      size: file.size,
      content_type: 'application/octet-stream',
      part_size: 5242880,
      UPLOADCARE_PUB_KEY: 'demopublickey',
      UPLOADCARE_STORE: 0,
    })

    const {code, response} = await ucRequest.response

    expect.assertions(3)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(response.uuid).toBeDefined()
    expect(response.done).toBe(file.size)
    expect(response.total).toBe(file.size)
    expect(response.size).toBe(file.size)
  })
})
