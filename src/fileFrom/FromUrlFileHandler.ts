import {FileHandlerInterface} from './types'
import {BaseThenableInterface} from '../thenable/types'
import base, {BaseResponse} from '../api/base'
import {FileInfoInterface, Uuid} from '../api/types'
import {FileData, ProgressStateEnum, SettingsInterface, UploadcareFileInterface} from '../types'
import {getFileSize} from '../api/multipart/getFileSize'
import defaultSettings from '../defaultSettings'
import multipart from '../multipart/multipart'
import {FileUploadLifecycleInterface} from '../lifecycle/types'
import {Url} from '..'
import {PollPromiseInterface} from '../tools/poll'
import fromUrlStatus, {
  FromUrlStatusResponse,
  isErrorResponse, isProgressResponse, isSuccessResponse,
  isUnknownResponse,
  isWaitingResponse
} from '../api/fromUrlStatus'
import fromUrl, {FromUrlResponse, isFileInfoResponse, isTokenResponse} from '../api/fromUrl'
import checkFileIsUploadedFromUrl from '../checkFileIsUploadedFromUrl'
import CancelError from '../errors/CancelError'

export class FromUrlFileHandler implements FileHandlerInterface {
  private isFileUploadedFromUrlPolling: PollPromiseInterface<FromUrlStatusResponse> | null = null
  private isCancelled = false
  private unknownStatusWasTimes = 0
  private readonly data: Url
  private readonly settings: SettingsInterface

  constructor(data: Url, settings: SettingsInterface) {
    this.data = data
    this.settings = settings
  }

  upload(lifecycle: FileUploadLifecycleInterface): Promise<UploadcareFileInterface> {
    const uploadLifecycle = lifecycle.uploadLifecycle
    uploadLifecycle.handleUploading()

    return fromUrl(this.data, this.settings)
      .then((response) => this.handleFromUrlResponse(response, lifecycle))
      .then(uploadLifecycle.handleReady.bind(uploadLifecycle))
      .catch(uploadLifecycle.handleError.bind(uploadLifecycle))
  }

  private handleFromUrlResponse = (response: FromUrlResponse, lifecycle: FileUploadLifecycleInterface) => {
    if (isTokenResponse(response)) {
      const {token} = response
      const uploadLifecycle = lifecycle.uploadLifecycle

      return fromUrlStatus(token, this.settings)
        .then(response => this.handleFromUrlStatusResponse(token, response, lifecycle) )
        .catch(uploadLifecycle.handleError.bind(uploadLifecycle))
    } else if (isFileInfoResponse(response)) {
      const {uuid} = response

      return lifecycle.handleUploadedFile(uuid, this.settings)
    }
  }

  private handleFromUrlStatusResponse = (token: Uuid, response: FromUrlStatusResponse, lifecycle: FileUploadLifecycleInterface) => {
    const uploadLifecycle = lifecycle.uploadLifecycle
    this.isFileUploadedFromUrlPolling = checkFileIsUploadedFromUrl({
      token,
      timeout: this.settings.pollingTimeoutMilliseconds || defaultSettings.pollingTimeoutMilliseconds,
      onProgress: (response) => {
        // Update uploading progress
        uploadLifecycle.handleUploading({
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
          .then(status => this.handleFromUrlStatusResponse(token, status, lifecycle))
          .catch(uploadLifecycle.handleError.bind(uploadLifecycle))
      }
    }

    if (isWaitingResponse(response)) {
      return this.isFileUploadedFromUrlPolling
        .then(status => this.handleFromUrlStatusResponse(token, status, lifecycle))
        .catch(uploadLifecycle.handleError.bind(uploadLifecycle))
    }

    if (isErrorResponse(response)) {
      return uploadLifecycle.handleError(new Error(response.error))
    }

    if (isProgressResponse(response)) {
      if (this.isCancelled) {
        return Promise.reject(new CancelError())
      }

      uploadLifecycle.handleUploading({
        total: response.total,
        loaded: response.done,
      })

      return this.isFileUploadedFromUrlPolling
        .then(status => this.handleFromUrlStatusResponse(token, status, lifecycle))
        .catch(uploadLifecycle.handleError.bind(uploadLifecycle))
    }

    if (isSuccessResponse(response)) {
      const {uuid} = response

      if (this.isCancelled) {
        return Promise.reject(new CancelError())
      }

      return lifecycle.handleUploadedFile(uuid, this.settings)
        .then(uploadLifecycle.handleReady.bind(uploadLifecycle))
        .catch(uploadLifecycle.handleError.bind(uploadLifecycle))
    }
  }

  cancel(lifecycle: FileUploadLifecycleInterface): void {
    const uploadLifecycle = lifecycle.uploadLifecycle
    const isFileReadyPolling = lifecycle.getIsFileReadyPolling()
    const {state} = uploadLifecycle.getProgress()

    switch (state) {
      case ProgressStateEnum.Uploading:
        if (this.isFileUploadedFromUrlPolling) {
          this.isFileUploadedFromUrlPolling.cancel()
        } else {
          this.isCancelled = true
        }
        break
      case ProgressStateEnum.Uploaded:
      case ProgressStateEnum.Ready:
        if (isFileReadyPolling) {
          isFileReadyPolling.cancel()
        } else {
          this.isCancelled = true
        }
        break
    }
  }
}
