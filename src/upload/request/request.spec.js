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
    await expect(data).toEqual(
      jasmine.objectContaining({uuid: factory.uuid('image')}),
    )
  })

  it('should be resolved if server returns error', async() => {
    const ucRequest = request('GET', 'info', {})

    const {code, data} = await ucRequest.promise

    expect.assertions(2)

    await expect(code).toBe(400)
    await expect(data.error).toEqual(
      jasmine.objectContaining({content: 'file_id is required.'}),
    )
  })

  it('should be rejected on connection error', async() => {
    const interceptor = axios.interceptors.response.use(() =>
      Promise.reject('error'),
    )

    const ucRequest = request('GET', 'info', {})

    expect.assertions(1)

    await expect(ucRequest.promise).rejects.toBe('error')

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
      body: {
        UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
        file,
      },
    })

    const onProgress = jasmine.createSpy('onProgress')

    ucRequest.progress(onProgress)

    await expect(ucRequest.promise).resolves.toBeTruthy()
    await expect(onProgress).toHaveBeenCalled()

    const lastProgressArg = onProgress.calls.mostRecent().args[0]

    await expect(lastProgressArg.total).toBeGreaterThan(file.size)
    await expect(lastProgressArg.loaded).toBe(lastProgressArg.total)
  })

  it('should be able to upload data', async() => {
    expect.assertions(3)

    const file = factory.image('blackSquare')

    const ucRequest = request('POST', 'base', {
      body: {
        UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
        file,
      },
    })

    const {code, data} = await ucRequest.promise

    expect(code).toBe(200)
    expect(data.file).toBeTruthy()

    const link = factory.linkTo(data.file)
    const loaded = await axios.get(link)

    expect(loaded.status).toBe(200)
  })
})
