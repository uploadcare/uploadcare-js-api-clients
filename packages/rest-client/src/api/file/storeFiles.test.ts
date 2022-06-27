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

    expect(response.problems).toHaveProperty(INVALID_UUID)
    expect(response.problems[INVALID_UUID]).toEqual('Invalid')
  })

  it('should throw error if non-200 status received', async () => {
    await expect(storeFiles({ uuids: [] }, testSettings)).rejects.toThrowError()
  })
})
