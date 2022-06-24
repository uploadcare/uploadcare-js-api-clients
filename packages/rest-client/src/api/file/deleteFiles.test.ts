import { describe, it } from '@jest/globals'
import { deleteFiles } from './deleteFiles'

import { INVALID_UUID, STORE_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { storeFiles } from './storeFiles'

describe('deleteFiles', () => {
  beforeEach(async () => {
    await storeFiles({ uuids: [STORE_UUID] }, testSettings)
  })
  afterEach(async () => {
    await storeFiles({ uuids: [STORE_UUID] }, testSettings)
  })

  it('should work', async () => {
    const response = await deleteFiles(
      { uuids: [STORE_UUID, INVALID_UUID] },
      testSettings
    )
    expect(response.result[0].uuid).toBe(STORE_UUID)
    expect(response.problems[INVALID_UUID]).toEqual(INVALID_UUID)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      deleteFiles({ uuids: [] }, testSettings)
    ).rejects.toThrowError()
  })
})
