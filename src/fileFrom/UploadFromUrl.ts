import fromUrl, {FromUrlResponse, isFileInfoResponse, isTokenResponse, Url} from '../api/fromUrl'
import {Settings, UploadcareFile, ProgressState} from '../types'
import fromUrlStatus, {
  FromUrlStatusResponse,
  isErrorResponse,
  isProgressResponse,
  isSuccessResponse,
  isUnknownResponse,
  isWaitingResponse,
} from '../api/fromUrlStatus'
import {UploadFrom} from './UploadFrom'
import checkFileIsUploadedFromUrl from '../checkFileIsUploadedFromUrl'
import {PollPromiseInterface} from '../tools/poll'
import CancelError from '../errors/CancelError'
import {Uuid} from '../api/types'

export class UploadFromUrl extends UploadFrom {
  protected readonly promise: Promise<UploadcareFile>
  private isFileUploadedFromUrlPolling: PollPromiseInterface<FromUrlStatusResponse> | null = null
  private isCancelled: boolean = false
  private unknownStatusWasTimes: number = 0

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

  private handleFromUrlStatusResponse = (token: Uuid, response: FromUrlStatusResponse) => {
    this.isFileUploadedFromUrlPolling = checkFileIsUploadedFromUrl({
      token,
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
      this.unknownStatusWasTimes++

      if (this.unknownStatusWasTimes === 3) {
        return Promise.reject(`Token "${token}" was not found.`)
      } else {
        return this.isFileUploadedFromUrlPolling
          .then(status => this.handleFromUrlStatusResponse(token, status))
          .catch(this.handleError)
      }
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
