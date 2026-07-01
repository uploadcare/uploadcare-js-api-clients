import { describe, it, expect } from '@jest/globals'
import { updateTags } from './updateTags'
import { replaceTags } from './replaceTags'

import { DEFAULT_UUID, INVALID_UUID } from '../../../test/fixtures'
import { testSettings, waitForApiFlush } from '../../../test/helpers'

async function prepare() {
  await replaceTags({ uuid: DEFAULT_UUID, tags: ['cat'] }, testSettings)
  await waitForApiFlush()
}

describe('updateTags', () => {
  it('should add and remove tags atomically', async () => {
    await prepare()

    const response = await updateTags(
      { uuid: DEFAULT_UUID, add: ['dog', 'outdoor'], delete: ['cat'] },
      testSettings
    )
    expect(response.tags).toEqual(expect.arrayContaining(['dog', 'outdoor']))
    expect(response.tags).not.toEqual(expect.arrayContaining(['cat']))
    expect(response.added).toEqual(expect.arrayContaining(['dog', 'outdoor']))
    expect(response.deleted).toEqual(expect.arrayContaining(['cat']))
  })

  it('should accept an empty body', async () => {
    const response = await updateTags({ uuid: DEFAULT_UUID }, testSettings)
    expect(Array.isArray(response.tags)).toBe(true)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      updateTags({ uuid: INVALID_UUID, add: ['cat'] }, testSettings)
    ).rejects.toThrowError()
  })
})
