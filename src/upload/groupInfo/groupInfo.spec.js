import groupInfo from './index'

describe('groupInfo', () => {
  it('should return UCRequest', () => {
    const groupId = ''
    const ucRequest = groupInfo(groupId)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
  })
})
