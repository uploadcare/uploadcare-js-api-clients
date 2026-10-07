import { expect, vi, describe, it } from 'vitest'
import { uploadFile } from '../../src/uploadFile/uploadFile'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'

vi.setConfig({ testTimeout: 60000 })

describe('uploadFile', () => {
  it('should upload small files using `uploadDirect`', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await uploadFile(fileToUpload, settings)
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should upload big files using `uploadMultipart`', async () => {
    const fileToUpload = factory.file(12).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart')
    })

    const file = await uploadFile(fileToUpload, settings)
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should upload urls using `uploadFromUrl`', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await uploadFile(sourceUrl, settings)
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should uuids using `uploadFromUploaded`', async () => {
    const uuid = factory.uuid('image')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await uploadFile(uuid, settings)
    expect(file.cdnUrl).toBeTruthy()
  })
})
