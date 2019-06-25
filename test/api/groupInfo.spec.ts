import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import group from '../../src/api/group'
import groupInfo from '../../src/api/groupInfo'

fdescribe('API - group info', () => {
  it('should return info about uploaded group of files', async() => {
    const files = factory.groupOfFiles('valid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})
    const {id} = await group(files, settings)
    const data = await groupInfo(id, settings)

    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
  })
  it('should fail with [HTTP 404] group_id is invalid.', async() => {
    const groupId = factory.groupId('invalid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})

    try {
      await groupInfo(groupId, settings)
    } catch (error) {
      expect(error.name).toBe('UploadcareError')
    }
  })
})
