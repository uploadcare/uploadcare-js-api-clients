import { describe, it, expect } from 'vitest'
import fromUrl, { TypeEnum } from '../../src/api/fromUrl'
import { resetSession } from '@uploadcare/api-emulator'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'

describe('API - from url', () => {
  const sourceUrl = factory.imageUrl('valid')
  const settings = getSettingsForTesting({
    publicKey: factory.publicKey('demo')
  })

  it('should return token for file', async () => {
    const data = await fromUrl(sourceUrl, settings)

    expect(data.type).toEqual(TypeEnum.Token)

    if (data.type === TypeEnum.Token) {
      expect(data.token).toBeTruthy()
    }
  })

  it('should be rejected with bad options', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('invalid')
    })

    await expect(fromUrl(sourceUrl, settings)).rejects.toThrowError(
      'pub_key is invalid.'
    )
  })

  it('should be rejected with image that does not exists', async () => {
    const sourceUrl = factory.imageUrl('doesNotExist')
    resetSession().use('hostNotFound', { sourceUrl })

    await expect(fromUrl(sourceUrl, settings)).rejects.toThrowError(
      'Host does not exist.'
    )
  })

  it('should be rejected with image from private IP', async () => {
    const sourceUrl = factory.imageUrl('privateIP')

    await expect(fromUrl(sourceUrl, settings)).rejects.toThrowError(
      'Only public IPs are allowed.'
    )
  })

  it('should be able to cancel uploading', async () => {
    const controller = new AbortController()

    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('demo'),
      signal: controller.signal
    })

    setTimeout(() => {
      controller.abort()
    })

    await expect(fromUrl(sourceUrl, settings)).rejects.toThrowError(
      'Request canceled'
    )
  })

  it('should be rejected with error code if failed', async () => {
    const publicKey = factory.publicKey('invalid')

    await expect(
      fromUrl(sourceUrl, getSettingsForTesting({ publicKey }))
    ).rejects.toMatchObject({
      message: 'pub_key is invalid.',
      code: 'ProjectPublicKeyInvalidError'
    })
  })
})
