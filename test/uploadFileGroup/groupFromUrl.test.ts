import AbortController from 'abort-controller'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import uploadFileGroup from '../../src/uploadFileGroup'
import { UploadClientError } from '../../src/tools/errors'

describe('groupFrom Url[]', () => {
  const sourceUrl = factory.imageUrl('valid')
  const files = [sourceUrl, sourceUrl]
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should resolves when file is ready on CDN', async () => {
    const { cdnUrl } = await uploadFileGroup(files, settings)

    expect(cdnUrl).toBeTruthy()
  })

  it('should accept store setting', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })
    const upload = uploadFileGroup(files, settings)
    const group = await upload

    expect(group.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new AbortController()
    const upload = uploadFileGroup(files, {
      ...settings,
      signal: ctrl.signal
    })

    ctrl.abort()

    await expect(upload).rejects.toThrowError(
      new UploadClientError('Request canceled')
    )
  })

  it('should be able to handle progress', async () => {
    let progressValue = 0
    const onProgress = ({ value }): void => {
      progressValue = value
    }
    const upload = uploadFileGroup(files, {
      ...settings,
      onProgress
    })

    await upload

    expect(progressValue).toBe(1)
  })
})
