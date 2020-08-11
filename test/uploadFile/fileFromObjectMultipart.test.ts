import AbortController from 'abort-controller'
import * as factory from '../_fixtureFactory'
import uploadFile from '../../src/uploadFile'
import { getSettingsForTesting } from '../_helpers'
import { UploadClientError } from '../../src/tools/errors'

jest.setTimeout(60000)

describe('uploadFrom Object (multipart)', () => {
  const fileToUpload = factory.file(12).data
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('multipart')
  })

  it('should resolves when file is ready on CDN', async () => {
    const file = await uploadFile(fileToUpload, settings)

    expect(file.cdnUrl).toBeTruthy()
  })

  it('should accept store setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })
    const file = await uploadFile(fileToUpload, settings)

    expect(file.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new AbortController()
    const upload = uploadFile(fileToUpload, {
      ...settings,
      signal: ctrl.signal
    })

    ctrl.abort()

    await expect(upload).rejects.toThrowError(
      new UploadClientError('Request canceled')
    )
  })

  it('should accept new file name setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      doNotStore: true,
      fileName: 'newFileName.jpg'
    })
    const file = await uploadFile(fileToUpload, settings)

    expect(file.name).toEqual('newFileName.jpg')
  })

  it('should be able to handle progress', async () => {
    let progressValue = 0
    const onProgress = ({ value }) => {
      progressValue = value
    }
    const upload = uploadFile(fileToUpload, {
      ...settings,
      onProgress
    })

    await upload

    expect(progressValue).toBe(1)
  })
})
