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
import checkFileIsUploaded from '../checkFileIsUploaded'

export class UploadFromUrl extends UploadFrom {
  protected readonly uploadRequest: Promise<FromUrlResponse>
  protected statusRequest: Promise<FromUrlStatusResponse> | null = null

  protected readonly promise: Promise<UploadcareFile>

  protected readonly data: Url
  protected readonly settings: Settings

  constructor(data: Url, settings: Settings) {
    super()

    this.data = data
    this.settings = settings
    this.uploadRequest = fromUrl(this.data, this.settings)

    this.handleUploading()
    this.promise = this.uploadRequest
      .then(this.handleFromUrlResponse)
      .then(this.handleReady)
      .catch(this.handleError)
  }

  private getFilePromise(): Promise<UploadcareFile> {
    const urlPromise = this.uploadRequest

    this.handleUploading()

    return urlPromise
      .then(this.handleFromUrlResponse)
      .then(this.handleReady)
      .catch(this.handleError)
  }

  private handleFromUrlResponse = (response: FromUrlResponse) => {
    if (isTokenResponse(response)) {
      const {token} = response
      this.statusRequest = fromUrlStatus(token, this.settings)

      return this.statusRequest
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

      return checkFileIsUploaded({
        token,
        timeout: 100,
        onProgress: (response) => {
          this.handleUploading({
            total: response.total,
            loaded: response.done,
          })
        },
        settings: this.settings
      })
        .then(status => this.handleFromUrlStatusResponse(token, status))
        .catch(error => this.handleError(error))
    }

    if (isSuccessResponse(response)) {
      const {uuid} = response

      return this.handleUploaded(uuid, this.settings)
    }
  }

  cancel(): void {
    // TODO: Implement this
  }
}
