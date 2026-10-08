import { vi, expect, describe, it } from 'vitest'
import { resetSession } from '@uploadcare/api-emulator'
import * as factory from '../_fixtureFactory'
import {
  getSettingsForTesting,
  assertComputableProgress,
  assertUnknownProgress
} from '../_helpers'
import { CancelError } from '@uploadcare/api-client-utils'
import http from 'node:http'
import https, { RequestOptions } from 'node:https'
import { uploadFromUrl } from '../../src/uploadFile/uploadFromUrl'
import info from '../../src/api/info'
vi.setConfig({ testTimeout: 60000 })

// TODO: add tests for metadata
describe('uploadFromUrl', () => {
  it('should resolves when file is ready on CDN', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await uploadFromUrl(sourceUrl, settings)

    expect(file.cdnUrl).toBeTruthy()
    expect(file.uuid).toBeTruthy()
  })

  it('should wait until file is ready', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })

    const file = await uploadFromUrl(sourceUrl, settings)
    const fileInfo = await info(file.uuid, settings)

    expect(fileInfo.isReady).toBe(true)
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

  it('should accept checkForUrlDuplicates setting', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      checkForUrlDuplicates: true
    })

    const protocol = settings.baseURL.includes('https') ? 'https' : 'http'
    const isHttpsProtocol = protocol === 'https'
    const spy = vi.spyOn(isHttpsProtocol ? https : http, 'request')
    await uploadFromUrl(sourceUrl, settings)

    const uploadRequest = spy.mock.calls.find(
      (call) => (call[0] as RequestOptions).protocol === protocol + ':'
    )?.[0]
    expect(uploadRequest?.['query']).toEqual(
      expect.stringContaining('check_URL_duplicates=1')
    )
    spy.mockRestore()
  })

  it('should accept saveUrlForRecurrentUploads setting', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      saveUrlForRecurrentUploads: true
    })

    const protocol = settings.baseURL.includes('https') ? 'https' : 'http'
    const isHttpsProtocol = protocol === 'https'
    const spy = vi.spyOn(isHttpsProtocol ? https : http, 'request')
    await uploadFromUrl(sourceUrl, settings)

    const uploadRequest = spy.mock.calls.find(
      (call) => (call[0] as RequestOptions).protocol === protocol + ':'
    )?.[0]
    expect(uploadRequest?.['query']).toEqual(
      expect.stringContaining('save_URL_duplicates=1')
    )
    spy.mockRestore()
  })

  it('should be able to cancel uploading', async () => {
    const ctrl = new AbortController()
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      signal: ctrl.signal
    })

    setTimeout(() => {
      ctrl.abort()
    })

    await expect(uploadFromUrl(sourceUrl, settings)).rejects.toThrowError(
      new CancelError('Request canceled')
    )
  })

  it('should accept new file name setting', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      store: false,
      fileName: 'newFileName.jpg'
    })
    const file = await uploadFromUrl(sourceUrl, settings)

    expect(file.name).toEqual('newFileName.jpg')
  })

  it('should be able to handle computable progress', async () => {
    const onProgress = vi.fn()
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      onProgress
    })

    await uploadFromUrl(sourceUrl, settings)

    assertComputableProgress(onProgress)
  })

  it.skipIf(process.env.TEST_ENV === 'production')(
    'should be able to handle non-computable unknown progress',
    async () => {
      resetSession().use('unknownProgress')
      const onProgress = vi.fn()
      const sourceUrl = factory.imageUrl('valid')
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
        onProgress
      })

      await uploadFromUrl(sourceUrl, settings)

      assertUnknownProgress(onProgress)
    }
  )

  it('should be rejected with error code if failed', async () => {
    const sourceUrl = factory.imageUrl('valid')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    })

    await expect(uploadFromUrl(sourceUrl, settings)).rejects.toMatchObject({
      message: 'pub_key is invalid.',
      code: 'ProjectPublicKeyInvalidError'
    })
  })
})
