import { describe, it, expect } from '@jest/globals'
import { getTags } from './getTags'
import { replaceTags } from './replaceTags'

import { DEFAULT_UUID, INVALID_UUID } from '../../../test/fixtures'
import { testSettings, waitForApiFlush } from '../../../test/helpers'

async function prepare() {
  await replaceTags(
    { uuid: DEFAULT_UUID, tags: ['cat', 'animal'] },
    testSettings
  )
  await waitForApiFlush()
}

describe('getTags', () => {
  it('should return the tag list', async () => {
    await prepare()

    const response = await getTags({ uuid: DEFAULT_UUID }, testSettings)
    expect(response.tags).toEqual(expect.arrayContaining(['cat', 'animal']))
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      getTags({ uuid: INVALID_UUID }, testSettings)
    ).rejects.toThrowError()
  })
})
