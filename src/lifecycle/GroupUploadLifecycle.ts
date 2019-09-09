import {GroupUploadLifecycleInterface, LifecycleInterface} from './types'
import {GroupInfoInterface} from '../api/types'
import {UploadcareGroupInterface} from '../types'
import {UploadedState} from './state/UploadedState'
import {UploadcareGroup} from '../UploadcareGroup'

export class GroupUploadLifecycle implements GroupUploadLifecycleInterface {
  private readonly lifecycle: LifecycleInterface<UploadcareGroupInterface>

  constructor(lifecycle: LifecycleInterface<UploadcareGroupInterface>) {
    this.lifecycle = lifecycle
  }

  handleUploadedGroup(groupInfo: GroupInfoInterface): Promise<UploadcareGroupInterface> {
    const group = new UploadcareGroup(groupInfo)

    this.lifecycle.updateEntity(group)
    this.lifecycle.updateState(new UploadedState())

    if (typeof this.lifecycle.onUploaded === 'function') {
      this.lifecycle.onUploaded(group.uuid)
    }

    return Promise.resolve(this.lifecycle.getEntity())
  }

  getUploadLifecycle(): LifecycleInterface<UploadcareGroupInterface> {
    return this.lifecycle
  }
}
