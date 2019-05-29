import {Settings, UploadcareFile} from '../types'
import {ProgressState, UploadFrom} from './UploadFrom'
import info, {InfoResponse, Uuid} from '../api/info'
import CancelError from '../errors/CancelError'

export class UploadFromUploaded extends UploadFrom {
  protected readonly promise: Promise<UploadcareFile>
  private isCancelled: boolean = false

  protected readonly data: Uuid
  protected readonly settings: Settings

  constructor(data: Uuid, settings: Settings) {
    super()

    this.data = data
    this.settings = {
      ...settings,
      source: 'uploaded',
    }

    this.promise = this.getFilePromise()
  }

  private getFilePromise = (): Promise<UploadcareFile> => {
    this.handleUploading()

    return info(this.data, this.settings)
      .then(this.handleInfoResponse)
      .then(this.handleReady)
      .catch(this.handleError)
  }

  private handleInfoResponse = (response: InfoResponse) => {
    if (this.isCancelled) {
      return Promise.reject(new CancelError())
    }

    const {uuid} = response

    return this.handleUploaded(uuid, this.settings)
  }

  cancel(): void {
    const {state} = this.getProgress()

    switch (state) {
      case ProgressState.Uploading:
        this.isCancelled = true
        break
      case ProgressState.Uploaded:
      case ProgressState.Ready:
        if (this.isFileReadyPolling) {
          this.isFileReadyPolling.cancel()
        } else {
          this.isCancelled = true
        }
        break
    }
  }
}
