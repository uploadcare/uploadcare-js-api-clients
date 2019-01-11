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

  describe('fileFrom', () => {
    it('should resolves when file is ready on CDN', async() => {
      const fileToUpload = factory.image('blackSquare')

      const client = new UploadClient({publicKey: factory.publicKey('demo')})

      const file = client.fileFrom('object', fileToUpload.data)

      const fileInfo = await file

      expect(file.status).toBe('ready')
      expect(fileInfo.is_ready).toBe(true)
    })

    it('should accept doNotStore setting', async() => {
      const fileToUpload = factory.image('blackSquare')

      const client = new UploadClient({publicKey: factory.publicKey('demo')})

      const file = client.fileFrom('object', fileToUpload.data, {doNotStore: true})

      await expectAsync(file).toBeResolvedTo(jasmine.objectContaining({is_stored: false}))
    })

    it('should be able to cancel uploading', (done) => {
      const fileToUpload = factory.image('blackSquare')

      const client = new UploadClient({publicKey: factory.publicKey('demo')})

      const file = client.fileFrom('object', fileToUpload.data)

      setTimeout(() => {
        file.cancel()
      }, 10)

      file
        .then(() => done.fail())
        .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
    })

    it('should be able to handle cancel uploading', (done) => {
      const fileToUpload = factory.image('blackSquare')

      const client = new UploadClient({publicKey: factory.publicKey('demo')})

      const file = client.fileFrom('object', fileToUpload.data)

      setTimeout(() => {
        file.cancel()
      }, 10)

      file.onCancel = () => {
        done()
      }

      file
        .then(() => done.fail())
        .catch((error) => {
          if (error.name !== 'CancelError') {
            done.fail(error)
          }
        })
    })

    it('should be able to handle progress', (done) => {
      let progress = 0
      const fileToUpload = factory.image('blackSquare')

      const client = new UploadClient({publicKey: factory.publicKey('demo')})

      const file = client.fileFrom('object', fileToUpload.data)

      file.onProgress = () => {
        progress += 1
      }

      file
        .then(() => progress ? done() : done.fail())
        .catch(error => done.fail(error))
    })
  })
})
