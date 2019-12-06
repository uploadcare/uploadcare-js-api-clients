import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import group from '../../src/api/group'
import groupInfo from '../../src/api/groupInfo'
import CancelError from '../../src/errors/CancelError'
import UploadcareError from '../../src/errors/UploadcareError'

describe('API - group info', () => {
  const files = factory.groupOfFiles('valid')
  const settings = getSettingsForTesting({publicKey: factory.publicKey('image')})

  it('should return info about uploaded group of files', async() => {
    const {id} = await group(files, settings)
    const data = await groupInfo(id, settings)

    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.files).toBeTruthy()
  })
  it('should fail with [HTTP 404] group_id is invalid.', async () => {
    const groupId = factory.groupId('invalid')
    const upload = groupInfo(groupId, settings)

    await (expectAsync(upload) as any).toBeRejectedWithError(UploadcareError)
  })

  it('should be able to cancel uploading', async () => {
    const {id} = await group(files, settings)
    const upload = groupInfo(id, settings)

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)
  })

  it('should be able to handle cancel uploading', async () => {
    const {id} = await group(files, settings)
    const onCancel = jasmine.createSpy('onCancel')
    const upload = groupInfo(id, settings, {onCancel})

    upload.cancel()

    await (expectAsync(upload) as any).toBeRejectedWithError(CancelError)

    expect(onCancel).toHaveBeenCalled()
  })
})
