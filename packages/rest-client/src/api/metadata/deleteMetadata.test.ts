import { describe, it } from 'vitest'
import { deleteMetadata } from './deleteMetadata'

import { INVALID_UUID, METADATA_UUID } from '../../../test/fixtures'
import { testSettings, waitForApiFlush } from '../../../test/helpers'
import { getMetadataValue } from './getMetadataValue'
import { updateMetadata } from './updateMetadata'

async function prepare() {
  await updateMetadata(
    { uuid: METADATA_UUID, key: 'delete_key', value: 'value' },
    testSettings
  )
  await waitForApiFlush()
  const value = await getMetadataValue(
    { uuid: METADATA_UUID, key: 'delete_key' },
    testSettings
  )
  expect(value).toBe('value')
}

describe('deleteMetadata', () => {
  it('should work', async () => {
    await prepare()

    const response = await deleteMetadata(
      { uuid: METADATA_UUID, key: 'delete_key' },
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
