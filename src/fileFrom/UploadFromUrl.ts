import fromUrl, {FromUrlResponse, isFileInfoResponse, isTokenResponse, Url} from '../api/fromUrl'
import {Settings, UploadcareFile} from '../types'
import fromUrlStatus, {
  FromUrlStatusResponse,
  isErrorResponse,
  isProgressResponse,
  isSuccessResponse,
} from '../api/fromUrlStatus'
import {UploadFrom} from './UploadFrom'

export class UploadFromUrl extends UploadFrom {
  protected request: Promise<UploadcareFile>

  readonly data: Url
  readonly settings: Settings

  cancel: (() => void)

  constructor(data: Url, settings: Settings) {
    super()

    this.data = data
    this.settings = settings
    this.cancel = () => {
      if (this.timerId) {
        clearTimeout(this.timerId)
      }
    }
    this.request = this.getFilePromise()
  }

  private getFilePromise(): Promise<UploadcareFile> {
    const urlPromise = fromUrl(this.data, this.settings)

    this.handleUploading()
    this.handleCancelling()

    return urlPromise
      .then(this.handleFromUrlResponse)
      .then(this.handleReady)
      .catch(this.handleError)
  }

  private handleFromUrlResponse(response: FromUrlResponse) {
    if (isTokenResponse(response)) {
      const {token} = response
      const status = fromUrlStatus(token, this.settings)

      return status
        .then(this.handleFromUrlStatusResponse)
        .catch(this.handleError)
    } else if (isFileInfoResponse(response)) {
      const {uuid} = response

      return this.handleUploaded(uuid, this.settings)
    }
  }

  private handleFromUrlStatusResponse(response: FromUrlStatusResponse) {
    if (isErrorResponse(response)) {
      this.handleError(response.error)
    } else if (isProgressResponse(response)) {
      this.handleUploading({
        total: response.total,
        loaded: response.done,
      })
    } else if (isSuccessResponse(response)) {
      const {uuid} = response

      this.handleUploading({
        total: response.total,
        loaded: response.done,
      })

      return this.handleUploaded(uuid, this.settings)
    }
  }
}
