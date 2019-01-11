import * as factory from './_fixtureFactory'
import fileFrom from '../src/fileFrom'
import {sleep} from './_helpers'

describe('fileFrom', () => {
  const fileToUpload = factory.image('blackSquare')

  it('should resolves when file is ready on CDN', async() => {
    const fileUpload = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

    const file = await fileUpload

    expect(fileUpload.status).toBe('ready')
    expect(file.is_ready).toBe(true)
  })

  it('should accept doNotStore setting', async() => {
    const fileUpload = fileFrom('object', fileToUpload.data, {
      publicKey: factory.publicKey('demo'),
      doNotStore: true,
    })

    await expectAsync(fileUpload).toBeResolvedTo(jasmine.objectContaining({is_stored: false}))
  })

  it('should be able to cancel uploading', (done) => {
    const fileUpload = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

    setTimeout(() => {
      fileUpload.cancel()
    }, 10)

    fileUpload
      .then(() => done.fail())
      .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
  })

  describe('should be able to handle', () => {
    /* Wait to bypass the requests limits */
    beforeEach((done) => {
      sleep(1000).then(() => done())
    })

    it('cancel uploading', (done) => {
      const fileUpload = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

      setTimeout(() => {
        fileUpload.cancel()
      }, 10)

      fileUpload.onCancel = () => {
        done()
      }

      fileUpload
        .then(() => done.fail())
        .catch((error) => {
          if (error.name !== 'CancelError') {
            done.fail(error)
          }
        })
    })

    it('progress', (done) => {
      let progress = 0
      const fileUpload = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

      fileUpload.onProgress = () => {
        progress += 1
      }

      fileUpload
        .then(() => progress ? done() : done.fail())
        .catch(error => done.fail(error))
    })

    it('uploaded', (done) => {
      const fileUpload = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

      fileUpload.onUploaded = () => {
        done()
      }

      fileUpload
        .then(() => done.fail())
        .catch(error => done.fail(error))
    })

    it('ready', (done) => {
      const fileUpload = fileFrom('object', fileToUpload.data, {publicKey: factory.publicKey('demo')})

      fileUpload.onReady = () => {
        done()
      }

      fileUpload
        .catch(error => done.fail(error))
    })
  })
})
