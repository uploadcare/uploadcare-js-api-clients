import {request} from './request'
import * as factory from '../../../test/fileFactory'
import axios from 'axios'

fdescribe('request', () => {
  it('should return UCRequest', () => {
    const ucRequest = request('GET', 'info', {})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })

  it('should be resolved with 200 code when all input is valid', async() => {
    const ucRequest = request('GET', 'info', {
      query: {
        file_id: factory.uuid('image'),
        pub_key: factory.publicKey('image'),
      },
    })

    const {code, data} = await ucRequest.promise

    expect.assertions(2)

    await expect(code).toBe(200)
    await expect(data).toBeTruthy()
  })

  it('should be resolved if server return error', async() => {
    const ucRequest = request('GET', 'info', {})

    const {code, data} = await ucRequest.promise

    expect.assertions(2)

    await expect(code).toBe(400)
    await expect(data.error).toBeTruthy()
  })

  it('should be rejected on connection error', async() => {
    const interceptor = axios.interceptors.response.use(
      () => Promise.reject(),
      () => Promise.reject(),
    )

    const ucRequest = request('GET', 'info', {})

    expect.assertions(1)

    await expect(ucRequest.promise).rejects.toBe()

    axios.interceptors.response.eject(interceptor)
  })

  it('should be cancellable', async() => {
    expect.assertions(3)

    const onResolve = jasmine.createSpy('onResolve')
    const onReject = jasmine.createSpy('onReject')

    const ucRequest = request('GET', 'info', {
      query: {
        file_id: factory.uuid('image'),
        pub_key: factory.publicKey('image'),
      },
    })

    ucRequest.promise.then(onResolve).catch(onReject)

    ucRequest.cancel()

    await expect(ucRequest.promise).rejects.toEqual(
      jasmine.objectContaining({message: 'cancelled'}),
    )

    expect(onResolve).not.toHaveBeenCalled()
    expect(onReject).toHaveBeenCalled()
  })

  it('should provide progress info', async() => {
    expect.assertions(2)

    const file = factory.file(0.01)

    const ucRequest = request('POST', 'base', {
      query: {UPLOADCARE_PUB_KEY: factory.publicKey('demo')},
      body: file,
    })

    const onProgress = jasmine.createSpy('onProgress')

    ucRequest.progress(onProgress)

    await expect(ucRequest.promise).resolves.toBeTruthy()

    expect(onProgress).toHaveBeenCalledWith(
      jasmine.objectContaining({
        total: file.size,
        loaded: jasmine.any(Number),
      }),
    )
  })
})
