import { describe, it } from '@jest/globals'
import { fileInfo } from './fileInfo'

import { INVALID_UUID, DEFAULT_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'

describe('fileInfo', () => {
  it('should work', async () => {
    const response = await fileInfo({ uuid: DEFAULT_UUID }, testSettings)
    expect(response.uuid).toEqual(DEFAULT_UUID)
  })

  it('should accept `include` option', async () => {
    const response = await fileInfo(
      { uuid: DEFAULT_UUID, include: 'appdata' },
      testSettings
    )
    expect(response.appdata).toBeTruthy()
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      fileInfo({ uuid: INVALID_UUID }, testSettings)
    ).rejects.toThrowError()
  })
})
