import multipartStart from '../../../src/api/multipartStart'
import * as factory from '../../_fixtureFactory'
import { getSettingsForTesting } from '../../_helpers'
import { UploadClientError } from '../../../src/errors/errors'
import CancelController from '../../../src/CancelController'

describe('API - multipartStart', () => {
  const size = factory.file(12).size
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart'),
    contentType: 'application/octet-stream',
  })

  it('should be able to start upload data', async () => {
    const { uuid, parts } = await multipartStart(size, settings)

    expect(uuid).toBeTruthy()
    expect(parts).toBeTruthy()
  })

  it('should be able to cancel uploading', async () => {
    const cntr = new CancelController()
    const upload = multipartStart(size, {cancel: cntr, ...settings})

    setTimeout(() => {
      cntr.cancel()
    })

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadClientError, 'Request canceled')
  })

  it('should be rejected with bad options', async () => {
    const size = factory.file(9).size
    const upload = multipartStart(size, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadClientError,
      '[400] File size can not be less than 10485760 bytes. Please use direct upload instead of multipart.'
    )
  })
})
