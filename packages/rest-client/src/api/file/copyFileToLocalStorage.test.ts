import { describe, it } from '@jest/globals'

import { INVALID_UUID, COPY_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { copyFileToLocalStorage } from './copyFileToLocalStorage'

describe('copyFileToLocalStorage', () => {
  it('should work', async () => {
    // const {size} = await fileInfo({uuid: COPY_UUID}, testSettings);

    const response = await copyFileToLocalStorage(
      { source: COPY_UUID },
      testSettings
    )
    expect(response.type).toBe('file')
    expect(response.result.uuid).not.toBe(COPY_UUID)
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
