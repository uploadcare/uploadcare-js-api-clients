import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import groupFrom from '../../src/groupFrom/groupFrom'

describe('groupFrom', () => {
  describe('Url[]', () => {
    const sourceUrl = factory.imageUrl('valid')

    it('should resolves when file is ready on CDN', (done) => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
      })
      const groupPromise = groupFrom([sourceUrl, sourceUrl], settings)

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
      const groupPromise = groupFrom([sourceUrl, sourceUrl], settings)
      const group = await groupPromise

      expect(group.isStored).toBeFalsy()
    })

    it('should be able to cancel uploading', (done) => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
      })
      const groupPromise = groupFrom([sourceUrl, sourceUrl], settings)

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
        const groupPromise = groupFrom([sourceUrl, sourceUrl], settings)

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
        const groupPromise = groupFrom([sourceUrl, sourceUrl], settings)

        groupPromise.onProgress = (progress) => {
          const {value} = progress

          progressValue = value
        }

        groupPromise
          .then(() =>
            progressValue > 0 && progressValue <= 1
              ? done()
              : done.fail()
          )
          .catch(error => done.fail(error))
      })

      it('uploaded', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const groupPromise = groupFrom([sourceUrl, sourceUrl], settings)

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
        const groupPromise = groupFrom([sourceUrl, sourceUrl], settings)

        groupPromise.onReady = () => {
          done()
        }

        groupPromise
          .catch(error => done.fail(error))
      })
    })
  })
})
