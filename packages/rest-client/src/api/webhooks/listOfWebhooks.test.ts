import { describe, it } from '@jest/globals'

import { randomTargetUrl, testSettings } from '../../../test/helpers'
import { createWebhook } from './createWebhook'
import { listOfWebhooks } from './listOfWebhooks'

describe('listOfWebhooks', () => {
  it('should work', async () => {
    const webhook = await createWebhook(
      {
        targetUrl: randomTargetUrl(),
        event: 'file.uploaded'
      },
      testSettings
    )

    const response = await listOfWebhooks({}, testSettings)
    expect(response).toEqual(expect.arrayContaining([webhook]))
  })
})
