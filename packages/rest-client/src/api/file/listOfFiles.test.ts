import { describe, it } from '@jest/globals'
import { listOfFiles } from './listOfFiles'

import { testSettings } from '../../../test/helpers'

describe('listOfFiles', () => {
  it('should return paginated list of files', async () => {
    const response = await listOfFiles({}, testSettings)
    expect(response.results[0].uuid).toBeTruthy()
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      listOfFiles({ from: 'invalid-date' as unknown as Date }, testSettings)
    ).rejects.toThrowError()
  })
})
