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

  private handleFromUrlResponse = (response: FromUrlResponse) => {
    if (isTokenResponse(response)) {
      const {token} = response
      const status = fromUrlStatus(token, this.settings)

      return status
        .then(response => this.handleFromUrlStatusResponse(token, response) )
        .catch(this.handleError)
    } else if (isFileInfoResponse(response)) {
      const {uuid} = response

      return this.handleUploaded(uuid, this.settings)
    }
  }

  private handleFromUrlStatusResponse = (token: string, response: FromUrlStatusResponse) => {
    if (isUnknownResponse(response)) {
      // TODO: More info about error
      return this.handleError(new Error('Unknown response'))
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
        token, timeout: 100, settings: this.settings
      })
        .then(status => this.handleFromUrlStatusResponse(token, status))
        .catch(error => Promise.reject(error))
    }

    if (isSuccessResponse(response)) {
      const {uuid} = response

      return this.handleUploaded(uuid, this.settings)
    }
  }
}
