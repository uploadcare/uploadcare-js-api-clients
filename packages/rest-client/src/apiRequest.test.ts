import { expect, it, describe } from '@jest/globals'
import { apiRequest } from '../src/apiRequest'
import { defaultSettings } from '../src/settings'
import {
  uploadcareSimpleAuthSchema,
  uploadcareAuthSchema
} from '../test/_helpers'

describe('apiRequest', () => {
  it('should pass auth using UploadcareSimpleAuthSchema', async () => {
    const response = await apiRequest({
      method: 'GET',
      path: '/files/',
      settings: {
        ...defaultSettings,
        authSchema: uploadcareSimpleAuthSchema
      }
    })

    const result = await response.json()
    expect(response.status).toBe(200)
    expect(typeof result.total).toBe('number')
  })

  it('should pass auth using UploadcareAuthSchema', async () => {
    const response = await apiRequest({
      method: 'GET',
      path: '/files/',
      settings: {
        ...defaultSettings,
        authSchema: uploadcareAuthSchema
      }
    })

    const result = await response.json()
    expect(response.status).toBe(200)
    expect(typeof result.total).toBe('number')
  })
})
