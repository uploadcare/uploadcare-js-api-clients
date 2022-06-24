import { describe, it } from '@jest/globals'
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

    // TODO: seems there is bug in the API, `-` are removed from the uuid here
    // expect(response.problems[INVALID_UUID]).toEqual(INVALID_UUID)

    await storeFiles({ uuids: [STORE_UUID] }, testSettings)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      deleteFiles({ uuids: [] }, testSettings)
    ).rejects.toThrowError()
  })
})
