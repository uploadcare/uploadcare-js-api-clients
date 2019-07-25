/* Vendors */
import * as FormData from 'form-data'
import axios, {AxiosRequestConfig, CancelTokenSource} from 'axios'

import {Thenable} from '../../thenable/Thenable'
import defaultSettings from '../../defaultSettings'
import {isNode} from '../../tools/isNode'

/* Types */
import {HandleProgressFunction} from '../request/types'
import {FileData, Settings} from '../../types'
import {BaseProgress} from '../types'
import {MultipartPart, MultipartUploadResponse} from './types'
import {UploadThenableInterface} from '../../thenable/types'

const nodeUploadBufferProgress = (config: AxiosRequestConfig): AxiosRequestConfig => {
  const {data, onUploadProgress} = config
  if (!onUploadProgress) {
    return config
  }

  const formData = new FormData()
  formData.append('data', data)

  const total = formData.getLengthSync()

  let loaded = 0

  formData.on('data', chunk => {
    loaded += chunk.length

    onUploadProgress({
      total,
      loaded,
    } as ProgressEvent)
  })

  return config
}

class MultipartUploadPart extends Thenable<MultipartUploadResponse> implements UploadThenableInterface<MultipartUploadResponse> {
  onProgress: HandleProgressFunction | null = null
  onCancel: VoidFunction | null = null

  protected readonly promise: Promise<MultipartUploadResponse>
  private readonly cancelController: CancelTokenSource

  constructor(partUrl: MultipartPart, file: FileData, settings: Settings) {
    super()

    this.cancelController = axios.CancelToken.source()
    const options = {
      data: file,
      url: partUrl,
      method: 'PUT',
      cancelToken: this.cancelController.token,
      maxContentLength: settings.maxContentLength || defaultSettings.maxContentLength,
      onUploadProgress: (progressEvent: BaseProgress) => {
        if (typeof this.onProgress === 'function') {
          this.onProgress(progressEvent)
        }
      },
    }

    const instance = axios.create()

    if (isNode()) {
      instance.interceptors.request.use(nodeUploadBufferProgress,
        error => {
          return Promise.reject(error)
        }
      )
    }

    this.promise = instance(options as AxiosRequestConfig)
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
 * @param {Settings} settings
 * @return {UploadThenableInterface<MultipartUploadResponse>}
 */
export default function multipartUploadPart(partUrl: MultipartPart, file: FileData, settings: Settings = {}): UploadThenableInterface<MultipartUploadResponse> {
  return new MultipartUploadPart(partUrl, file, settings)
}
