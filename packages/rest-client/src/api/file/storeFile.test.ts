import { describe, it } from 'vitest'
import { storeFile } from './storeFile'

import { INVALID_UUID, STORE_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'

describe('storeFile', () => {
  it('should work', async () => {
    const response = await storeFile({ uuid: STORE_UUID }, testSettings)
    expect(response.uuid).toEqual(STORE_UUID)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      storeFile({ uuid: INVALID_UUID }, testSettings)
    ).rejects.toThrowError()
  })
})
