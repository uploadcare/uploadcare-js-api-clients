import {multipartUpload} from './multipartUpload'

describe('multipartUpload', () => {
  it('should return UCRequest', () => {
    const ucRequest = multipartUpload({})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })
})
