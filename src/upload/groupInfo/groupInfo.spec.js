import groupInfo from './index'

describe('groupInfo', () => {
  it('should return success response', async() => {
    const groupId = ''

    return await expect(groupInfo(groupId)).resolves.toEqual(true)
  })
})
