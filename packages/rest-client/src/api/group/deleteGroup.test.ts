import { describe, it } from '@jest/globals'
import { deleteGroup } from './deleteGroup'

import { GROUP_FILE_UUID, INVALID_UUID } from '../../../test/fixtures'
import { testSettings, uploadClient } from '../../../test/helpers'
import { groupInfo } from './groupInfo'

describe('deleteGroup', () => {
  it('should work', async () => {
    const { id: groupId } = await uploadClient.group([GROUP_FILE_UUID])

    const response = await deleteGroup({ uuid: groupId }, testSettings)
    expect(response).toBe(undefined)

    await expect(
      groupInfo({ uuid: groupId }, testSettings)
    ).rejects.toThrowError()
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      deleteGroup({ uuid: INVALID_UUID }, testSettings)
    ).rejects.toThrowError()
  })
})
