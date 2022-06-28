import { describe, it } from '@jest/globals'
import { getMetadata } from './getMetadata'

import {
  DEFAULT_UUID,
  INVALID_UUID,
  METADATA_UUID
} from '../../../test/fixtures'
import { testSettings, waitForApiFlush } from '../../../test/helpers'
import { updateMetadata } from './updateMetadata'

async function prepare() {
  await updateMetadata(
    { uuid: METADATA_UUID, key: 'get_key', value: 'value' },
    testSettings
  )
  await waitForApiFlush()
}

describe('getMetadata', () => {
  it('should return metadata object', async () => {
    await prepare()

    const response = await getMetadata({ uuid: METADATA_UUID }, testSettings)
    expect(response.get_key).toBe('value')
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
