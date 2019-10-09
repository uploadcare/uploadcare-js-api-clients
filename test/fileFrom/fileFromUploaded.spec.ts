import * as factory from '../_fixtureFactory'
import fileFrom from '../../src/fileFrom/fileFrom'
import {getSettingsForTesting} from '../_helpers'

describe('fileFrom', () => {
  describe('Uploaded', () => {
    const uuid = factory.uuid('image')

    it('should resolves when file is ready on CDN', async() => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
      })
      const file = await fileFrom(uuid, settings)

      expect(file.cdnUrl).toBeTruthy()
    })

    it('should be able to cancel uploading', (done) => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
      })
      const filePromise = fileFrom(uuid, settings)

      setTimeout(() => {
        filePromise.cancel()
      }, 1)

      filePromise
        .then(() => done.fail('Promise should not to be resolved'))
        .catch(error => error.name === 'CancelError' ? done() : done.fail(error))
    })

    it('should accept new file name setting', async() => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
        doNotStore: true,
        fileName: 'newFileName.jpg',
      })
      const file = await fileFrom(uuid, settings)

      expect(file.name).toEqual('newFileName.jpg')
    })

    describe('should be able to handle', () => {
      it('cancel uploading', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const filePromise = fileFrom(uuid, settings)

        setTimeout(() => {
          filePromise.cancel()
        }, 1)

        filePromise.onCancel = (): void => {
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
          publicKey: factory.publicKey('image'),
        })
        const filePromise = fileFrom(uuid, settings)

        filePromise.onProgress = (progress): void => {
          const {value} = progress

          progressValue = value
        }

        filePromise
          .then(() => progressValue > 0 && progressValue <= 1 ? done() : done.fail())
          .catch(error => done.fail(error))
      })

      it('uploaded', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const filePromise = fileFrom(uuid, settings)

        filePromise.onUploaded = (): void => {
          done()
        }

        filePromise
          .catch(error => done.fail(error))
      })

      it('ready', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const filePromise = fileFrom(uuid, settings)

        filePromise.onReady = (): void => {
          done()
        }

        filePromise
          .catch(error => done.fail(error))
      })
    })
  })
})
