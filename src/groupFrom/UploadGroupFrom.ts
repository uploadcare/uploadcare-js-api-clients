import {ProgressParams, Settings, UploadcareFiles, UploadcareGroup} from '../types'
import {Thenable} from '../tools/Thenable'
import {ProgressState, UploadingProgress} from '../types'
import {GroupInfo} from '../api/types'
import {GroupUploadLifecycleInterface} from '../lifecycle/types'
import {GroupUploadInterface} from './types'

export abstract class UploadGroupFrom extends Thenable<UploadcareGroup> implements GroupUploadInterface {
  protected abstract readonly promise: Promise<UploadcareGroup>
  protected abstract lifecycle: GroupUploadLifecycleInterface
  abstract cancel(): void
  abstract getFiles(): Promise<UploadcareFiles>

  protected progress: UploadingProgress = {
    state: ProgressState.Pending,
    uploaded: null,
    value: 0,
  }
  protected files: UploadcareFiles | null = null
  protected group: UploadcareGroup | null = null

  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((group: UploadcareGroup) => void) | null = null
  onCancel: VoidFunction | null = null

  /**
   * Handle uploaded file.
   * @param {GroupInfo} groupInfo
   * @param {Settings} settings
   */
  protected handleUploaded(groupInfo: GroupInfo, settings: Settings): Promise<UploadcareGroup> {
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

    this.lifecycle.updateProgress(ProgressState.Uploaded)

    if (typeof this.onUploaded === 'function') {
      this.onUploaded(groupInfo.id)
    }

    return Promise.resolve(this.lifecycle.getEntity())
  }
}
