import {fromUrlStatus} from './fromUrlStatus'
import * as factory from '../../../test/fixtureFactory'

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
    const token = factory.token('valid')
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
    expect(data.error).toBe('token is required')
  })
})
