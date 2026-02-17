import { describe, it } from 'vitest'
import { updateMetadata } from './updateMetadata'

import { INVALID_UUID, METADATA_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'

describe('updateMetadata', () => {
  it('should work', async () => {
    const response = await updateMetadata(
      { uuid: METADATA_UUID, key: 'key', value: 'value' },
      testSettings
    )
    expect(response).toBe('value')
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      updateMetadata({ uuid: INVALID_UUID, key: '', value: '' }, testSettings)
    ).rejects.toThrowError()
  })
})
