import { vi, expect, describe, it } from 'vitest'
import base from '../../src/api/base'
import * as factory from '../_fixtureFactory'
import { assertComputableProgress, getSettingsForTesting } from '../_helpers'
describe('API - base', () => {
  const fileToUpload = factory.image('blackSquare')

  it('should be able to upload data', async () => {
    const publicKey = factory.publicKey('demo')
    const { file } = await base(
      fileToUpload.data,
      getSettingsForTesting({ publicKey })
    )

    expect(typeof file).toBe('string')
  })

  it('should be able to cancel uploading', async () => {
    const timeout = vi.fn()
    const publicKey = factory.publicKey('demo')
    const controller = new AbortController()
    const directUpload = base(
      fileToUpload.data,
      getSettingsForTesting({ publicKey, signal: controller.signal })
    )

    controller.abort()

    const timeoutId = setTimeout(timeout, 10)

    await expect(directUpload).rejects.toThrowError('Request canceled')

    expect(timeout).not.toHaveBeenCalled()
    clearTimeout(timeoutId)
  })

  it('should be able to handle progress', async () => {
    const publicKey = factory.publicKey('demo')
    const onProgress = vi.fn()

    await base(
      fileToUpload.data,
      getSettingsForTesting({ publicKey, onProgress })
    )

    assertComputableProgress(onProgress)
  })

  it('should be rejected with error code if failed', async () => {
    const publicKey = factory.publicKey('invalid')

    await expect(
      base(fileToUpload.data, getSettingsForTesting({ publicKey }))
    ).rejects.toMatchObject({
      message: 'UPLOADCARE_PUB_KEY is invalid.',
      code: 'ProjectPublicKeyInvalidError'
    })
  })
})
