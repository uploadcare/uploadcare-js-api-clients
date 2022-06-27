import { describe, it } from '@jest/globals'
import { getMetadata } from './getMetadata'

import {
  DEFAULT_UUID,
  INVALID_UUID,
  METADATA_UUID
} from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { updateMetadata } from './updateMetadata'
import { deleteMetadata } from './deleteMetadata'
import { delay } from '@uploadcare/api-client-utils'

describe('getMetadata', () => {
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
    const response = await getMetadata({ uuid: METADATA_UUID }, testSettings)
    expect(response).toEqual({ kebab_key: 'value' })
  })

  it('should return empty object if no metadata', async () => {
    const response = await getMetadata({ uuid: DEFAULT_UUID }, testSettings)
    expect(response).toEqual({})
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      getMetadata({ uuid: INVALID_UUID }, testSettings)
    ).rejects.toThrowError()
  })
})
