import { describe, it } from 'vitest'
import { deleteFiles } from './deleteFiles'

import { INVALID_UUID, STORE_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { storeFiles } from './storeFiles'

describe('deleteFiles', () => {
  it('should work', async () => {
    const response = await deleteFiles(
      { uuids: [STORE_UUID, INVALID_UUID] },
      testSettings
    )
    expect(response.result[0].uuid).toBe(STORE_UUID)
    expect(response.problems).toHaveProperty(INVALID_UUID)
    expect(response.problems[INVALID_UUID]).toEqual('Invalid')

    await storeFiles({ uuids: [STORE_UUID] }, testSettings)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      deleteFiles({ uuids: [] }, testSettings)
    ).rejects.toThrowError()
  })
})
