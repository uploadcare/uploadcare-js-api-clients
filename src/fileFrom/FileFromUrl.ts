import defaultSettings from '../defaultSettings'
import fromUrl from '../api/fromUrl'
import checkFileIsUploadedFromUrl from '../checkFileIsUploadedFromUrl'

/* Types */
import {SettingsInterface, UploadcareFileInterface} from '../types'
import {FileUploadLifecycleInterface, UploadHandlerInterface} from '../lifecycle/types'
import {Url} from '..'
import {isFileInfoResponse, isTokenResponse} from '../api/fromUrl'
import UnknownFromUrlStatusResponseError from '../errors/UnknownFromUrlStatusResponseError'
import TokenWasNotFoundError from '../errors/TokenWasNotFoundError'

export class FileFromUrl implements UploadHandlerInterface<UploadcareFileInterface, FileUploadLifecycleInterface> {
  private request
  private unknownStatusWasTimes = 0

  private readonly data: Url
  private readonly settings: SettingsInterface

  constructor(data: Url, settings: SettingsInterface) {
    this.data = data
    this.settings = settings
  }

  async upload(lifecycle: FileUploadLifecycleInterface): Promise<UploadcareFileInterface> {
    const settings = this.settings
    const uploadLifecycle = lifecycle.uploadLifecycle
    uploadLifecycle.handleUploading()

    this.request = fromUrl(this.data, settings)
    const response = await this.request
      .catch(uploadLifecycle.handleError.bind(uploadLifecycle))

    if (isTokenResponse(response)) {
      const {token} = response
      const onUnknown = (): void => {
        this.unknownStatusWasTimes++

        if (this.unknownStatusWasTimes === 3) {
          throw new TokenWasNotFoundError(token)
        }
      }
      const onProgress = (response): void => {
        // Update uploading progress
        uploadLifecycle.handleUploading({
          total: response.total,
          loaded: response.done,
        })
      }
      const timeout = settings.pollingTimeoutMilliseconds || defaultSettings.pollingTimeoutMilliseconds
      this.request = checkFileIsUploadedFromUrl({
        token,
        timeout,
        onUnknown,
        onProgress,
        settings,
      })
      const {uuid} = await this.request
        .catch(uploadLifecycle.handleError.bind(uploadLifecycle))

      return lifecycle.handleUploadedFile(uuid, settings)
    } else if (isFileInfoResponse(response)) {
      const {uuid} = response

      return lifecycle.handleUploadedFile(uuid, settings)
    }

    throw new UnknownFromUrlStatusResponseError(response)
  }

  cancel(): void {
    this.request.cancel()
  }
}
