import UploadClient from '../src/UploadClient'
import * as factory from './_fixtureFactory'

describe('UploadClient', () => {
  describe('should request to the right base url', () => {
    const requestOptions = {
      path: '/info/',
      query: {
        pub_key: factory.publicKey('image'),
        file_id: factory.uuid('image'),
      },
    }

    it('with default settings', async() => {
      const upload = new UploadClient()

      const req = upload.api.request(requestOptions)

      await expectAsync(req).toBeResolved()
      req.then(({url}) => {
        expect(url).toBe('https://upload.uploadcare.com/info/')
      })
    })
    it('with constructor settings', async() => {
      const upload = new UploadClient({baseURL: 'https://upload.staging0.uploadcare.com'})

      const req = upload.api.request(requestOptions)

      await expectAsync(req).toBeRejected()
      req.catch(error => {
        expect(error.name).toBe('UploadcareError')
        expect(error.request.url).toBe('https://upload.staging0.uploadcare.com/info/')
      })
    })
    it('with setSettings method', async() => {
      const upload = new UploadClient()

      upload.setSettings({baseURL: 'https://upload.staging0.uploadcare.com'})

      const req = upload.api.request(requestOptions)

      await expectAsync(req).toBeRejected()
      req.catch(error => {
        expect(error.name).toBe('UploadcareError')
        expect(error.request.url).toBe('https://upload.staging0.uploadcare.com/info/')
      })
    })
    it('with settings as options', async() => {
      const upload = new UploadClient()

      const req = upload.api.request({
        ...requestOptions,
        baseURL: 'https://upload.staging0.uploadcare.com',
      })

      await expectAsync(req).toBeRejected()
      req.catch(error => {
        expect(error.name).toBe('UploadcareError')
        expect(error.request.url).toBe('https://upload.staging0.uploadcare.com/info/')
      })
    })
  })
})
