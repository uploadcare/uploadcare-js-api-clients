import {FileHandlerInterface} from '../types'
import {UploadcareFileInterface} from '../../types'
import info, {InfoResponse} from '../../api/info'
import CancelError from '../../errors/CancelError'
import {FileUploadLifecycleInterface, LifecycleInterface} from '../../lifecycle/types'

export class UploadedFileHandler implements FileHandlerInterface {
  private readonly fileUploadLifecycle: FileUploadLifecycleInterface
  private readonly uploadLifecycle: LifecycleInterface<UploadcareFileInterface>

  constructor(lifecycle: FileUploadLifecycleInterface) {
    this.fileUploadLifecycle = lifecycle
    this.uploadLifecycle = this.fileUploadLifecycle.getUploadLifecycle()

  }

  getPromise = (): Promise<UploadcareFileInterface> => {
    this.uploadLifecycle.handleUploading()

    return info(this.data, this.settings)
      .then(this.handleInfoResponse)
      .then(this.uploadLifecycle.handleReady)
      .catch(this.uploadLifecycle.handleError)
  }

  private handleInfoResponse = (response: InfoResponse) => {
    if (this.isCancelled) {
      return Promise.reject(new CancelError())
    }

    const {uuid} = response

    return this.fileUploadLifecycle.handleUploadedFile(uuid, this.settings)
  }
}
