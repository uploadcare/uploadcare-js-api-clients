import {fromUrlStatus} from './index'

describe('fromUrlStatus', () => {
  it('should return UCRequest', () => {
    const token = ''
    const ucRequest = fromUrlStatus(token)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
  })
  it('should return info about file uploaded from url', async() => {
    const token = ''
    const ucRequest = fromUrlStatus(token)

    const {code, response} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(response.status).toBe('success')
  })
  it('should fail with error: "FileTooBig: 1150844928 > 104857600"', async() => {
    const token = ''
    const ucRequest = fromUrlStatus(token)

    const {code, response} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(400)
    expect(response).toBeTruthy()
    expect(response.error).toBe('FileTooBig: 1150844928 > 104857600')
  })
})
