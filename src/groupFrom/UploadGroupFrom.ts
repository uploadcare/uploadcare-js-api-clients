import {ProgressParams, Settings, UploadcareFiles, UploadcareGroupInterface} from '../types'
import {Thenable} from '../tools/Thenable'
import {ProgressState, UploadingProgress} from '../types'
import {GroupInfo} from '../api/types'
import {GroupUploadLifecycleInterface} from '../lifecycle/types'
import {GroupUploadInterface} from './types'
import {UploadedState} from '../lifecycle/state/UploadedState'
import {UploadcareGroup} from '../UploadcareGroup'

export abstract class UploadGroupFrom extends Thenable<UploadcareGroupInterface> implements GroupUploadInterface {
  protected abstract readonly promise: Promise<UploadcareGroupInterface>
  protected abstract lifecycle: GroupUploadLifecycleInterface
  abstract cancel(): void
  abstract getFiles(): Promise<UploadcareFiles>

  protected progress: UploadingProgress = {
    state: ProgressState.Pending,
    uploaded: null,
    value: 0,
  }
  protected files: UploadcareFiles | null = null
  protected group: UploadcareGroupInterface | null = null

  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((group: UploadcareGroupInterface) => void) | null = null
  onCancel: VoidFunction | null = null

  /**
   * Handle uploaded file.
   * @param {GroupInfo} groupInfo
   * @param {Settings} settings
   */
  protected handleUploaded(groupInfo: GroupInfo, settings: Settings): Promise<UploadcareGroupInterface> {
    const uploadLifecycle = this.lifecycle.getUploadLifecycle()
    uploadLifecycle.updateEntity(new UploadcareGroup(groupInfo))

    uploadLifecycle.updateState(new UploadedState())

    if (typeof this.onUploaded === 'function') {
      this.onUploaded(groupInfo.id)
    }

    return Promise.resolve(uploadLifecycle.getEntity())
  }
}
