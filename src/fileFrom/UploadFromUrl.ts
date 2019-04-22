import fromUrl, {FromUrlResponse, isFileInfoResponse, isTokenResponse, Url} from '../api/fromUrl'
import {Settings, UploadcareFile} from '../types'
import fromUrlStatus, {
  FromUrlStatusResponse,
  isErrorResponse,
  isProgressResponse,
  isSuccessResponse,
  isUnknownResponse,
} from '../api/fromUrlStatus'
import {UploadFrom} from './UploadFrom'
import checkFileIsUploadedFromUrl from '../checkFileIsUploadedFromUrl'
import {PollPromiseInterface} from '../tools/poll'

export class UploadFromUrl extends UploadFrom {
  protected readonly promise: Promise<UploadcareFile>
  private polling: PollPromiseInterface<FromUrlStatusResponse> | null = null

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
    // Now just ignore 'unknown' response and make request again
    // TODO: Remake into polling
    if (isUnknownResponse(response)) {
      return this.getFilePromise()
    }

    if (isErrorResponse(response)) {
      return this.handleError(response.error)
    }

    if (isProgressResponse(response)) {
      this.handleUploading({
        total: response.total,
        loaded: response.done,
      })

      this.polling = checkFileIsUploadedFromUrl({
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

      return this.polling
        .then(status => this.handleFromUrlStatusResponse(token, status))
        .catch(this.handleError)
    }

    if (isSuccessResponse(response)) {
      const {uuid} = response

      return this.handleUploaded(uuid, this.settings)
        .then(this.handleReady)
        .catch(this.handleError)
    }
  }

  cancel(): void {
    if (this.polling) {
      this.polling.cancel()
    }
  }
}
