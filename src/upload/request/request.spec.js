import {request} from './request'
import * as factory from '../../../test/fixtureFactory'
import axios from 'axios'
import {isNode} from '../../../test/helpers'

describe('request', () => {
  it('should return UCRequest', () => {
    const ucRequest = request('GET', 'info', {})

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.progress).toBeInstanceOf(Function)
    expect(ucRequest.cancel).toBeInstanceOf(Function)

    expect(ucRequest.progress()).toBe(ucRequest)
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
      expect.objectContaining({uuid: factory.uuid('image')}),
    )
  })

  it('should be resolved if server returns error', async() => {
    const ucRequest = request('GET', 'info', {})

    const {code, data} = await ucRequest.promise

    expect.assertions(2)

    await expect(code).toBe(400)
    await expect(data.error).toEqual(
      expect.objectContaining({content: 'file_id is required.'}),
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

    const onResolve = jest.fn()
    const onReject = jest.fn()

    const ucRequest = request('GET', 'info', {
      query: {
        file_id: factory.uuid('image'),
        pub_key: factory.publicKey('image'),
      },
    })

    ucRequest.promise.then(onResolve).catch(onReject)

    ucRequest.cancel()

    await expect(ucRequest.promise).rejects.toEqual(
      expect.objectContaining({message: 'cancelled'}),
    )

    expect(onResolve).not.toHaveBeenCalled()
    expect(onReject).toHaveBeenCalled()
  })

  it('should provide progress info only in browser', async() => {
    const file = factory.file(0.01)

    const ucRequest = request('POST', 'base', {
      body: {
        UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
        file: file.data,
      },
    })

    const onProgress = jest.fn()

    ucRequest.progress(onProgress)

    await expect(ucRequest.promise).resolves.toBeTruthy()

    if (isNode()) {
      expect(onProgress).not.toHaveBeenCalled()
    }
    else {
      expect(onProgress).toHaveBeenCalled()

      const lastProgressArg =
        onProgress.mock.calls[onProgress.mock.calls.length - 1][0]

      expect(lastProgressArg.total).toBeGreaterThan(file.size)
      expect(lastProgressArg.loaded).toBe(lastProgressArg.total)
    }
  })

  it('should be able to upload data', async() => {
    expect.assertions(2)

    const file = factory.image('blackSquare')

    const ucRequest = request('POST', 'base', {
      body: {
        UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
        file: file.data,
      },
    })

    const {code, data} = await ucRequest.promise

    expect(code).toBe(200)
    expect(data.file).toBeTruthy()
  })
})
