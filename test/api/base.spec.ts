import base from '../../src/api/base'
import * as factory from '../_fixtureFactory'
import {getUserAgent} from '../../src/defaultSettings'
import {getSettingsForTesting} from '../_helpers'
import CancelError from '../../src/errors/CancelError'

describe('API - base', () => {
  const fileToUpload = factory.image('blackSquare')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('demo')
  })

  it('should be able to upload data', async() => {
    const directUpload = base(fileToUpload.data, settings)
    const {file} = await directUpload

    expect(typeof file).toBe('string')
  })

  // it('should accept integration setting', async () => {
  //   const settings = getSettingsForTesting({
  //     publicKey: 'test',
  //     integration: 'Test',
  //   })
  //   const directUpload = base(fileToUpload.data, settings)
  //
  //   directUpload
  //     .then(() => done.fail('Promise should not to be resolved'))
  //     .catch((error) => {
  //       if (
  //         error.request &&
  //         error.request.headers &&
  //         error.request.headers.hasOwnProperty('X-UC-User-Agent') &&
  //         error.request.headers['X-UC-User-Agent'] === getUserAgent(settings)
  //       ) {
  //         done()
  //       }
  //       else {
  //         done.fail(error)
  //       }
  //     })
  //
  //   await (expectAsync(directUpload) as any).toBeRejected()
  // })

  it('should be able to cancel uploading', async () => {
    const directUpload = base(fileToUpload.data, settings)

    directUpload.cancel()

    await (expectAsync(directUpload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const directUpload = base(fileToUpload.data, settings)
    const onCancel = jasmine.createSpy('onCancel')

    directUpload.onCancel = onCancel
    directUpload.cancel()

    await (expectAsync(directUpload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })

  it('should be able to handle progress', async () => {
    let progressValue = 0
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })
    const directUpload = base(fileToUpload.data, settings)

    directUpload.onProgress = (progressEvent) => {
      progressValue = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    }

    await directUpload

    expect(progressValue).toBe(100)
  })
})
