import * as uploadcare from './index'

describe('Initialization', () => {
  it('should export UploadAPI object', () => {
    expect(uploadcare.UploadAPI).toEqual({
      base: expect.any(Function),
      fromUrl: expect.any(Function),
      fromUrlStatus: expect.any(Function),
      group: expect.any(Function),
      groupInfo: expect.any(Function),
      info: expect.any(Function),
      multipartComplete: expect.any(Function),
      multipartUpload: expect.any(Function),
      multipartStart: expect.any(Function),
      request: expect.any(Function),
    })
  })
})
