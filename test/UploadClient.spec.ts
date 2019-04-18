import UploadClient from '../src/UploadClient'
import * as factory from './_fixtureFactory'
import {Environment, getSettingsForTesting} from './_helpers'

const environment = Environment.Testing

describe('UploadClient', () => {
  const settings = getSettingsForTesting({}, environment)

  describe('should request to the right base url', () => {
    const requestOptions = {
      baseURL: settings.baseURL,
      path: '/info/',
      query: {
        pub_key: factory.publicKey('image'),
        file_id: factory.uuid('image'),
      },
    }

    it('with default settings', async() => {
      const client = new UploadClient()

      const req = client.api.request(requestOptions)

      await expectAsync(req).toBeResolved()
      req.then(({url}) => {
        expect(url).toBe(`${settings.baseURL}/info/`)
      })
    })
    it('with constructor settings', async() => {
      const client = new UploadClient({baseURL: 'https://upload.staging0.uploadcare.com'})

      const req = client.api.request(requestOptions)

      await expectAsync(req).toBeRejected()
      req.catch(error => {
        expect(error.name).toBe('UploadcareError')
        expect(error.request.url).toBe('https://upload.staging0.uploadcare.com/info/')
      })
    })
    it('with setSettings method', async() => {
      const client = new UploadClient()

      client.setSettings({baseURL: 'https://upload.staging0.uploadcare.com'})

      const req = client.api.request(requestOptions)

      await expectAsync(req).toBeRejected()
      req.catch(error => {
        expect(error.name).toBe('UploadcareError')
        expect(error.request.url).toBe('https://upload.staging0.uploadcare.com/info/')
      })
    })
    it('with settings as options', async() => {
      const client = new UploadClient()

      const req = client.api.request({
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
