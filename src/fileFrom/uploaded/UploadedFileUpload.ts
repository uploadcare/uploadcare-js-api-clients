import {Thenable} from '../../tools/Thenable'
import {ProgressState, Settings, UploadcareFileInterface, UploadingProgress} from '../../types'
import {FileUploadInterface} from '../types'
import {FileUploadLifecycleInterface, LifecycleInterface} from '../../lifecycle/types'
import {Uuid} from '../..'
import info, {InfoResponse} from '../../api/info'
import CancelError from '../../errors/CancelError'
import {PollPromiseInterface} from '../../tools/poll'

export class UploadedFileUpload extends Thenable<UploadcareFileInterface> implements FileUploadInterface {
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareFileInterface) => void) | null = null
  onCancel: VoidFunction | null = null

  private isCancelled: boolean = false
  protected readonly promise: Promise<UploadcareFileInterface>

  private readonly fileUploadLifecycle: FileUploadLifecycleInterface
  private readonly uploadLifecycle: LifecycleInterface<UploadcareFileInterface>
  private readonly isFileReadyPolling: PollPromiseInterface<InfoResponse>

  private readonly data: Uuid
  private readonly settings: Settings

  constructor(
    lifecycle: FileUploadLifecycleInterface,
    isFileReadyPolling: PollPromiseInterface<InfoResponse>,
    data: Uuid,
    settings: Settings
  ) {
    super()

    this.fileUploadLifecycle = lifecycle
    this.uploadLifecycle = this.fileUploadLifecycle.getUploadLifecycle()

    this.uploadLifecycle.onProgress = this.onProgress
    this.uploadLifecycle.onUploaded = this.onUploaded
    this.uploadLifecycle.onReady = this.onReady
    this.uploadLifecycle.onCancel = this.onCancel

    this.isFileReadyPolling = isFileReadyPolling

    this.data = data
    this.settings = {
      ...settings,
      source: 'uploaded',
    }

    this.promise = this.getFilePromise()
  }

  private getFilePromise = (): Promise<UploadcareFileInterface> => {
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

  cancel(): void {
    const {state} = this.uploadLifecycle.getProgress()

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
