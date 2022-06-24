import { describe, it } from '@jest/globals'
import { getFiles } from './getFiles'

import { testSettings } from '../../../test/_helpers'

describe('getFiles', () => {
  it('should work', async () => {
    const response = await getFiles({}, testSettings)
    expect(response.results).toBeTruthy()
  })
})
