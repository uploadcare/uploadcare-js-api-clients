import { describe, it, expect } from 'vitest'
import fromUrlStatus, { Status } from '../../src/api/fromUrlStatus'
import * as factory from '../_fixtureFactory'
import { getSettingsForTesting } from '../_helpers'
import fromUrl from '../../src/api/fromUrl'

describe('API - from url status', () => {
  const token = factory.token('valid')
  const settings = getSettingsForTesting({})

  it('should return the status of a from_url job', async () => {
    const { token } = (await fromUrl(
      factory.imageUrl('valid'),
      getSettingsForTesting({ publicKey: factory.publicKey('image') })
    )) as { token: string }

    await expect(fromUrlStatus(token, settings)).resolves.toMatchObject({
      status: expect.stringMatching(/^(waiting|progress|success)$/)
    })
  })

  it('should be rejected with empty token', async () => {
    const token = factory.token('empty')
    const upload = fromUrlStatus(token, settings)

    await expect(upload).rejects.toThrowError('token is required.')
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

    await expect(fromUrlStatus(token, settings)).rejects.toThrowError(
      'Request canceled'
    )
  })

  it('answers unknown for a token it never issued, whatever the public key', async () => {
    // /from_url/status/ takes no pub_key, so an invalid one can't be refused.
    const publicKey = factory.publicKey('invalid')

    await expect(
      fromUrlStatus('token', getSettingsForTesting({ publicKey }))
    ).resolves.toEqual({
      status: Status.Unknown
    })
  })
})
