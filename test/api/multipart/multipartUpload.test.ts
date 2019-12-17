import * as factory from '../../_fixtureFactory'
import multipartUpload from '../../../src/api/multipartUpload'
import { getSettingsForTesting } from '../../_helpers'
import multipartStart from '../../../src/api/multipartStart'
import { UploadClientError } from '../../../src/errors/errors'
import CancelController from '../../../src/CancelController'


let parts: [string, Blob | Buffer][] = []

beforeAll(async () => {
  const file = factory.file(11)
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart'),
    contentType: 'application/octet-stream'
  })

  const { parts: urls } = await multipartStart(file.size, settings)

  parts = urls.map((url, index) => {
    const start = settings.multipartChunkSize * index
    const end = Math.min(start + settings.multipartChunkSize, file.size)
    return [url, file.data.slice(start, end)]
  })
})

describe('API - multipartUpload', () => {
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart')
  })

  it('should be able to upload multipart file', async () => {
    let [url, part] = parts[0]

    await expectAsync(
      multipartUpload(part, url, settings)
        .catch(error => console.log(error))
    ).toBeResolved()
  })

  it('should be able to cancel uploading', async () => {
    let [url, part] = parts[1]

    let cntr = new CancelController()
    const options = getSettingsForTesting({
      publicKey: factory.publicKey('multipart'),
      cancel: cntr
    })

    setTimeout(() => {
      cntr.cancel()
    })

    await expectAsync(
      multipartUpload(part, url, options)
    ).toBeRejectedWithError(UploadClientError, 'Request canceled')
  })

  // it('should be able to handle progress', async () => {
  //   const options = getSettingsForTesting({
  //     publicKey: factory.publicKey('multipart'),
  //     onProgress,
  //   })

  //   let progressValue = 0
  //   const { parts } = await multipartStart(fileToUpload, settings)
  //   const onProgress = progressEvent => {
  //     progressValue = Math.round(
  //       (progressEvent.loaded * 100) / progressEvent.total
  //     )
  //   }
  //   const upload = multipartUpload(fileToUpload, parts, settings, {
  //     onProgress
  //   })

  //   await upload

  //   expect(progressValue).toBeGreaterThan(0)
  // }, 250000)
})
