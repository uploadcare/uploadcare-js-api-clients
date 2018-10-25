import * as factory from '../../../../test/fixtureFactory'
import {testProgressCallback} from '../../../../test/helpers'
import {uploadDirect} from './uploadDirect'
import {isBrowser} from '../../../util/checkers'

describe('#uploadDirect', () => {
  let originalTimeout

  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000
  })

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
  })

  it('should return UCFile instance', () => {
    const file = factory.image('blackSquare')
    const ucFile = uploadDirect(file.data, {publicKey: 'demopublickey'})

    expect(ucFile).toBeTruthy()
    expect(ucFile.promise).toBeInstanceOf(Promise)
    expect(ucFile.progress).toBeInstanceOf(Function)
    expect(ucFile.cancel).toBeInstanceOf(Function)
    expect(ucFile.getFileInfo).toBeInstanceOf(Function)
    expect(typeof ucFile.status).toBe('string')

    expect(ucFile.progress()).toBeFalsy()
  })

  it('should provide initial fileInfo', () => {
    const file = factory.image('blackSquare')
    const ucFile = uploadDirect(file.data, {
      publicKey: 'demopublickey',
      filename: 'filename',
      contentType: 'image/png',
    })

    const initialFileInfo = ucFile.getFileInfo()

    expect(initialFileInfo).toBeTruthy()
    expect(initialFileInfo.mime_type).toBe('image/png')
    expect(initialFileInfo.filename).toBe('filename')
    expect(initialFileInfo.size).toBe(file.size)
  })

  it('should be able to cancel uploading', async() => {
    const file = factory.file(1)
    const ucFile = uploadDirect(file.data, {publicKey: 'demopublickey'})

    expect.assertions(2)

    ucFile.cancel()

    await expect(ucFile.promise).rejects.toEqual(
      expect.objectContaining({type: 'UPLOAD_CANCEL'}),
    )


    expect(ucFile.status).toBe('cancelled')
  })

  it('should have success status on upload complete', async() => {
    const file = factory.image('blackSquare')
    const ucFile = uploadDirect(file.data, {publicKey: 'demopublickey'})

    expect(ucFile.status).toBe('progress')

    const fileInfo = await ucFile.promise

    expect(fileInfo).toBeTruthy()
    expect(ucFile.status).toBe('success')
    expect(typeof fileInfo.uuid).toBe('string')
  })

  it('should provide full fileInfo after upload', async() => {
    const file = factory.image('blackSquare')
    const ucFile = uploadDirect(file.data, {publicKey: 'demopublickey'})

    await ucFile.promise

    const fileInfo = ucFile.getFileInfo()

    expect(fileInfo).toBeTruthy()
    expect(ucFile.status).toBe('success')
    expect(typeof fileInfo.uuid).toBe('string')
  })

  it('should have failed status on error', async() => {
    const file = factory.image('blackSquare')
    const ucFile = uploadDirect(file.data, {publicKey: 'non'})

    expect.assertions(3)

    expect(ucFile.status).toBe('progress')

    await expect(ucFile.promise).rejects.toEqual(
      expect.objectContaining({
        type: 'APPLICATION_ERROR',
        message: 'UPLOADCARE_PUB_KEY is invalid.',
      }),
    )

    expect(ucFile.status).toBe('failed')
  })

  isBrowser() && it('should upload instance of File', async() => {
    const file = factory.image('blackSquare')
    const ucFile = uploadDirect(file.data, {publicKey: 'demopublickey'})

    const fileInfo = await ucFile.promise

    expect(fileInfo).toBeTruthy()
    expect(typeof fileInfo.uuid).toBe('string')
  })

  isBrowser() &&
    it('should provide progress for it', async() => {
      const file = factory.file(3)
      const ucFile = uploadDirect(file.data, {publicKey: 'demopublickey'})

      await testProgressCallback(ucFile.promise, ucFile.progress, file)
    })
})
