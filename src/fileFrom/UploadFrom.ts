import {Settings, UploadcareFile} from '../types'
import checkFileIsReady from '../checkFileIsReady'
import prettyFileInfo from '../prettyFileInfo'
import {BaseProgress} from '../api/base'

export enum ProgressState {
  Pending = 'pending',
  Uploading = 'uploading',
  Uploaded = 'uploaded',
  Ready = 'ready',
  Error = 'error',
}

export type UploadingProgress = {
  state: ProgressState,
  upload: null | BaseProgress,
  value: number,
}

export interface UploadFromInterface extends Promise<UploadcareFile> {
  readonly [Symbol.toStringTag]: string

  onProgress: ((progress: UploadingProgress) => void) | null
  onUploaded: ((uuid: string) => void) | null
  onReady: ((file: UploadcareFile) => void) | null
  onCancel: (() => void) | null
  cancel: (() => void)

  getProgressState(): ProgressState

  getFile(): UploadcareFile

  then<TFulfilled = UploadcareFile, TRejected = never>(
    onFulfilled?: ((value: UploadcareFile) => (PromiseLike<TFulfilled> | TFulfilled)) | undefined | null,
    onRejected?: ((reason: any) => (PromiseLike<TRejected> | TRejected)) | undefined | null
  ): Promise<TFulfilled | TRejected>
  catch<TRejected = never>(
    onRejected?: ((reason: any) => (PromiseLike<TRejected> | TRejected)) | undefined | null
  ): Promise<UploadcareFile | TRejected>
}

export abstract class UploadFrom implements UploadFromInterface {
  readonly [Symbol.toStringTag]: string

  protected abstract request: Promise<UploadcareFile>
  protected progress: UploadingProgress = {
    state: ProgressState.Pending,
    upload: null,
    value: 0,
  }
  protected file: UploadcareFile | undefined

  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareFile) => void) | null = null
  onCancel: (() => void) | null = null

  abstract cancel: (() => void)

  protected setProgress(state: ProgressState, progressEvent?: ProgressEvent) {
    const progress = this.getProgress()

    switch (state) {
      case ProgressState.Pending:
        this.progress = {
          state: ProgressState.Pending,
          upload: null,
          value: 0,
        }
        break
      case ProgressState.Uploading:
        this.progress = {
          ...progress,
          state: ProgressState.Uploading,
          upload: progressEvent || null,
          value: progressEvent ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0,
        }
        break
      case ProgressState.Uploaded:
        this.progress = {
          ...progress,
          state: ProgressState.Uploaded,
          value: 99,
        }
        break
      case ProgressState.Ready:
        this.progress = {
          ...progress,
          state: ProgressState.Ready,
          value: 100,
        }
        break
      case ProgressState.Error:
        this.progress = {
          ...progress,
          state: ProgressState.Error,
          value: 0,
        }
        break
    }
  }

  protected getProgress(): UploadingProgress {
    return this.progress
  }

  getProgressState(): ProgressState {
    return this.getProgress().state
  }

  protected setFile(file: UploadcareFile) {
    this.file = file
  }

  getFile(): UploadcareFile {
    return this.file as UploadcareFile
  }

  then<TFulfilled = UploadcareFile, TRejected = never>(
    onFulfilled?: ((value: UploadcareFile) => (PromiseLike<TFulfilled> | TFulfilled)) | undefined | null,
    onRejected?: ((reason: any) => (PromiseLike<TRejected> | TRejected)) | undefined | null
  ): Promise<TFulfilled | TRejected> {
    return this.request.then(onFulfilled, onRejected)
  }
  catch<TRejected = never>(
    onRejected?: ((reason: any) => (PromiseLike<TRejected> | TRejected)) | undefined | null
  ): Promise<UploadcareFile | TRejected> {
    return this.request.then(onRejected)
  }

  /**
   * Handle uploading error
   * @param error
   */
  protected handleError(error) {
    this.setProgress(ProgressState.Error)

    return Promise.reject(error)
  }

  /**
   * Handle uploaded file.
   * @param {string} uuid
   * @param {Settings} settings
   */
  protected handleUploaded(uuid: string, settings: Settings) {
    this.setFile({
      uuid,
      name: null,
      size: null,
      isStored: null,
      isImage: null,
      cdnUrl: null,
      cdnUrlModifiers: null,
      originalUrl: null,
      originalFilename: null,
      originalImageInfo: null,
    })

    this.setProgress(ProgressState.Uploaded)

    if (typeof this.onUploaded === 'function') {
      this.onUploaded(uuid)
    }

    return checkFileIsReady(uuid, (info) => {
      this.file = prettyFileInfo(info, settings)
    }, 100, settings)
  }

  /**
   * Handle uploaded file that ready on CDN.
   */
  protected handleReady() {
    this.setProgress(ProgressState.Ready)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }

    if (typeof this.onReady === 'function') {
      this.onReady(this.getFile())
    }

    return Promise.resolve(this.getFile())
  }
}
