import * as uploadcareAPI from './index'

xdescribe('FutureInitialization', () => {
  it('should export methods', () => {
    expect(uploadcareAPI.createUploadApi).toBeDefined()
  })

  it('should be able to create UploadApi instance', () => {
    const uploadApi = uploadcareAPI.createUploadApi({})

    expect(uploadApi).toBeDefined()
  })

  it('should provide api methods', () => {
    const uploadApi = uploadcareAPI.createUploadApi({})

    expect(uploadApi.request).toBeInstanceOf(Function)

    expect(uploadApi.base).toBeInstanceOf(Function)
    expect(uploadApi.info).toBeInstanceOf(Function)

    expect(uploadApi.fromUrl).toBeInstanceOf(Function)
    expect(uploadApi.fromUrlStatus).toBeInstanceOf(Function)

    expect(uploadApi.group).toBeInstanceOf(Function)
    expect(uploadApi.groupInfo).toBeInstanceOf(Function)
  })
})

xdescribe('UCRequest', () => {
  const uploadApi = uploadcareAPI.createUploadApi({})
  const request = uploadApi.request({})

  it('should be returned by any method', () => {
    expect(request).toBeDefined()
  })

  it('should have response promise', () => {
    const promise = request.promise

    expect(promise).toBeInstanceOf(Promise)
  })

  it('should have progress callback', () => {
    expect(request.progress).toBeInstanceOf(Function)
  })

  it('should have cancel method', () => {
    expect(request.cancel).toBeInstanceOf(Function)
  })
})
