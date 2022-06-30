import { describe, it } from '@jest/globals'

import { randomTargetUrl, testSettings } from '../../../test/helpers'
import { createWebhook } from './createWebhook'
import { deleteWebhook } from './deleteWebhook'

describe('deleteWebhook', () => {
  it('should work', async () => {
    const webhook = await createWebhook(
      {
        targetUrl: randomTargetUrl(),
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
      deleteWebhook({ targetUrl: '' }, testSettings)
    ).rejects.toThrowError()
  })
})
