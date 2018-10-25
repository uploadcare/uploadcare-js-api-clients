import {groupInfo} from './groupInfo'
import * as factory from '../../../test/fixtureFactory'
import {group} from '../group/group'

describe('groupInfo', () => {
  it('should return UCRequest', () => {
    const groupId = factory.groupId('valid')
    const options = {publicKey: factory.publicKey('image')}
    const ucRequest = groupInfo(groupId, options)

    expect(ucRequest).toBeInstanceOf(Promise)
  })
  it('should return info about uploaded group of files', async() => {
    const files = factory.groupOfFiles('valid')
    const options = {publicKey: factory.publicKey('image')}
    const {data: {id}} = await group(files, options)
    const {code, data} = await groupInfo(id, options)

    expect.assertions(5)

    expect(code).toBe(200)
    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
    expect(data.files).toBeInstanceOf(Array)
  })
  it('should fail with [HTTP 404] group_id is invalid.', async() => {
    const groupId = factory.groupId('invalid')
    const options = {publicKey: factory.publicKey('image')}
    const {code, data} = await groupInfo(groupId, options)

    expect.assertions(3)

    expect(code).toBe(404)
    expect(data).toBeTruthy()
    expect(data.error.content).toBe('group_id is invalid.')
  })
})
