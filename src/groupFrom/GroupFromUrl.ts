import fileFrom from '../fileFrom/fileFrom'
import group from '../api/group'
import CancelError from '../errors/CancelError'

/* Types */
import {SettingsInterface, UploadcareFileInterface, UploadcareGroupInterface} from '../types'
import {Url} from '..'
import {GroupUploadLifecycleInterface, UploadHandlerInterface, UploadInterface} from '../lifecycle/types'
import {GroupInfoInterface} from '../api/types'

export class GroupFromUrl implements UploadHandlerInterface<UploadcareGroupInterface, GroupUploadLifecycleInterface> {
  private isCancelled = false

  private readonly data: Url[]
  private readonly settings: SettingsInterface

  constructor(data: Url[], settings: SettingsInterface) {
    this.data = data
    this.settings = settings
  }

  upload(groupUploadLifecycle: GroupUploadLifecycleInterface): Promise<UploadcareGroupInterface> {
    const uploadLifecycle = groupUploadLifecycle.uploadLifecycle
    uploadLifecycle.handleUploading()

    const filesTotalCount = this.data.length
    const uploadFile = (file: Url, index: number): UploadInterface<UploadcareFileInterface> => {
      const fileNumber = index + 1
      const onCancel = uploadLifecycle.handleCancelling.bind(uploadLifecycle)
      const onProgress = ((): void => {
        uploadLifecycle.handleUploading({
          total: filesTotalCount,
          loaded: fileNumber
        })
      })

      return fileFrom(file, this.settings, {onProgress, onCancel})
    }
    const files = this.data.map(uploadFile)

    return Promise.all(files)
      .then(files => {
        const uuids = files.map(file => file.uuid)

        return group(uuids, this.settings)
      })
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
