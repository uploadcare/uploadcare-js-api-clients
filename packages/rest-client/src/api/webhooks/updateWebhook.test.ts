import { describe, it } from 'vitest'
import { updateWebhook } from './updateWebhook'

import { randomTargetUrl, testSettings } from '../../../test/helpers'
import { createWebhook } from './createWebhook'
import { WebhookEvent } from '../../types/WebhookEvent'

describe('updateWebhook', () => {
  it('should work', async () => {
    const webhook = await createWebhook(
      {
        targetUrl: randomTargetUrl(),
        event: WebhookEvent.FILE_UPLOADED
      },
      testSettings
    )

    const updated = await updateWebhook(
      {
        id: webhook.id,
        targetUrl: randomTargetUrl(),
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
