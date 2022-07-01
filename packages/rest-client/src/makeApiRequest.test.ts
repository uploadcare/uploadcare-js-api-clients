import { describe, expect, it } from '@jest/globals'
import { makeApiRequest } from './makeApiRequest'
import {
  testSettings,
  uploadcareAuthSchema,
  uploadcareSimpleAuthSchema
} from '../test/helpers'

describe('apiRequest', () => {
  it('should pass auth using UploadcareSimpleAuthSchema', async () => {
    const { response } = await makeApiRequest(
      {
        method: 'GET',
        path: '/files/'
      },
      {
        ...testSettings,
        authSchema: uploadcareSimpleAuthSchema
      }
    )

    const result = await response.json()
    expect(response.status).toBe(200)
    expect(typeof result.total).toBe('number')
  })

  it('should pass auth using UploadcareAuthSchema', async () => {
    const { response } = await makeApiRequest(
      {
        method: 'GET',
        path: '/files/'
      },
      {
        ...testSettings,
        authSchema: uploadcareAuthSchema
      }
    )

    const result = await response.json()
    expect(response.status).toBe(200)
    expect(typeof result.per_page).toBe('number')
  })

  it('should accept URL query', async () => {
    const { response } = await makeApiRequest(
      {
        method: 'GET',
        path: '/files/',
        query: {
          limit: 1
        }
      },
      testSettings
    )

    const result = await response.json()
    expect(response.status).toBe(200)
    expect(result.per_page).toBe(1)
  })

  // TODO: find faster way to check body working
  it('should accept body', async () => {
    const { response: deleteResponse } = await makeApiRequest(
      {
        method: 'DELETE',
        path: '/webhooks/unsubscribe/',
        body: {
          target_url: 'https://ucarecdn.com'
        }
      },
      testSettings
    )
    expect(deleteResponse.status).toEqual(204)

    const { response: createResponse } = await makeApiRequest(
      {
        method: 'POST',
        path: '/webhooks/',
        body: {
          target_url: 'https://ucarecdn.com',
          event: 'file.uploaded',
          is_active: false
        }
      },
      testSettings
    )

    const result = await createResponse.json()
    expect(createResponse.status).toBe(201)
    expect(typeof result.id).toBe('number')
    expect(result.target_url).toBe('https://ucarecdn.com')
    expect(result.event).toBe('file.uploaded')
  })
})
