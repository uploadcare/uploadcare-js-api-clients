import group from '../api/group'
import CancelError from '../errors/CancelError'

/* Types */
import {GroupHandlerInterface} from './types'
import {GroupUploadLifecycleInterface} from '../lifecycle/types'
import {SettingsInterface, UploadcareGroupInterface} from '../types'
import {Uuid} from '..'
import {GroupInfoInterface} from '../api/types'

export class GroupFromUploaded implements GroupHandlerInterface {
  private isCancelled = false

  private readonly data: Uuid[]
  private readonly settings: SettingsInterface

  constructor(data: Uuid[], settings: SettingsInterface) {
    this.data = data
    this.settings = {
      ...settings,
      source: 'uploaded',
    }
  }

  upload(groupUploadLifecycle: GroupUploadLifecycleInterface): Promise<UploadcareGroupInterface> {
    const uploadLifecycle = groupUploadLifecycle.uploadLifecycle
    uploadLifecycle.handleUploading()

    return group(this.data, this.settings)
      .then((groupInfo: GroupInfoInterface) => {
        if (this.isCancelled) {
          return Promise.reject(new CancelError())
        }

        return groupUploadLifecycle.handleUploadedGroup(groupInfo, this.settings)
      })
      .then(uploadLifecycle.handleReady.bind(uploadLifecycle))
      .catch(uploadLifecycle.handleError.bind(uploadLifecycle))
  }

  cancel(): void {
    this.isCancelled = true
  }
}
