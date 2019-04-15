import request, {buildFormData} from '../../src/api/request'
import * as factory from '../_fixtureFactory'
import axios from 'axios'
import {Environment, getSettingsForTesting, sleep} from '../_helpers'

const environment = Environment.Staging

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
  const settings = getSettingsForTesting({}, environment)

  it('should return Promise', () => {
    const options = {
      baseURL: settings.baseURL,
      path: '/info/',
    }

    expect(typeof request(options).then).toBe('function')
  })

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

      await expectAsync(request(options)).toBeResolvedTo({
        headers: jasmine.any(Object),
        url: `${settings.baseURL}/info/`,
        data: jasmine.objectContaining({uuid: factory.uuid('image')}),
      })
    })

    it('on valid POST request', async() => {
      const file = factory.image('blackSquare')

      await expectAsync(request({
        method: 'POST',
        path: '/base/',
        body: {
          UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
          file: file.data,
        },
      })).toBeResolvedTo({
        headers: jasmine.any(Object),
        url: `${settings.baseURL}/base/`,
        data: {file: jasmine.any(String)},
      })
    })
  })

  describe('should be rejected', () => {
    /* Wait to bypass the requests limits */
    beforeAll((done) => {
      sleep(1000).then(() => done())
    })

    it('if Uploadcare returns error', (done) => {
      const options = {
        baseURL: settings.baseURL,
        path: '/info/',
        query: {pub_key: factory.publicKey('image')},
      }

      request(options)
        .then(() => done.fail())
        .catch((error) => error.name === 'UploadcareError' ? done() : done.fail(error))
    })

    it('on connection error', async() => {
      const interceptor = axios.interceptors.response.use(() => Promise.reject('error'))
      const options = {
        baseURL: settings.baseURL,
        path: '/info/',
        query: {
          pub_key: factory.publicKey('image'),
          file_id: factory.uuid('image'),
        },
      }
      const requestWithOptions = request(options)

      await expectAsync(requestWithOptions).toBeRejected()

      axios.interceptors.response.eject(interceptor)
    })

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
        .then(() => done.fail())
        .catch(error => {
          (error.name === 'CancelError')
            ? done()
            : done.fail(error)
        })

      requestWithOptions.cancel()
    })
  })
})
