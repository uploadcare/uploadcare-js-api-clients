import multipartStart from '../../../src/api/multipartStart'
import multipartUpload from '../../../src/api/multipartUpload'
import multipartComplete from '../../../src/api/multipartComplete'
import * as factory from '../../_fixtureFactory'
import { getSettingsForTesting } from '../../_helpers'
import { UploadClientError } from '../../../src/errors/errors'
import CancelController from '../../../src/CancelController'

const getChunk = (
  file: Buffer | Blob,
  index: number,
  fileSize: number,
  chunkSize: number
): Buffer | Blob => {
  const start = chunkSize * index
  const end = Math.min(start + chunkSize, fileSize)

  return file.slice(start, end)
}

const naiveMultipart = (file, parts, options) => Promise.all(
  parts.map((url, index) =>
    multipartUpload(
      getChunk(file.data, index, file.size, options.multipartChunkSize),
      url,
      options
    )
  )
)


fdescribe('API - multipartComplete', () => {
  it('should be able to complete upload data', async () => {
    const file = factory.file(11)
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream'
    })
    const { uuid: completedUuid, parts } = await multipartStart(file.size, settings)

    await naiveMultipart(file, parts, settings)

    const { uuid } = await multipartComplete(completedUuid, settings)

    expect(uuid).toBeTruthy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new CancelController()
    const file = factory.file(11)
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      contentType: 'application/octet-stream',
      cancel: ctrl
    })
    const { uuid: completedUuid, parts } = await multipartStart(file.size, settings)

    await naiveMultipart(file, parts, settings)

    let time
    setTimeout(() => {
      time = Date.now()
      ctrl.cancel()
    })

    await expectAsync(multipartComplete(completedUuid, settings)).toBeRejectedWithError(UploadClientError, 'Request canceled')

    expect(Date.now() - time).toBeLessThan(16)
  })

  it('should be rejected with bad options', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
    })

    const upload = multipartComplete('', settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadClientError, '[400] uuid is required.')
  })
})
