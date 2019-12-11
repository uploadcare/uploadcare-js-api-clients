import info from '../api/info'

/* Types */
import { SettingsInterface, UploadcareFileInterface, Uuid } from '..'
import {
  FileUploadLifecycleInterface,
  UploadHandlerInterface
} from '../lifecycle/types'
import { ProgressStateEnum } from '../types'
import { CancelableThenableInterface } from '../thenable/types'
import { FileInfoInterface } from '../api/types'
import CancelError from '../errors/CancelError'

export class FileFromUploaded
  implements
    UploadHandlerInterface<
      UploadcareFileInterface,
      FileUploadLifecycleInterface
    > {
  private readonly request: CancelableThenableInterface<FileInfoInterface>
  private readonly settings: SettingsInterface
  private isCancelled = false

  constructor(uuid: Uuid, settings: SettingsInterface) {
    this.settings = {
      ...settings,
      source: 'uploaded'
    }
    this.request = info(uuid, this.settings)
  }

  upload(
    fileUploadLifecycle: FileUploadLifecycleInterface
  ): Promise<UploadcareFileInterface> {
    if (this.isCancelled) {
      return Promise.reject(new CancelError())
    }

    const uploadLifecycle = fileUploadLifecycle.uploadLifecycle
    uploadLifecycle.handleUploading()

    return this.request
      .then(({ uuid }) =>
        fileUploadLifecycle.handleUploadedFile(uuid, this.settings)
      )
      .catch(uploadLifecycle.handleError.bind(uploadLifecycle))
  }

  cancel(fileUploadLifecycle: FileUploadLifecycleInterface): void {
    const uploadLifecycle = fileUploadLifecycle.uploadLifecycle
    const isFileReadyPolling = fileUploadLifecycle.getIsFileReadyPolling()
    const { state } = uploadLifecycle.getProgress()

    switch (state) {
      case ProgressStateEnum.Uploading:
        this.request.cancel()
        break
      case ProgressStateEnum.Uploaded:
      case ProgressStateEnum.Ready:
        if (isFileReadyPolling) {
          isFileReadyPolling.cancel()
        } else {
          this.isCancelled = true
        }
        break
    }
  }
}
