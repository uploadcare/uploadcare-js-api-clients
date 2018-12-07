import UploadcareUpload from '../src/UploadcareUpload'

describe('UploadcareUpload', () => {
  describe('should request to the right base url', () => {
    it('with default settings', async() => {
      const upload = new UploadcareUpload()

      const response = await upload.api.request({path: '/info/'})

      expect(response.url).toBe('https://upload.uploadcare.com/info/')
    })
    it('with constructor settings', async() => {
      const upload = new UploadcareUpload({baseURL: 'https://upload.staging0.uploadcare.com'})

      const response = await upload.api.request({path: '/info/'})

      expect(response.url).toBe('https://upload.staging0.uploadcare.com/info/')
    })
    it('with setSettings method', async() => {
      const upload = new UploadcareUpload()

      upload.setSettings({baseURL: 'https://upload.staging0.uploadcare.com'})

      const response = await upload.api.request({path: '/info/'})

      expect(response.url).toBe('https://upload.staging0.uploadcare.com/info/')
    })
    it('with settings as options', async() => {
      const upload = new UploadcareUpload()

      const response = await upload.api.request({
        path: '/info/',
        baseURL: 'https://upload.staging0.uploadcare.com',
      })

      expect(response.url).toBe('https://upload.staging0.uploadcare.com/info/')
    })
  })
})
