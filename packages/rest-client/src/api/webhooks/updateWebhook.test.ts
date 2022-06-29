import { describe, it } from '@jest/globals'
import { updateWebhook } from './updateWebhook'

import { random, testSettings } from '../../../test/helpers'
import { createWebhook } from './createWebhook'

describe('updateWebhook', () => {
  it('should work', async () => {
    const webhook = await createWebhook(
      {
        targetUrl: `https://ucarecdn.com/?q=${random()}`,
        event: 'file.uploaded'
      },
      testSettings
    )

    const updated = await updateWebhook(
      {
        id: webhook.id,
        targetUrl: `https://ucarecdn.com/?q=${random()}`,
        isActive: false
      },
      testSettings
    )
    expect(updated.id).toBe(webhook.id)
    expect(updated.targetUrl).toBe(updated.targetUrl)
    expect(updated.isActive).toBe(false)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      updateWebhook({ id: 666, targetUrl: 'invalid' }, testSettings)
    ).rejects.toThrowError()
  })
})
