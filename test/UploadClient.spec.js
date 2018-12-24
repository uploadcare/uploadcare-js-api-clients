import UploadClient from '../src/UploadClient'
import * as factory from "./fixtureFactory";

describe('UploadClient', () => {
  describe('should request to the right base url', () => {
    it('with default settings', async() => {
      const upload = new UploadClient()

      const response = await upload.api.request({path: '/info/'})

      expect(response.url).toBe('https://upload.uploadcare.com/info/')
    })
    it('with constructor settings', async() => {
      const upload = new UploadClient({baseURL: 'https://upload.staging0.uploadcare.com'})

      const response = await upload.api.request({path: '/info/'})

      expect(response.url).toBe('https://upload.staging0.uploadcare.com/info/')
    })
    it('with setSettings method', async() => {
      const upload = new UploadClient()

      upload.setSettings({baseURL: 'https://upload.staging0.uploadcare.com'})

      const response = await upload.api.request({path: '/info/'})

      expect(response.url).toBe('https://upload.staging0.uploadcare.com/info/')
    })
    it('with settings as options', async() => {
      const upload = new UploadClient()

      const response = await upload.api.request({
        path: '/info/',
        baseURL: 'https://upload.staging0.uploadcare.com',
      })

      expect(response.url).toBe('https://upload.staging0.uploadcare.com/info/')
    })
  })

  describe('fileFrom', () => {
    it('should resolves when file is ready on CDN', async() => {
      const fileToUpload = factory.file(0.5)

      const client = new UploadClient({publicKey: factory.publicKey('demo')})

      const file = client.fileFrom('object', fileToUpload.data)

      const fileInfo = await file.promise

      expect(file.status).toBe('ready')
      expect(fileInfo.is_ready).toBe(true)
    })
  })
})
