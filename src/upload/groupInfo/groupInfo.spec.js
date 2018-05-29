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

    expect.assertions(5)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(response.id).toBeTruthy()
    expect(response.files).toBeTruthy()
    expect(response.files).toBeInstanceOf(Array)
  })
  it('should fail with [HTTP 404] group_id is invalid.', async() => {
    const groupId = ''
    const options = {publicKey: ''}
    const ucRequest = groupInfo(groupId, options)

    const {code, response} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(404)
    expect(response).toBeTruthy()
    expect(response.error).toBe('group_id is invalid')
  })
})
