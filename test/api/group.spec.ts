import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import group from '../../src/api/group'
import UploadcareError from '../../src/errors/UploadcareError'
import CancelError from '../../src/errors/CancelError'

describe('API - group', () => {
  const files = factory.groupOfFiles('valid')
  const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})

  it('should upload group of files', async () => {
    const data = await group(files, settings)

    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
  })

  it('should fail with [HTTP 400] no files[N] parameters found.', async () => {
    const files = []
    const upload = group(files, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })

  it('should fail with [HTTP 400] this is not valid file url: http://invalid/url.', async () => {
    const files = factory.groupOfFiles('invalid')
    const upload = group(files, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })

  it('should fail with [HTTP 400] some files not found.', async () => {
    const settings = getSettingsForTesting({publicKey: factory.publicKey('demo')})
    const upload = group(files, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })

  it('should be able to cancel uploading', async () => {
    const upload = group(files, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const upload = group(files, settings)
    const onCancel = jasmine.createSpy('onCancel')

    upload.onCancel = onCancel
    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })
})
