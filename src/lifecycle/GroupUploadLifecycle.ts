import {GroupUploadLifecycleInterface, LifecycleInterface} from './types'
import {GroupInfoInterface} from '../api/types'
import {UploadcareGroupInterface} from '../types'
import {UploadedState} from './state/UploadedState'

export class GroupUploadLifecycle implements GroupUploadLifecycleInterface {
  private readonly lifecycle: LifecycleInterface<UploadcareGroupInterface>

  constructor(lifecycle: LifecycleInterface<UploadcareGroupInterface>) {
    this.lifecycle = lifecycle
  }

  handleUploadedGroup(groupInfo: GroupInfoInterface): Promise<UploadcareGroupInterface> {
    const totalSize = groupInfo.files.reduce((acc, file) => acc + file.size, 0)
    const isStored = !!groupInfo.datetime_stored
    const isImage = !!groupInfo.files.filter(file => file.is_image).length

    this.lifecycle.updateEntity({
      uuid: groupInfo.id,
      filesCount: groupInfo.files_count,
      totalSize,
      isStored,
      isImage,
      cdnUrl: groupInfo.cdn_url,
      files: groupInfo.files,
      createdAt: groupInfo.datetime_created,
      storedAt: groupInfo.datetime_stored,
    })

    this.lifecycle.updateState(new UploadedState())

    if (typeof this.lifecycle.onUploaded === 'function') {
      this.lifecycle.onUploaded(groupInfo.id)
    }

    return Promise.resolve(this.lifecycle.getEntity())
  }

  getUploadLifecycle(): LifecycleInterface<UploadcareGroupInterface> {
    return this.lifecycle
  }
}
