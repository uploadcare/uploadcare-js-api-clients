import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'

import fileFrom from '../../src/fileFrom/fileFrom'
import CancelController from '../../src/tools/CancelController'

describe('fileFrom Object', () => {
  it('should resolves when file is ready on CDN', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await fileFrom(fileToUpload, settings)

    expect(file.cdnUrl).toBeTruthy()
  })

  it('should accept store setting', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false
    })
    const file = await fileFrom(fileToUpload, settings)

    expect(file.isStored).toBeFalsy()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new CancelController()
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      cancel: ctrl
    })
    const upload = fileFrom(fileToUpload, settings)

    setTimeout(() => {
      ctrl.cancel()
    })

    await expectAsync(upload).toBeRejectedWithError('Request canceled')
  })

  it('should accept new file name setting', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false,
      fileName: 'newFileName.jpg'
    })
    const file = await fileFrom(fileToUpload, settings)

    expect(file.name).toEqual('newFileName.jpg')
  })

  it('should be able to handle progress', async () => {
    const onProgress = jasmine.createSpy('onProgress')
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      onProgress
    })

    await fileFrom(fileToUpload, settings)

    expect(onProgress).toHaveBeenCalled()
    expect(onProgress).toHaveBeenCalledWith({ value: 1 })
  })
})
