import { describe, it } from 'vitest'
import { groupInfo } from './groupInfo'

import { GROUP_FILE_UUID, INVALID_UUID } from '../../../test/fixtures'
import { testSettings, uploadClient } from '../../../test/helpers'

describe('groupInfo', () => {
  it('should work', async () => {
    const { id: groupId } = await uploadClient.group([GROUP_FILE_UUID])

    const response = await groupInfo({ uuid: groupId }, testSettings)
    expect(response.id).toEqual(groupId)
    expect(response.filesCount).toEqual(1)
    expect(response.files[0].uuid).toEqual(GROUP_FILE_UUID)
  })

  it('should throw error if non-200 status received', async () => {
    await expect(
      groupInfo({ uuid: INVALID_UUID }, testSettings)
    ).rejects.toThrowError()
  })
})
