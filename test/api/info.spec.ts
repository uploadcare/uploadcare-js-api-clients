import info from '../../src/api/info'
import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import UploadcareError from '../../src/errors/UploadcareError'
import CancelError from '../../src/errors/CancelError'

describe('API - info', () => {
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })
  const uuid = factory.uuid('image')

  it('should return file info', async () => {
    const data = await info(uuid, settings)

    expect(data.uuid).toBeTruthy()
  })

  it('should be rejected with bad options', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('empty'),
    })
    const upload = info(uuid, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })

  it('should be able to cancel uploading', async () => {
    const upload = info(uuid, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const onCancel = jasmine.createSpy('onCancel')
    const upload = info(uuid, settings, {onCancel})

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })
})
