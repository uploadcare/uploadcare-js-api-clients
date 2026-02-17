import { describe, it } from 'vitest'
import { deleteFile } from './deleteFile'

import { INVALID_UUID, DELETE_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { storeFile } from './storeFile'

describe('deleteFile', () => {
  beforeEach(async () => {
    await storeFile({ uuid: DELETE_UUID }, testSettings)
  })
  afterEach(async () => {
    await storeFile({ uuid: DELETE_UUID }, testSettings)
  })

  it('should work', async () => {
    const response = await deleteFile({ uuid: DELETE_UUID }, testSettings)
    expect(response.uuid).toEqual(DELETE_UUID)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      deleteFile({ uuid: INVALID_UUID }, testSettings)
    ).rejects.toThrowError()
  })
})
