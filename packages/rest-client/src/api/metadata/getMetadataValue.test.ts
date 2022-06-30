import { describe, it } from '@jest/globals'
import { getMetadataValue } from './getMetadataValue'

import { delay } from '@uploadcare/api-client-utils'
import { INVALID_UUID, METADATA_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { deleteMetadata } from './deleteMetadata'
import { updateMetadata } from './updateMetadata'

describe('getMetadataValue', () => {
  beforeAll(async () => {
    await updateMetadata(
      { uuid: METADATA_UUID, key: 'kebab_key', value: 'value' },
      testSettings
    )
    // metadata aren't stored immediately
    await delay(1000)
  })
  afterAll(() => {
    return deleteMetadata(
      { uuid: METADATA_UUID, key: 'kebab_key' },
      testSettings
    )
  })

  it('should return metadata object', async () => {
    const response = await getMetadataValue(
      { uuid: METADATA_UUID, key: 'kebab_key' },
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
