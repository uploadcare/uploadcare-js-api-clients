import { describe, it } from '@jest/globals'

import { randomTargetUrl, testSettings } from '../../../test/helpers'
import { WebhookEvent } from '../../types/WebhookEvent'
import { createWebhook } from './createWebhook'
import { deleteWebhook } from './deleteWebhook'

describe('deleteWebhook', () => {
  it('should work', async () => {
    const webhook = await createWebhook(
      {
        targetUrl: randomTargetUrl(),
        event: WebhookEvent.FILE_UPLOADED
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
      deleteWebhook({ targetUrl: '' }, testSettings)
    ).rejects.toThrowError()
  })
})
