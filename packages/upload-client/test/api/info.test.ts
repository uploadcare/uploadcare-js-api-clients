import { describe, it, expect } from 'vitest'
import { DEMO_IMAGE_UUID } from '@uploadcare/api-emulator'
import base from '../../src/api/base'
import info from '../../src/api/info'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'

describe('API - info', () => {
  it('should return file info', async () => {
    // `/info/` answers about a file that exists, so upload one first.
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const fileToUpload = factory.image('blackSquare')
    const { file: uuid } = await base(fileToUpload.data, settings)
    const data = await info(uuid, settings)

    expect(data.uuid).toEqual(uuid)
  })

  it('should be rejected with bad options', async () => {
    const uuid = DEMO_IMAGE_UUID
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('empty')
    })
    const upload = info(uuid, settings)

    await expect(upload).rejects.toThrowError('pub_key is required.')
  })

  it('should be able to cancel uploading', async () => {
    const uuid = DEMO_IMAGE_UUID
    const controller = new AbortController()

    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image'),
      signal: controller.signal
    })

    setTimeout(() => {
      controller.abort()
    })

    await expect(info(uuid, settings)).rejects.toThrowError('Request canceled')
  })

  it('should be rejected with error code if failed', async () => {
    const publicKey = factory.publicKey('invalid')

    await expect(
      info('uuid', getSettingsForTesting({ publicKey }))
    ).rejects.toMatchObject({
      message: 'pub_key is invalid.',
      code: 'ProjectPublicKeyInvalidError'
    })
  })
})
