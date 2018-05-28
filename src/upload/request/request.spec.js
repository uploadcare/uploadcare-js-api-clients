import {request} from './request'

describe('request', () => {
  it('should return UCRequest', () => {
    const ucRequest = request({})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.response).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })
})
