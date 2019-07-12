import * as factory from '../_fixtureFactory'
import groupFrom from '../../src/groupFrom/groupFrom'
import {GroupFrom} from '../../src/groupFrom/types'
import {getSettingsForTesting} from '../_helpers'

describe('groupFrom', () => {
  describe('Object[]', () => {
    const fileToUpload = factory.image('blackSquare')

    it('should resolves when file is ready on CDN', (done) => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
      })
      const groupPromise = groupFrom(GroupFrom.Object, [fileToUpload.data], settings)

      groupPromise
        .then(group => {
          expect(group.cdnUrl).toBeTruthy()
          done()
        })
    })

    it('should accept doNotStore setting', async() => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
        doNotStore: true,
      })
      const groupPromise = groupFrom(GroupFrom.Object, [fileToUpload.data], settings)
      const group = await groupPromise

      expect(group.isStored).toBeFalsy()
    })

    it('should be able to cancel uploading', (done) => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
      })
      const groupPromise = groupFrom(GroupFrom.Object, [fileToUpload.data], settings)

      setTimeout(() => {
        groupPromise.cancel()
      }, 1)

      groupPromise
        .then(() => done.fail('Promise should not to be resolved'))
        .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
    })

    describe('should be able to handle', () => {
      it('cancel uploading', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const groupPromise = groupFrom(GroupFrom.Object, [fileToUpload.data], settings)

        setTimeout(() => {
          groupPromise.cancel()
        }, 1)

        groupPromise.onCancel = () => {
          done()
        }

        groupPromise
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
        const groupPromise = groupFrom(GroupFrom.Object, [fileToUpload.data], settings)

        groupPromise.onProgress = (progress) => {
          const {value} = progress

          progressValue = value
        }

        groupPromise
          .then(() =>
            progressValue > 0
              ? done()
              : done.fail()
          )
          .catch(error => done.fail(error))
      })

      it('uploaded', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const groupPromise = groupFrom(GroupFrom.Object, [fileToUpload.data], settings)

        groupPromise.onUploaded = () => {
          done()
        }

        groupPromise
          .catch(error => done.fail(error))
      })

      it('ready', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const groupPromise = groupFrom(GroupFrom.Object, [fileToUpload.data], settings)

        groupPromise.onReady = () => {
          done()
        }

        groupPromise
          .catch(error => done.fail(error))
      })
    })
  })
})
