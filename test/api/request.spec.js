import request, {buildFormData} from '../../src/api/request'
import * as factory from '../fixtureFactory'
import axios from 'axios'

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
      const req = request({
        path: '/info/',
        query: {
          pub_key: factory.publicKey('image'),
          file_id: factory.uuid('image'),
        },
      })

      await expectAsync(req).toBeResolved()
      req.then(({data}) => {
        expect(data).toEqual(jasmine.objectContaining({uuid: factory.uuid('image')}))
      })
    })

    it('on valid POST request', async() => {
      const file = factory.image('blackSquare')

      const req = request({
        method: 'POST',
        path: '/base/',
        body: {
          UPLOADCARE_PUB_KEY: factory.publicKey('demo'),
          file: file.data,
        },
      })

      await expectAsync(req).toBeResolved()
      req.then(({data}) => {
        expect(data.file).toBeTruthy()
      })
    })
  })

  describe('should be rejected', () => {
    it('if bad request', async() => {
      const req = request({
        path: '/infoxxx/',
        query: {
          pub_key: factory.publicKey('image'),
          file_id: factory.uuid('image'),
        },
      })

      await expectAsync(req).toBeRejected()
      req.catch(error => {
        expect(error.name).toBe('RequestError')
      })
    })

    it('if Uploadcare returns error', async() => {
      const req = request({
        path: '/info/',
        query: {pub_key: factory.publicKey('image')},
      })

      await expectAsync(req).toBeRejected()
      req.catch(error => {
        expect(error.name).toBe('UploadcareError')
      })
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
      req.catch(error => {
        expect(error.name).toBe('RequestError')
      })

      axios.interceptors.response.eject(interceptor)
    })

    it('if request canceled', async() => {
      const source = axios.CancelToken.source()

      const req = request({
        path: '/info/',
        query: {
          pub_key: factory.publicKey('image'),
          file_id: factory.uuid('image'),
        },
        cancelToken: source.token,
      })

      source.cancel()

      await expectAsync(req).toBeRejected()
      req.catch(error => {
        expect(error.name).toBe('CancelError')
      })
    })
  })
})
