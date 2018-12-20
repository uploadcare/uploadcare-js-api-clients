import UploadClient from '../src/UploadClient'

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
})
