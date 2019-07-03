import {GroupUploadLifecycleInterface, LifecycleInterface} from './types'
import {GroupInfo} from '../api/types'
import {Settings, UploadcareGroup} from '../types'
import {UploadedState} from './UploadedState'

export class GroupUploadLifecycle implements GroupUploadLifecycleInterface {
  private readonly lifecycle: LifecycleInterface<UploadcareGroup>

  constructor(lifecycle: LifecycleInterface<UploadcareGroup>) {
    this.lifecycle = lifecycle
  }

  handleUploadedGroup(groupInfo: GroupInfo, settings: Settings): Promise<UploadcareGroup> {
    this.lifecycle.updateEntity({
      uuid: groupInfo.id,
      filesCount: groupInfo.files_count,
      totalSize: groupInfo.files.reduce((acc, file) => acc + file.size, 0),
      isStored: !!groupInfo.datetime_stored,
      isImage: !!groupInfo.files.filter(file => file.is_image).length,
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

  getUploadLifecycle(): LifecycleInterface<UploadcareGroup> {
    return this.lifecycle
  }
}
