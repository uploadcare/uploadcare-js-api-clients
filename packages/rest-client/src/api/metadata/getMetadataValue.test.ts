import { describe, it } from '@jest/globals'
import { getMetadataValue } from './getMetadataValue'

import { INVALID_UUID, METADATA_UUID } from '../../../test/fixtures'
import { testSettings, waitForApiFlush } from '../../../test/helpers'
import { updateMetadata } from './updateMetadata'

async function prepare() {
  await updateMetadata(
    { uuid: METADATA_UUID, key: 'get_value_key', value: 'value' },
    testSettings
  )
  await waitForApiFlush()
}

describe('getMetadataValue', () => {
  it('should return metadata value', async () => {
    await prepare()

    const response = await getMetadataValue(
      { uuid: METADATA_UUID, key: 'get_value_key' },
      testSettings
    )
    expect(response).toEqual('value')
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      getMetadataValue({ uuid: INVALID_UUID, key: 'key' }, testSettings)
    ).rejects.toThrowError()
  })
})
