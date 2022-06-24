import { describe, it } from '@jest/globals'

import { INVALID_UUID, STORE_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { copyFileToLocalStorage } from './copyFileToLocalStorage'

describe('copyFileToLocalStorage', () => {
  it('should work', async () => {
    // const {size} = await fileInfo({uuid: STORE_UUID}, testSettings);

    const response = await copyFileToLocalStorage(
      { source: STORE_UUID },
      testSettings
    )
    expect(response.type).toBe('file')
    expect(response.result.uuid).not.toBe(STORE_UUID)
    // TODO: there is possible bug in the API, size is missing in the response
    // expect(response.result.size).toBe(size)
  })

  it('should throw error if invalid option passed', async () => {
    const request = copyFileToLocalStorage(
      { source: INVALID_UUID },
      testSettings
    )
    await expect(request).rejects.toThrowError()
  })
})
