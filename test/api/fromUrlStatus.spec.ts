import fromUrlStatus, {StatusEnum} from '../../src/api/fromUrlStatus'
import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import UploadcareError from '../../src/errors/UploadcareError'
import CancelError from '../../src/errors/CancelError'

describe('API - from url status', () => {
  const token = factory.token('valid')
  const settings = getSettingsForTesting()

  it('should return info about file uploaded from url', async () => {
    const data = await fromUrlStatus(token, settings)

    expect(data.status).toBeTruthy()

    if (data.status === StatusEnum.Progress || data.status === StatusEnum.Success) {
      expect(data.done).toBeTruthy()
      expect(data.total).toBeTruthy()
    } else if (data.status === StatusEnum.Error) {
      expect(data.error).toBeTruthy()
    }
  })

  it('should be rejected with empty token', async () => {
    const token = factory.token('empty')
    const upload = fromUrlStatus(token, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })

  it('should be able to cancel uploading', async () => {
    const upload = fromUrlStatus(token, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const upload = fromUrlStatus(token, settings)
    const onCancel = jasmine.createSpy('onCancel')

    upload.onCancel = onCancel
    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })
})
