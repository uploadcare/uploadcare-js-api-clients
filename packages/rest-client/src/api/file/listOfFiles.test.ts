import { describe, it } from '@jest/globals'
import { listOfFiles } from './listOfFiles'

import { testSettings } from '../../../test/helpers'
import { camelizeKeys } from '@uploadcare/api-client-utils'

describe('listOfFiles', () => {
  it('should return paginated list of files', async () => {
    const response = await listOfFiles({}, testSettings)
    expect(response.results[0].uuid).toBeTruthy()
  })

  it('should camlize results', async () => {
    const response = await listOfFiles({}, testSettings)
    const firstResult = response.results[0]
    expect(camelizeKeys(firstResult)).toEqual(firstResult)
  })
})
