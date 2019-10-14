import {GroupUploadLifecycleInterface, LifecycleInterface} from './types'
import {GroupInfoInterface} from '../api/types'
import {SettingsInterface, UploadcareGroupInterface} from '../types'
import {UploadedState} from './state/UploadedState'

export class GroupUploadLifecycle implements GroupUploadLifecycleInterface {
  private readonly uploadLifecycle: LifecycleInterface<UploadcareGroupInterface>

  constructor(lifecycle: LifecycleInterface<UploadcareGroupInterface>) {
    this.uploadLifecycle = lifecycle
  }

  handleUploadedGroup(groupInfo: GroupInfoInterface, settings: SettingsInterface): Promise<UploadcareGroupInterface> {
    const uploadLifecycle = this.getUploadLifecycle()
    const totalSize = groupInfo.files.reduce((acc, file) => acc + file.size, 0)
    const isStored = !!groupInfo.datetime_stored
    const isImage = !!groupInfo.files.filter(file => file.is_image).length
    const uuid = groupInfo.id

    uploadLifecycle.updateEntity({
      uuid,
      filesCount: groupInfo.files_count,
      totalSize,
      isStored,
      isImage,
      cdnUrl: groupInfo.cdn_url,
      files: groupInfo.files,
      createdAt: groupInfo.datetime_created,
      storedAt: groupInfo.datetime_stored,
    })

    uploadLifecycle.updateState(new UploadedState())

    if (typeof uploadLifecycle.onUploaded === 'function') {
      uploadLifecycle.onUploaded(uuid)
    }

    return Promise.resolve(uploadLifecycle.getEntity())
  }

  getUploadLifecycle(): LifecycleInterface<UploadcareGroupInterface> {
    return this.uploadLifecycle
  }
}
