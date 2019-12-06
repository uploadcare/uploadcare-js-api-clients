import request from '../../src/api/request/request'
import {buildFormData} from '../../src/api/request/buildFormData'
import * as factory from '../_fixtureFactory'
import {getSettingsForTesting, sleep} from '../_helpers'
import RequestWasThrottledError from '../../src/errors/RequestWasThrottledError'
import RequestError from '../../src/errors/RequestError'
import UploadcareError from '../../src/errors/UploadcareError'
import CancelError from '../../src/errors/CancelError'

describe('API – request', () => {
  const settings = getSettingsForTesting()

  describe('should be resolved', () => {
    it('on valid GET request', async () => {
      const options = {
        baseURL: settings.baseURL,
        path: '/info/',
        query: {
          pub_key: factory.publicKey('image'),
          file_id: factory.uuid('image'),
        },
      }
      const result = await request(options)

      expect(typeof result.headers).toBe('object')
      expect(result.url).toBe(`${settings.baseURL}/info/`)
      expect(typeof result.data).toBe('object')
      expect(result.data.uuid).toBe(factory.uuid('image'))
    })

    it('on valid POST request', async () => {
      const file = factory.image('blackSquare')
      const options = {
        method: 'POST',
        path: '/base/',
        body: {
          UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
          file: file.data,
        },
      }
      const result = await request(options)

      expect(typeof result.headers).toBe('object')
      expect(result.url).toBe(`https://upload.uploadcare.com/base/`)
      expect(typeof result.data).toBe('object')
      expect(typeof result.data.file).toBe('string')
    })

    it('if request was throttled and max retries 1', async () => {
      // Run this case only in dev mode
      if (process.env.NODE_ENV === 'production') {
        return Promise.resolve()
      }

      const options = {
        method: 'POST',
        baseURL: settings.baseURL,
        path: '/throttle/',
        query: {pub_key: factory.publicKey('demo')},
      }
      const throttle = request(options)

      await expectAsync(throttle).toBeResolved()
    })
  })

  describe('should be rejected', () => {
    it('if Uploadcare returns error', async () => {
      const options = {
        baseURL: settings.baseURL,
        path: '/info/',
        query: {pub_key: factory.publicKey('image')},
      }
      const upload = request(options)

      await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
    })

    // it('on connection error', async() => {
    //   const interceptor = axios.interceptors.response.use(() => Promise.reject('error'))
    //   const options = {
    //     baseURL: settings.baseURL,
    //     path: '/info/',
    //     query: {
    //       pub_key: factory.publicKey('image'),
    //       file_id: factory.uuid('image'),
    //     },
    //   }
    //   const requestWithOptions = request(options)

    //   await expectAsync(requestWithOptions).toBeRejected()

    //   axios.interceptors.response.eject(interceptor)
    // })

    it('if promise canceled', async () => {
      const options = {
        baseURL: settings.baseURL,
        path: '/info/',
        query: {
          pub_key: factory.publicKey('image'),
          file_id: factory.uuid('image'),
        },
      }
      const upload = request(options)

      upload.cancel()

      await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
    })

    it('if request was throttled and max retries 0', async () => {
      // Run this case only in dev mode
      if (process.env.NODE_ENV === 'production') {
        return Promise.resolve()
      }

      const options = {
        method: 'POST',
        baseURL: settings.baseURL,
        path: '/throttle/',
        query: {pub_key: factory.publicKey('demo')},
        retryThrottledMaxTimes: 0,
      }

      const errorRequest = {
        headers: {
          "accept": "application/json, text/plain, */*",
          "content-type": "application/x-www-form-urlencoded",
          "x-uc-user-agent": "UploadcareUploadClient/1.0.0-alpha.4 (JavaScript)",
          "user-agent": "axios/0.19.0",
          "host": "localhost:3000",
          "connection": "close",
          "content-length": "0"
        },
        url: 'http://localhost:3000/throttle',
      }
      const errorResponse = {
        status: 429,
        statusText: 'Request was throttled.',
      }
      const requestError = new RequestError(errorRequest, errorResponse)
      const error = new RequestWasThrottledError(requestError, options.retryThrottledMaxTimes)

      await expectAsync(request(options)).toBeRejectedWith(error)
    })
  })
})
