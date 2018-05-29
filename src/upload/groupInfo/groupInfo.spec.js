import {groupInfo} from './index'

describe('groupInfo', () => {
  it('should return UCRequest', () => {
    const groupId = ''
    const options = {publicKey: ''}
    const ucRequest = groupInfo(groupId, options)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
  })
  it('should return info about uploaded group of files', async() => {
    const groupId = ''
    const options = {publicKey: ''}
    const ucRequest = groupInfo(groupId, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(4)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(response.id).toBeTruthy()
    expect(response.files).toBeTruthy()
  })
})
