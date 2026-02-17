import { describe, it } from 'vitest'

import { COPY_UUID } from '../../../test/fixtures'
import { testSettings } from '../../../test/helpers'
import { copyFileToRemoteStorage } from './copyFileToRemoteStorage'

describe('copyFileToRemoteStorage', () => {
  it.skip('should work', async () => {
    // TODO: add test s3 bucket and check it
    const response = await copyFileToRemoteStorage(
      { source: COPY_UUID, target: '' },
      testSettings
    )
    expect(response.type).toBe('url')
    expect(response.result).toBe('')
  })
  it('should throw error if invalid option passed', async () => {
    const request = copyFileToRemoteStorage(
      { source: COPY_UUID, target: 'bucket' },
      testSettings
    )
    await expect(request).rejects.toThrowError()
  })
})
