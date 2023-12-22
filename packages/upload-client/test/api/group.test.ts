import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import group from '../../src/api/group'
import { UploadError } from '../../src/tools/UploadError'
import { GroupFileInfo } from '../../src'

describe('API - group', () => {
  const files = factory.groupOfFiles('valid')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('image')
  })

  it('should create group of files', async () => {
    const data = await group(files, settings)
    const groupFiles = data.files.filter(Boolean) as GroupFileInfo[]
    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
    expect(groupFiles[0].uuid).toBe(files[0])
    expect(groupFiles[0].defaultEffects).toBe('')
    expect(groupFiles[1].uuid).toBe(files[1].split('/')[0])
    expect(groupFiles[1].defaultEffects).toBe('resize/x800/')
  })

  it('should fail with [HTTP 400] No files[N] parameters found.', async () => {
    await expect(group([], settings)).rejects.toThrowError(
      'No files[N] parameters found.'
    )
  })

  it('should fail with [HTTP 400] This is not valid file url: http://invalid/url.', async () => {
    const files = factory.groupOfFiles('invalid')

    await expect(group(files, settings)).rejects.toThrowError(
      `This is not valid file url: ${files[0]}.`
    )
  })

  it('should fail with [HTTP 400] Some files not found.', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo')
    })

    await expect(group(files, settings)).rejects.toThrowError(
      'Some files not found.'
    )
  })

  it('should be able to cancel uploading', async () => {
    const controller = new AbortController()

    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      signal: controller.signal
    })

    setTimeout(() => {
      controller.abort()
    })

    await expect(group(files, settings)).rejects.toThrowError(
      'Request canceled'
    )
  })

  it('should be rejected with error code if failed', async () => {
    const publicKey = factory.publicKey('invalid')

    try {
      await group([], { publicKey })
    } catch (error) {
      expect((error as UploadError).message).toEqual('pub_key is invalid.')
      expect((error as UploadError).code).toEqual(
        'ProjectPublicKeyInvalidError'
      )
    }
  })
})
