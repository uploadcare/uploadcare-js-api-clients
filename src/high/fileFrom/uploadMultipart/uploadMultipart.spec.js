import * as factory from '../../../../test/fixtureFactory'
import {testProgressCallback} from '../../../../test/helpers'
import {uploadMultipart} from './uploadMultipart'
import {isBrowser} from '../../../util/checkers'

describe('#uploadMultipart', () => {
  let originalTimeout

  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000
  })

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
  })

  it('should return UCFile instance', async() => {
    const file = factory.image('blackSquare')
    const ucFile = uploadMultipart(file.data, {publicKey: 'demopublickey'})

    await expect(ucFile.promise).rejects.toBeTruthy()

    expect(ucFile).toBeTruthy()
    expect(ucFile.promise).toBeInstanceOf(Promise)
    expect(ucFile.progress).toBeInstanceOf(Function)
    expect(ucFile.cancel).toBeInstanceOf(Function)
    expect(ucFile.getFileInfo).toBeInstanceOf(Function)
    expect(typeof ucFile.status).toBe('string')

    expect(ucFile.progress()).toBeFalsy()
  })

  it('should provide initial fileInfo', async() => {
    const file = factory.image('blackSquare')
    const ucFile = uploadMultipart(file.data, {
      publicKey: 'demopublickey',
      contentType: 'image/png',
      filename: 'filename',
    })

    await expect(ucFile.promise).rejects.toBeTruthy()

    const initialFileInfo = ucFile.getFileInfo()

    expect(initialFileInfo).toBeTruthy()
    expect(initialFileInfo.mime_type).toBe('image/png')
    expect(initialFileInfo.filename).toBe('filename')
    expect(initialFileInfo.size).toBe(file.size)
  })

  it('should be able to cancel uploading', async() => {
    const file = factory.file(11)
    const ucFile = uploadMultipart(file.data, {
      publicKey: 'demopublickey',
      filename: 'test',
      contentType: 'application/octet-stream',
    })

    ucFile.cancel()

    await expect(ucFile.promise).rejects.toEqual(
      expect.objectContaining({type: 'UPLOAD_CANCEL'}),
    )

    expect(ucFile.status).toBe('cancelled')
  })

  it('should have success status on upload complete', async() => {
    const file = factory.file(11)
    const ucFile = uploadMultipart(file.data, {
      publicKey: 'demopublickey',
      filename: 'test',
      contentType: 'application/octet-stream',
    })

    expect(ucFile.status).toBe('progress')

    await expect(ucFile.promise).resolves.toEqual(
      expect.objectContaining({uuid: expect.any(String)}),
    )

    expect(ucFile.status).toBe('success')
  })

  it('should provide full fileInfo after upload', async() => {
    const file = factory.file(11)
    const ucFile = uploadMultipart(file.data, {
      publicKey: 'demopublickey',
      filename: 'test',
      contentType: 'application/octet-stream',
    })

    await expect(ucFile.promise).resolves.toBeTruthy()

    const fileInfo = ucFile.getFileInfo()

    expect(fileInfo).toBeTruthy()
    expect(ucFile.status).toBe('success')
    expect(typeof fileInfo.uuid).toBe('string')
  })

  it('should have failed status on error', async() => {
    const file = factory.image('blackSquare')
    const ucFile = uploadMultipart(file.data, {publicKey: 'non'})

    expect.assertions(3)

    expect(ucFile.status).toBe('progress')

    await expect(ucFile.promise).rejects.toEqual(
      expect.objectContaining({type: 'APPLICATION_ERROR'}),
    )

    expect(ucFile.status).toBe('failed')
  })

  isBrowser() && it('should upload instance of File', async() => {
    const file = new File([factory.file(11).data], 'filename', {type: 'image/png'})
    const ucFile = uploadMultipart(file, {publicKey: 'demopublickey'})

    await expect(ucFile.promise).resolves.toEqual(
      expect.objectContaining({uuid: expect.any(String)}),
    )
  })

  isBrowser() && it('should provide progress for it', async() => {
    const file = factory.file(11)
    const ucFile = uploadMultipart(file.data, {
      publicKey: 'demopublickey',
      filename: 'test',
      contentType: 'application/octet-stream',
    })

    await testProgressCallback(ucFile.promise, ucFile.progress, file)
  })
})
