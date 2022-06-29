import { describe, it } from '@jest/globals'
import { createWebhook } from './createWebhook'

import { random, testSettings } from '../../../test/helpers'

describe('createWebhook', () => {
  it('should work', async () => {
    const response = await createWebhook(
      {
        targetUrl: `https://ucarecdn.com/?q=${random()}`,
        event: 'file.uploaded'
      },
      testSettings
    )
    expect(response.id).toBeTruthy()
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      createWebhook({ targetUrl: 'invalid', event: 'invalid' }, testSettings)
    ).rejects.toThrowError()
  })
})
