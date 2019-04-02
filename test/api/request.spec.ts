import request, {buildFormData, createCancelController} from '../../src/api/request'
import * as factory from '../_fixtureFactory'
import axios from 'axios'
import {sleep} from '../_helpers'

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
  it('should return Promise', () => {
    expect(typeof request({path: '/info/'}).then).toBe('function')
  })

  describe('should be resolved', () => {
    it('on valid GET request', async() => {
      await expectAsync(request({
        path: '/info/',
        query: {
          pub_key: factory.publicKey('image'),
          file_id: factory.uuid('image'),
        },
      })).toBeResolvedTo({
        headers: jasmine.any(Object),
        url: 'https://upload.uploadcare.com/info/',
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
        url: 'https://upload.uploadcare.com/base/',
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
      request({
        path: '/info/',
        query: {pub_key: factory.publicKey('image')},
      })
        .then(() => done.fail())
        .catch((error) => error.name === 'UploadcareError' ? done() : done.fail(error))
    })

    it('on connection error', async() => {
      const interceptor = axios.interceptors.response.use(() => Promise.reject('error'))

      const req = request({
        path: '/info/',
        query: {
          pub_key: factory.publicKey('image'),
          file_id: factory.uuid('image'),
        },
      })

      await expectAsync(req).toBeRejected()

      axios.interceptors.response.eject(interceptor)
    })

    it('if request canceled', (done) => {
      const source = createCancelController()

      request({
        path: '/info/',
        query: {
          pub_key: factory.publicKey('image'),
          file_id: factory.uuid('image'),
        },
        cancelToken: source.token,
      })
        .then(() => done.fail())
        .catch(error => {
          (error.name === 'CancelError')
            ? done()
            : done.fail(error)
        })

      source.cancel()
    })
  })
})
