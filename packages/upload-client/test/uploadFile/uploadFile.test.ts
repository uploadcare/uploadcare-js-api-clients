import { expect, vi } from 'vitest'
import { uploadFile } from '../../src/uploadFile/uploadFile'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'

vi.setConfig({ testTimeout: 60000 })

/**
 * Those spying tests are commented because jest isn't able to mock statically
 * imported ESM modules So we just ensure that `uploadFile` is working at all
 * Without checking for actual upload method used
 */
describe('uploadFile', () => {
  // afterEach(() => {
  //   vi.clearAllMocks()
  // })

  it('should upload small files using `uploadDirect`', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    // const spy = vi.spyOn(uploadDirect, 'default')
    const file = await uploadFile(fileToUpload, settings)

    // expect(spy).toHaveBeenCalled()
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should upload big files using `uploadMultipart`', async () => {
    const fileToUpload = factory.file(12).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart')
    })

    // const spy = vi.spyOn(uploadMultipart, 'default')
    const file = await uploadFile(fileToUpload, settings)

    // expect(spy).toHaveBeenCalled()
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should upload urls using `uploadFromUrl`', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    // const spy = vi.spyOn(uploadFromUrl, 'default')
    const file = await uploadFile(sourceUrl, settings)

    // expect(spy).toHaveBeenCalled()
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should uuids using `uploadFromUploaded`', async () => {
    const uuid = factory.uuid('image')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    // const spy = vi.spyOn(uploadFromUploaded, 'default')
    const file = await uploadFile(uuid, settings)

    // expect(spy).toHaveBeenCalled()
    expect(file.cdnUrl).toBeTruthy()
  })
})
