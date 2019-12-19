import base from '../../src/api/base'
import * as factory from '../_fixtureFactory'
import CancelController from '../../src/tools/CancelController'

describe('API - base', () => {
  const fileToUpload = factory.image('blackSquare')

  it('should be able to upload data', async () => {
    const publicKey = factory.publicKey('demo')
    const { file } = await base(fileToUpload.data, { publicKey })

    expect(typeof file).toBe('string')
  })

  it('should be able to cancel uploading', async () => {
    const timeout = jasmine.createSpy('timeout')
    const publicKey = factory.publicKey('demo')
    const controller = new CancelController()
    const directUpload = base(fileToUpload.data, {
      publicKey,
      cancel: controller
    })

    controller.cancel()

    const timeoutId = setTimeout(timeout, 10)

    await expectAsync(directUpload).toBeRejectedWithError('Request canceled')

    expect(timeout).not.toHaveBeenCalled()
    clearTimeout(timeoutId)
  })

  it('should be able to handle progress', async () => {
    const publicKey = factory.publicKey('demo')
    const onProgress = jasmine.createSpy('onProgress')

    await base(fileToUpload.data, { publicKey, onProgress })

    expect(onProgress).toHaveBeenCalled()
  })
})
