import fromUrl, {FromUrlResponse, isFileInfoResponse, isTokenResponse, Url} from '../api/fromUrl'
import {Settings, UploadcareFile} from '../types'
import fromUrlStatus, {
  FromUrlStatusResponse,
  isErrorResponse,
  isProgressResponse,
  isSuccessResponse,
  isUnknownResponse,
  isWaitingResponse,
} from '../api/fromUrlStatus'
import {ProgressState, UploadFrom} from './UploadFrom'
import checkFileIsUploadedFromUrl from '../checkFileIsUploadedFromUrl'
import {PollPromiseInterface} from '../tools/poll'
import CancelError from '../errors/CancelError'

export class UploadFromUrl extends UploadFrom {
  protected readonly promise: Promise<UploadcareFile>
  private isFileUploadedFromUrlPolling: PollPromiseInterface<FromUrlStatusResponse> | null = null
  private isCancelled: boolean = false

  protected readonly data: Url
  protected readonly settings: Settings

  constructor(data: Url, settings: Settings) {
    super()

    this.data = data
    this.settings = settings

    this.promise = this.getFilePromise()
  }

  private getFilePromise = (): Promise<UploadcareFile> => {
    this.handleUploading()

    return fromUrl(this.data, this.settings)
      .then(this.handleFromUrlResponse)
      .then(this.handleReady)
      .catch(this.handleError)
  }

  private handleFromUrlResponse = (response: FromUrlResponse) => {
    if (isTokenResponse(response)) {
      const {token} = response

      return fromUrlStatus(token, this.settings)
        .then(response => this.handleFromUrlStatusResponse(token, response) )
        .catch(this.handleError)
    } else if (isFileInfoResponse(response)) {
      const {uuid} = response

      return this.handleUploaded(uuid, this.settings)
    }
  }

  private handleFromUrlStatusResponse = (token: string, response: FromUrlStatusResponse) => {
    this.isFileUploadedFromUrlPolling = checkFileIsUploadedFromUrl({
      token,
      timeout: 1000,
      onProgress: (response) => {
        // Update uploading progress
        this.handleUploading({
          total: response.total,
          loaded: response.done,
        })
      },
      settings: this.settings
    })

    if (isUnknownResponse(response)) {
      return Promise.reject(`Token "${token}" not found.`)
    }

    if (isWaitingResponse(response)) {
      return this.isFileUploadedFromUrlPolling
        .then(status => this.handleFromUrlStatusResponse(token, status))
        .catch(this.handleError)
    }

    if (isErrorResponse(response)) {
      return this.handleError(response.error)
    }

    if (isProgressResponse(response)) {
      if (this.isCancelled) {
        return Promise.reject(new CancelError())
      }

      this.handleUploading({
        total: response.total,
        loaded: response.done,
      })

      return this.isFileUploadedFromUrlPolling
        .then(status => this.handleFromUrlStatusResponse(token, status))
        .catch(this.handleError)
    }

    if (isSuccessResponse(response)) {
      const {uuid} = response

      if (this.isCancelled) {
        return Promise.reject(new CancelError())
      }

      return this.handleUploaded(uuid, this.settings)
        .then(this.handleReady)
        .catch(this.handleError)
    }
  }

  cancel(): void {
    const {state} = this.getProgress()

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
