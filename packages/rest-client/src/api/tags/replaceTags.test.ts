import { describe, it, expect } from '@jest/globals'
import { replaceTags } from './replaceTags'

import { DEFAULT_UUID, INVALID_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'

describe('replaceTags', () => {
  it('should replace the tag set and report the diff', async () => {
    const response = await replaceTags(
      { uuid: DEFAULT_UUID, tags: ['cat', 'animal', 'cute'] },
      testSettings
    )
    expect(response.tags).toEqual(
      expect.arrayContaining(['cat', 'animal', 'cute'])
    )
    expect(Array.isArray(response.added)).toBe(true)
    expect(Array.isArray(response.deleted)).toBe(true)
  })

  it('should clear all tags when passed an empty array', async () => {
    const response = await replaceTags(
      { uuid: DEFAULT_UUID, tags: [] },
      testSettings
    )
    expect(response.tags).toEqual([])
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      replaceTags({ uuid: INVALID_UUID, tags: [] }, testSettings)
    ).rejects.toThrowError()
  })
})
