import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import group from '../../src/api/group'
import groupInfo from '../../src/api/groupInfo'

describe('API - group info', () => {
  it('should return info about uploaded group of files', async() => {
    const files = factory.groupOfFiles('valid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})
    const {id} = await group(files, settings)
    const data = await groupInfo(id, settings)

    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
  })
  it('should fail with [HTTP 404] group_id is invalid.', (done) => {
    const groupId = factory.groupId('invalid')
    const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})

    groupInfo(groupId, settings)
      .then(() => done.fail('Promise should not to be resolved'))
      .catch(error => {
        (error.name === 'UploadcareError')
          ? done()
          : done.fail(error)
      })
  })
})
