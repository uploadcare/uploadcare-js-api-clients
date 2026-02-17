import { describe, it } from 'vitest'
import { listOfGroups } from './listOfGroups'

import { GROUP_FILE_UUID } from '../../../test/fixtures'
import { testSettings, uploadClient } from '../../../test/helpers'

describe('listOfGroups', () => {
  it('should return paginated list of groups', async () => {
    const group = await uploadClient.group([GROUP_FILE_UUID])

    const response = await listOfGroups(
      { ordering: '-datetime_created' },
      testSettings
    )
    expect(response.results).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: group.id })])
    )
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      listOfGroups({ from: 'invalid-date' as unknown as Date }, testSettings)
    ).rejects.toThrowError()
  })
})
