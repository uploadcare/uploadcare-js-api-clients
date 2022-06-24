import { describe, it } from '@jest/globals'
import { deleteFile } from './deleteFile'

import { INVALID_UUID, STORE_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { storeFile } from './storeFile'

describe('deleteFile', () => {
  beforeEach(async () => {
    await storeFile({ uuid: STORE_UUID }, testSettings)
  })
  afterEach(async () => {
    await storeFile({ uuid: STORE_UUID }, testSettings)
  })

  it('should work', async () => {
    const response = await deleteFile({ uuid: STORE_UUID }, testSettings)
    expect(response.uuid).toEqual(STORE_UUID)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      deleteFile({ uuid: INVALID_UUID }, testSettings)
    ).rejects.toThrowError()
  })
})
