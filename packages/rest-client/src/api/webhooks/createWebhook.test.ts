import { describe, it } from '@jest/globals'
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

  it.each(Object.values(WebhookEvent))(
    'should work for event %s on API version 0.7',
    async (event) => {
      const response = await createWebhook(
        {
          targetUrl: randomTargetUrl(),
          event,
          version: '0.7'
        },
        testSettings
      )
      expect(response.id).toBeTruthy()
      expect(response.event).toBe(event)
    }
  )

  it('should throw error if non-200 status received', async () => {
    await expect(
      createWebhook(
        { targetUrl: 'invalid', event: 'invalid' as WebhookEvent },
        testSettings
      )
    ).rejects.toThrowError()
  })
})
