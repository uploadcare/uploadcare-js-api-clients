import AbortController from 'abort-controller'
import info from '../../src/api/info'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'

describe('API - info', () => {
  it('should return file info', async () => {
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('image')
    })
    const uuid = factory.uuid('image')
    const data = await info(uuid, settings)

    expect(data.uuid).toBeTruthy()
  })

  it('should be rejected with bad options', async () => {
    const uuid = factory.uuid('image')
    const settings = getSettingsForTesting({
      publicKey: factory.publicKey('empty')
    })
    const upload = info(uuid, settings)

    await expect(upload).rejects.toThrowError('pub_key is required.')
  })

  it('should be able to cancel uploading', async () => {
    const uuid = factory.uuid('image')
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
})
