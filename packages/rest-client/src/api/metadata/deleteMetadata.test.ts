import { describe, it } from '@jest/globals'
import { deleteMetadata } from './deleteMetadata'

import { INVALID_UUID, METADATA_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'

describe('deleteMetadata', () => {
  it('should work', async () => {
    const response = await deleteMetadata(
      { uuid: METADATA_UUID, key: 'key' },
      testSettings
    )
    expect(response).toBe(undefined)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      deleteMetadata({ uuid: INVALID_UUID, key: '' }, testSettings)
    ).rejects.toThrowError()
  })
})
