import * as factory from '../../../../test/fixtureFactory'
import {testProgressCallback} from '../../../../test/helpers'
import {uploadDirect} from './uploadDirect'
import {isBrowser} from '../../../util/checkers'

describe('#uploadDirect', () => {
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
    const file = new File([factory.image('blackSquare').data], 'filename', {type: 'image/png'})
    const ucFile = uploadDirect(file, {publicKey: 'demopublickey'})

    const initialFileInfo = ucFile.getFileInfo()

    expect(initialFileInfo).toBeTruthy()
    expect(initialFileInfo.mime_type).toBe('image/png')
    expect(initialFileInfo.filename).toBe('filename')
    expect(initialFileInfo.size).toBe(file.size)
  })

  it('should be able to cancel uploading', () => {
    const file = factory.file(1)
    const ucFile = uploadDirect(file.data, {publicKey: 'demopublickey'})

    expect(ucFile.promise).rejects.toEqual(
      expect.objectContaining({type: 'REQUEST_CANCELLED'}),
    )

    ucFile.cancel()
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

  it('should have failed status on upload error', async() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000

    const file = factory.image('blackSquare')
    const ucFile = uploadDirect(file.data, {publicKey: 'non'})

    expect.assertions(3)

    expect(ucFile.status).toBe('progress')

    await expect(ucFile.promise).rejects.toEqual(
      expect.objectContaining({
        type: 'UPLOAD_FAILED',
        payload: {
          error: {
            content: 'UPLOADCARE_PUB_KEY is invalid.',
            status_code: 403,
          },
        },
      }),
    )

    expect(ucFile.status).toBe('failed')
  })

  it('should upload instance of File', async() => {
    const file = factory.image('blackSquare')
    const ucFile = uploadDirect(file.data, {publicKey: 'demopublickey'})

    const fileInfo = await ucFile.promise

    expect(fileInfo).toBeTruthy()
    expect(typeof fileInfo.uuid).toBe('string')
  })

  it('should provide progress for it', async() => {
    const file = factory.file(3)
    const ucFile = uploadDirect(file.data, {publicKey: 'demopublickey'})

    isBrowser() &&
      (await testProgressCallback(ucFile.promise, ucFile.progress, file))
  })
})
