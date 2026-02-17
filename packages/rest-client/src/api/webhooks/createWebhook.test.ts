import { describe, it } from 'vitest'
import { createWebhook } from './createWebhook'

import { randomTargetUrl, testSettings } from '../../../test/helpers'
import { WebhookEvent } from '../../types/WebhookEvent'

describe('createWebhook', () => {
  it('should work', async () => {
    const response = await createWebhook(
      {
        targetUrl: randomTargetUrl(),
        event: WebhookEvent.FILE_UPLOADED
      },
      testSettings
    )
    expect(response.id).toBeTruthy()
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      createWebhook(
        { targetUrl: 'invalid', event: 'invalid' as WebhookEvent },
        testSettings
      )
    ).rejects.toThrowError()
  })
})
