import request from '../../src/api/request/request'
import {buildFormData} from '../../src/api/request/buildFormData'
import * as factory from '../_fixtureFactory'
import axios from 'axios'
import {getSettingsForTesting, sleep} from '../_helpers'

describe('buildFormData', () => {
  it('should return FormData with nice input object', () => {
    const file = factory.image('blackSquare').data
    const body = {
      file,
      UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
    }

    const data = buildFormData(body)

    expect(data).toBeDefined()
    expect(typeof data).toBe('object')
    expect(typeof data.append).toBe('function')
  })
})

describe('API – request', () => {
  const settings = getSettingsForTesting()

  describe('should be resolved', () => {
    it('on valid GET request', async() => {
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

    it('on valid POST request', async() => {
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

    it('if request was throttled and max retries 1', async() => {
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

      await expectAsync(request(options)).toBeResolved()
    }, 20000)
  })

  describe('should be rejected', () => {
    /* Wait to bypass the requests limits */
    beforeEach(async() => sleep(1000))

    it('if Uploadcare returns error', async(done) => {
      const options = {
        baseURL: settings.baseURL,
        path: '/info/',
        query: {pub_key: factory.publicKey('image')},
      }

      await request(options)
        .then(() => done.fail('Promise should not to be resolved'))
        .catch((error) => error.name === 'UploadcareError' ? done() : done.fail(error))
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

    it('if promise canceled', (done) => {
      const options = {
        baseURL: settings.baseURL,
        path: '/info/',
        query: {
          pub_key: factory.publicKey('image'),
          file_id: factory.uuid('image'),
        },
      }
      const requestWithOptions = request(options)

      requestWithOptions
        .then(() => done.fail('Promise should not to be resolved'))
        .catch(error => {
          (error.name === 'CancelError')
            ? done()
            : done.fail(error)
        })

      requestWithOptions.cancel()
    })

    it('if request was throttled and max retries 0', async() => {
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

      await expectAsync(request(options)).toBeRejectedWith({name: 'RequestWasThrottledError'})
    }, 20000)
  })
})
