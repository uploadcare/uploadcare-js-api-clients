import { describe, it } from '@jest/globals'

import { randomTargetUrl, testSettings } from '../../../test/helpers'
import { WebhookEvent } from '../../types/WebhookEvent'
import { createWebhook } from './createWebhook'
import { listOfWebhooks } from './listOfWebhooks'

describe('listOfWebhooks', () => {
  it('should work', async () => {
    const webhook = await createWebhook(
      {
        targetUrl: randomTargetUrl(),
        event: WebhookEvent.FILE_UPLOADED
      },
      testSettings
    )

    const response = await listOfWebhooks({}, testSettings)
    expect(response).toEqual(expect.arrayContaining([webhook]))
  })
})
