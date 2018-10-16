import UploadcareUpload from '../src/'

describe('UploadcareUpload.api', () => {
  describe('should request to the right base url', () => {
    it('with default settings', () => {
      const upload = new UploadcareUpload()

      expect(upload.api.request()).toBe('Request to https://upload.uploadcare.com/')
    })
    it('with constructor settings', () => {
      const upload = new UploadcareUpload({baseURL: 'new base url'})

      expect(upload.api.request()).toBe('Request to new base url')
    })
    it('with setSettings method', () => {
      const upload = new UploadcareUpload()

      upload.setSettings({baseURL: 'new base url'})

      expect(upload.api.request()).toBe('Request to new base url')
    })
  })
})
