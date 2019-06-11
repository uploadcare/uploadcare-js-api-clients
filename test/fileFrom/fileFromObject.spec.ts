import * as factory from '../_fixtureFactory'
import fileFrom, {FileFrom} from '../../src/fileFrom/fileFrom'
import {getSettingsForTesting, sleep} from '../_helpers'

describe('fileFrom', () => {
  describe('Object', () => {
    const fileToUpload = factory.image('blackSquare')

    it('should resolves when file is ready on CDN', (done) => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('demo'),
      })
      const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, settings)

      filePromise
        .then(file => {
          expect(file.cdnUrl).toBeTruthy()
          done()
        })
    })

    it('should accept doNotStore setting', async() => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('demo'),
        doNotStore: true,
      })
      const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, settings)
      const file = await filePromise

      expect(file.isStored).toBeFalsy()
    })

    it('should be able to cancel uploading', (done) => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('demo'),
      })
      const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, settings)

      setTimeout(() => {
        filePromise.cancel()
      }, 1)

      filePromise
        .then(() => done.fail('Promise should not to be resolved'))
        .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
    })

    it('should accept new file name setting', async() => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('demo'),
        doNotStore: true,
        fileName: 'newFileName.jpg',
      })
      const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, settings)
      const file = await filePromise

      expect(file.name).toEqual('newFileName.jpg')
    })

    describe('should be able to handle', () => {
      it('cancel uploading', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('demo'),
        })
        const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, settings)

        setTimeout(() => {
          filePromise.cancel()
        }, 1)

        filePromise.onCancel = () => {
          done()
        }

        filePromise
          .then(() => done.fail('Promise should not to be resolved'))
          .catch((error) => {
            if (error.name !== 'CancelError') {
              done.fail(error)
            }
          })
      })

      it('progress', (done) => {
        let progressValue = 0
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('demo'),
        })
        const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, settings)

        filePromise.onProgress = (progress) => {
          const {value} = progress

          progressValue = value
        }

        filePromise
          .then(() =>
            progressValue > 0
              ? done()
              : done.fail()
          )
          .catch(error => done.fail(error))
      })

      it('uploaded', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('demo'),
        })
        const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, settings)

        filePromise.onUploaded = () => {
          done()
        }

        filePromise
          .catch(error => done.fail(error))
      })

      it('ready', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('demo'),
        })
        const filePromise = fileFrom(FileFrom.Object, fileToUpload.data, settings)

        filePromise.onReady = () => {
          done()
        }

        filePromise
          .catch(error => done.fail(error))
      })
    })
  })
})
