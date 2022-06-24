import { describe, it } from '@jest/globals'
import { storeFiles } from './storeFiles'

import { INVALID_UUID, STORE_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'

describe('storeFiles', () => {
  it('should work', async () => {
    const response = await storeFiles(
      { uuids: [STORE_UUID, INVALID_UUID] },
      testSettings
    )
    expect(response.result[0].uuid).toBe(STORE_UUID)
    // TODO: seems there is bug in the API, `-` are removed from the uuid here
    // expect(response.problems[INVALID_UUID]).toEqual(INVALID_UUID)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(storeFiles({ uuids: [] }, testSettings)).rejects.toThrowError()
  })
})
