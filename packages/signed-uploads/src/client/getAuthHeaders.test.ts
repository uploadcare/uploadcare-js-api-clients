import { describe, expect, it } from 'vitest'
import { getAuthHeaders } from './getAuthHeaders'

describe('getAuthHeaders', () => {
  it('builds the bearer header', () => {
    expect(getAuthHeaders('eyJ')).toEqual({ Authorization: 'Bearer eyJ' })
  })

  it('is spreadable when there is no token', () => {
    expect(getAuthHeaders(undefined)).toEqual({})
  })
})
