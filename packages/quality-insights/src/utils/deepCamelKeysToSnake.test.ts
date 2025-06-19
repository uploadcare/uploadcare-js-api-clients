import { describe, expect, it } from 'vitest'
import { deepCamelKeysToSnake } from './deepCamelKeysToSnake'

describe('deepCamelKeysToSnake', () => {
  it('should convert camelCase keys to snake_case', () => {
    const input = {
      eventType: 'init-solution',
      payload: {},
      appVersion: '1.16.2',
      appName: 'blocks',
      sessionId: 'd724dada-a5d1-4901-90d5-c954f95f2312',
      component: 'uc-file-uploader-regular',
      activity: null,
      projectPubkey: 'demopublickey',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
    }

    const expectedOutput = {
      activity: null,
      app_name: 'blocks',
      app_version: '1.16.2',
      component: 'uc-file-uploader-regular',
      event_type: 'init-solution',
      payload: {},
      project_pubkey: 'demopublickey',
      session_id: 'd724dada-a5d1-4901-90d5-c954f95f2312',
      user_agent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
    }

    expect(deepCamelKeysToSnake(input)).toEqual(expectedOutput)
  })
})
