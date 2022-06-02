import { uploadFile } from '../../src/uploadFile'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import * as uploadDirect from '../../src/uploadFile/uploadDirect'
import * as uploadMultipart from '../../src/uploadFile/uploadMultipart'
import * as uploadFromUrl from '../../src/uploadFile/uploadFromUrl'
import * as uploadFromUploaded from '../../src/uploadFile/uploadFromUploaded'

describe('uploadDirect', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should upload small files using `uploadDirect`', async () => {
    const fileToUpload = factory.image('blackSquare').data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const spy = jest.spyOn(uploadDirect, 'default')
    const file = await uploadFile(fileToUpload, settings)

    expect(spy).toHaveBeenCalled()
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should upload big files using `uploadMultipart`', async () => {
    const fileToUpload = factory.file(12).data
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('multipart')
    })

    const spy = jest.spyOn(uploadMultipart, 'default')
    const file = await uploadFile(fileToUpload, settings)

    expect(spy).toHaveBeenCalled()
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should upload urls using `uploadFromUrl`', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const spy = jest.spyOn(uploadFromUrl, 'default')
    const file = await uploadFile(sourceUrl, settings)

    expect(spy).toHaveBeenCalled()
    expect(file.cdnUrl).toBeTruthy()
  })

  it('should uuids using `uploadFromUploaded`', async () => {
    const uuid = factory.uuid('image')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const spy = jest.spyOn(uploadFromUploaded, 'default')
    const file = await uploadFile(uuid, settings)

    expect(spy).toHaveBeenCalled()
    expect(file.cdnUrl).toBeTruthy()
  })
})
