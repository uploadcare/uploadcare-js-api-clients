import UploadcareUpload from '../src/UploadcareUpload'

describe('UploadcareUpload', () => {
  describe('should request to the right base url', () => {
    it('with default settings', async() => {
      expect.assertions(1)

      const upload = new UploadcareUpload()

      const response = await upload.api.request({path: '/info/'})

      expect(response.request.connection.servername).toBe('upload.uploadcare.com')
    })
    it('with constructor settings', async() => {
      expect.assertions(1)

      const upload = new UploadcareUpload({baseURL: 'https://upload.staging0.uploadcare.com'})

      const response = await upload.api.request({path: '/info/'})

      expect(response.request.connection.servername).toBe('upload.staging0.uploadcare.com')
    })
    it('with setSettings method', async() => {
      expect.assertions(1)

      const upload = new UploadcareUpload()

      upload.setSettings({baseURL: 'https://upload.staging0.uploadcare.com'})

      const response = await upload.api.request({path: '/info/'})

      expect(response.request.connection.servername).toBe('upload.staging0.uploadcare.com')
    })
    it('with settings as method parameter', async() => {
      expect.assertions(1)

      const upload = new UploadcareUpload()

      const response = await upload.api.request({path: '/info/'}, {baseURL: 'https://upload.staging0.uploadcare.com'})

      expect(response.request.connection.servername).toBe('upload.staging0.uploadcare.com')
    })
  })
})
