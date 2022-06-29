import { describe, it } from '@jest/globals'

import { random, testSettings } from '../../../test/helpers'
import { createWebhook } from './createWebhook'
import { deleteWebhook } from './deleteWebhook'

describe('deleteWebhook', () => {
  it('should work', async () => {
    const webhook = await createWebhook(
      {
        targetUrl: `https://ucarecdn.com/?q=${random()}`,
        event: 'file.uploaded'
      },
      testSettings
    )

    const response = await deleteWebhook(
      { targetUrl: webhook.targetUrl },
      testSettings
    )
    expect(response).toBe(undefined)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      deleteWebhook({ targetUrl: 'invalid' }, testSettings)
    ).rejects.toThrowError()
  })
})
