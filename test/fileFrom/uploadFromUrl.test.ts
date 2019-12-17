import * as factory from '../_fixtureFactory'
import uploadFromUrl from '../../src/fileFrom/uploadFromUrl'
import { getSettingsForTesting } from '../_helpers'
import { UploadClientError } from '../../src/errors/errors'
import CancelController from '../../src/CancelController'

describe('fileFrom URL', () => {
  it('should resolves when file is ready on CDN', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await uploadFromUrl(sourceUrl, settings)

    // expect(file.cdnUrl).toBeTruthy()
    expect(file.uuid).toBeTruthy()
  })

  it('should accept store setting', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })

    const file = await uploadFromUrl(sourceUrl, settings)

    expect(file.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new CancelController()
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      cancel: ctrl
    })

    setTimeout(() => {
      ctrl.cancel()
    })

    await expectAsync(uploadFromUrl(sourceUrl, settings)).toBeRejectedWithError(UploadClientError, 'Request canceled')
  })

  it('should accept new file name setting', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false,
      fileName: 'newFileName.jpg'
    })
    const file = await uploadFromUrl(sourceUrl, settings)

    expect(file.filename).toEqual('newFileName.jpg')
  })

  it('should be able to handle progress', async () => {
    const onProgress = jasmine.createSpy('onProgress')
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      onProgress
    })

    await uploadFromUrl(sourceUrl, settings)

    expect(onProgress).toHaveBeenCalled()
    expect(onProgress).toHaveBeenCalledWith({ value: 1 })
  })
})
