import {FileData, SettingsInterface, UploadcareFileInterface, UploadcareGroupInterface} from '../types'
import {
  GroupUploadLifecycleInterface,
  UploadHandlerInterface,
  UploadInterface
} from '../lifecycle/types'
import fileFrom from '../fileFrom/fileFrom'
import group from '../api/group'
import {GroupInfoInterface} from '../api/types'
import CancelError from '../errors/CancelError'

export class GroupFromObject implements UploadHandlerInterface<UploadcareGroupInterface, GroupUploadLifecycleInterface> {
  private isCancelled = false

  private readonly data: FileData[]
  private readonly settings: SettingsInterface

  constructor(data: FileData[], settings: SettingsInterface) {
    this.data = data
    this.settings = settings
  }

  upload(groupUploadLifecycle: GroupUploadLifecycleInterface): Promise<UploadcareGroupInterface> {
    const uploadLifecycle = groupUploadLifecycle.uploadLifecycle
    uploadLifecycle.handleUploading()

    const filesTotalCount = this.data.length
    const uploadFile = (file: FileData, index: number): UploadInterface<UploadcareFileInterface> => {
      const fileUpload = fileFrom(file, this.settings)
      const fileNumber = index + 1

      fileUpload.onCancel = uploadLifecycle.handleCancelling.bind(uploadLifecycle)

      fileUpload.onProgress = ((): void => {
        uploadLifecycle.handleUploading({
          total: filesTotalCount,
          loaded: fileNumber
        })
      })

      return fileUpload
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
