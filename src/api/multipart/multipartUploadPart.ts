import * as FormData from 'form-data'
import {HandleProgressFunction} from '../request/types'
import {Thenable} from '../../tools/Thenable'
import {FileData} from '../../types'
import {BaseProgress} from '../base'
import {DEFAULT_MAX_CONTENT_LENGTH} from '../request/request'
import axios, {AxiosRequestConfig, CancelTokenSource} from 'axios'
import {isNode} from '../../tools/isNode'
import {MultipartPart, MultipartUploadInterface, MultipartUploadResponse} from './types'

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

class MultipartUploadPart extends Thenable<MultipartUploadResponse> implements MultipartUploadInterface {
  onProgress: HandleProgressFunction | null = null
  onCancel: VoidFunction | null = null

  protected readonly promise: Promise<MultipartUploadResponse>
  private readonly cancelController: CancelTokenSource

  constructor(partUrl: MultipartPart, file: FileData) {
    super()

    this.cancelController = axios.CancelToken.source()
    const options = {
      data: file,
      url: partUrl,
      method: 'PUT',
      cancelToken: this.cancelController.token,
      maxContentLength: DEFAULT_MAX_CONTENT_LENGTH,
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
 * @return {MultipartUploadInterface}
 */
export default function multipartUploadPart(partUrl: MultipartPart, file: FileData): MultipartUploadInterface {
  return new MultipartUploadPart(partUrl, file)
}
