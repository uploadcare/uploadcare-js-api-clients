/* Vendors */
import * as FormData from 'form-data'
import axios, {AxiosRequestConfig, CancelTokenSource} from 'axios'

import {Thenable} from '../../thenable/Thenable'
import defaultSettings from '../../defaultSettings'
import {isNode} from '../../tools/isNode'
import CancelError from '../../errors/CancelError'
import RequestError from '../../errors/RequestError'

/* Types */
import {FileData, SettingsInterface} from '../../types'
import {MultipartPart, MultipartUploadResponse} from './types'
import {BaseThenableInterface} from '../../thenable/types'

const nodeUploadProgress = (config: AxiosRequestConfig): AxiosRequestConfig => {
  const {data, onUploadProgress} = config
  if (!onUploadProgress) {
    return config
  }

  const total = data.getLengthSync()

  let loaded = 0

  data.on('data', chunk => {
    loaded += chunk.length

    onUploadProgress({
      total,
      loaded,
    } as ProgressEvent)
  })

  return config
}

class MultipartUploadPart extends Thenable<MultipartUploadResponse> implements BaseThenableInterface<MultipartUploadResponse> {
  onProgress: ((progressEvent: ProgressEvent) => void) | null = null
  onCancel: (() => void) | null = null

  protected readonly promise: Promise<MultipartUploadResponse>
  private readonly cancelController: CancelTokenSource

  constructor(partUrl: MultipartPart, file: FileData, settings: SettingsInterface) {
    super()

    this.cancelController = axios.CancelToken.source()
    const formData = new FormData()
    formData.append('data', file)

    const options = {
      data: formData,
      url: partUrl,
      method: 'PUT',
      cancelToken: this.cancelController.token,
      maxContentLength: settings.maxContentLength || defaultSettings.maxContentLength,
      onUploadProgress: (progressEvent: ProgressEvent) => {
        if (typeof this.onProgress === 'function') {
          this.onProgress(progressEvent)
        }
      }
    }

    const instance = axios.create()

    if (isNode()) {
      instance.interceptors.request.use(nodeUploadProgress,
        error => {
          return Promise.reject(error)
        }
      )
    }

    this.promise = instance(options as AxiosRequestConfig)
      .catch(error => {
        const {url} = options

        if (axios.isCancel(error)) {
          throw new CancelError()
        }

        if (error.response) {
          const errorRequestInfo = {
            headers: error.config.headers,
            url: error.config.url || url,
          }
          const errorResponseInfo = {
            status: error.response.status,
            statusText: error.response.statusText,
          }

          throw new RequestError(errorRequestInfo, errorResponseInfo)
        }

        throw error
      })
      .then(response => Promise.resolve({code: response.status}))
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
  }

  cancel(): void {
    return this.cancelController.cancel()
  }
}

/**
 * Upload part of multipart file.
 *
 * @param {MultipartPart} partUrl
 * @param {FileData} file
 * @param {SettingsInterface} settings
 * @return {BaseThenableInterface<MultipartUploadResponse>}
 */
export default function multipartUploadPart(partUrl: MultipartPart, file: FileData, settings: SettingsInterface = {}): BaseThenableInterface<MultipartUploadResponse> {
  return new MultipartUploadPart(partUrl, file, settings)
}
