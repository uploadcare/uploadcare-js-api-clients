import {groupInfo} from './groupInfo'
import * as factory from '../../../test/fixtureFactory'

describe('groupInfo', () => {
  it('should return UCRequest', () => {
    const groupId = factory.groupId('valid')
    const options = {publicKey: factory.publicKey('demo')}
    const ucRequest = groupInfo(groupId, options)

    expect(ucRequest).toBeTruthy()
    expect(ucRequest.promise).toBeInstanceOf(Promise)
    expect(ucRequest.cancel).toBeInstanceOf(Function)
    expect(ucRequest.progress).toBeInstanceOf(Function)
  })
  it('should return info about uploaded group of files', async() => {
    const groupId = factory.groupId('valid')
    const options = {publicKey: factory.publicKey('demo')}
    const ucRequest = groupInfo(groupId, options)

    const {code, data} = await ucRequest.promise

    expect.assertions(5)

    expect(code).toBe(200)
    expect(response).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
    expect(data.files).toBeInstanceOf(Array)
  })
  it('should fail with [HTTP 404] group_id is invalid.', async() => {
    const groupId = factory.groupId('invalid')
    const options = {publicKey: factory.publicKey('demo')}
    const ucRequest = groupInfo(groupId, options)

    const {code, data} = await ucRequest.promise

    expect.assertions(3)

    expect(code).toBe(404)
    expect(data).toBeTruthy()
    expect(data.error).toBe('group_id is invalid')
  })
})
