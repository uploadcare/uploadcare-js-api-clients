import { describe, it } from '@jest/globals'
import { listOfGroups } from './listOfGroups'

import { GROUP_FILE_UUID } from '../../../test/fixtures'
import {
  testSettings,
  uploadClient,
  waitForApiFlush
} from '../../../test/helpers'

describe('listOfGroups', () => {
  it('should return paginated list of groups', async () => {
    const { id: groupId } = await uploadClient.group([GROUP_FILE_UUID])

    await waitForApiFlush()

    const response = await listOfGroups(
      { ordering: '-datetime_created' },
      testSettings
    )
    expect(response.results[0].id).toBe(groupId)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      listOfGroups({ from: 'invalid-date' as unknown as Date }, testSettings)
    ).rejects.toThrowError()
  })
})
