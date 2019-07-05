import {Thenable} from '../../tools/Thenable'
import {ProgressState, Settings, UploadcareFileInterface, UploadingProgress} from '../../types'
import {FileUploadInterface} from '../types'
import {FileUploadLifecycleInterface, LifecycleInterface} from '../../lifecycle/types'
import {PollPromiseInterface} from '../../tools/poll'
import {InfoResponse} from '../../api/info'
import fromUrlStatus, {
  FromUrlStatusResponse,
  isErrorResponse, isProgressResponse, isSuccessResponse,
  isUnknownResponse,
  isWaitingResponse
} from '../../api/fromUrlStatus'
import {Url, Uuid} from '../..'
import fromUrl, {FromUrlResponse, isFileInfoResponse, isTokenResponse} from '../../api/fromUrl'
import CancelError from '../../errors/CancelError'

export class UrlFileUpload extends Thenable<UploadcareFileInterface> implements FileUploadInterface {
  onCancel: VoidFunction | null = null
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onReady: ((entity: UploadcareFileInterface) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null

  private isCancelled: boolean = false
  protected readonly promise: Promise<UploadcareFileInterface>

  private readonly fileUploadLifecycle: FileUploadLifecycleInterface
  private readonly uploadLifecycle: LifecycleInterface<UploadcareFileInterface>

  private readonly isFileReadyPolling: PollPromiseInterface<InfoResponse>
  private readonly isFileUploadedFromUrlPolling: PollPromiseInterface<FromUrlStatusResponse>

  private unknownStatusWasTimes: number = 0

  protected readonly data: Url
  protected readonly settings: Settings

  constructor(
    lifecycle: FileUploadLifecycleInterface,
    isFileReadyPolling: PollPromiseInterface<InfoResponse>,
    isFileUploadedFromUrlPolling: PollPromiseInterface<FromUrlStatusResponse>,
    data: Url,
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
    this.isFileUploadedFromUrlPolling = isFileUploadedFromUrlPolling

    this.data = data
    this.settings = settings

    this.promise = this.getFilePromise()
  }

  private getFilePromise = (): Promise<UploadcareFileInterface> => {
    this.uploadLifecycle.handleUploading()

    return fromUrl(this.data, this.settings)
      .then(this.handleFromUrlResponse)
      .then(this.uploadLifecycle.handleReady)
      .catch(this.uploadLifecycle.handleError)
  }

  private handleFromUrlResponse = (response: FromUrlResponse) => {
    if (isTokenResponse(response)) {
      const {token} = response

      return fromUrlStatus(token, this.settings)
        .then(response => this.handleFromUrlStatusResponse(token, response) )
        .catch(this.uploadLifecycle.handleError)
    } else if (isFileInfoResponse(response)) {
      const {uuid} = response

      return this.fileUploadLifecycle.handleUploadedFile(uuid, this.settings)
    }
  }

  private handleFromUrlStatusResponse = (token: Uuid, response: FromUrlStatusResponse) => {
    if (isUnknownResponse(response)) {
      this.unknownStatusWasTimes++

      if (this.unknownStatusWasTimes === 3) {
        return Promise.reject(`Token "${token}" was not found.`)
      } else {
        return this.isFileUploadedFromUrlPolling
          .then(status => this.handleFromUrlStatusResponse(token, status))
          .catch(this.uploadLifecycle.handleError)
      }
    }

    if (isWaitingResponse(response)) {
      return this.isFileUploadedFromUrlPolling
        .then(status => this.handleFromUrlStatusResponse(token, status))
        .catch(this.uploadLifecycle.handleError)
    }

    if (isErrorResponse(response)) {
      return this.uploadLifecycle.handleError(new Error(response.error))
    }

    if (isProgressResponse(response)) {
      if (this.isCancelled) {
        return Promise.reject(new CancelError())
      }

      this.uploadLifecycle.handleUploading({
        total: response.total,
        loaded: response.done,
      })

      return this.isFileUploadedFromUrlPolling
        .then(status => this.handleFromUrlStatusResponse(token, status))
        .catch(this.uploadLifecycle.handleError)
    }

    if (isSuccessResponse(response)) {
      const {uuid} = response

      if (this.isCancelled) {
        return Promise.reject(new CancelError())
      }

      return this.fileUploadLifecycle.handleUploadedFile(uuid, this.settings)
        .then(this.uploadLifecycle.handleReady)
        .catch(this.uploadLifecycle.handleError)
    }
  }

  cancel(): void {
    const {state} = this.uploadLifecycle.getProgress()

    switch (state) {
      case ProgressState.Uploading:
        if (this.isFileUploadedFromUrlPolling) {
          this.isFileUploadedFromUrlPolling.cancel()
        } else {
          this.isCancelled = true
        }
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
