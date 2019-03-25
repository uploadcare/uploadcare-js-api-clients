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

export interface UploadFromInterface {
  onProgress: ((progress: UploadingProgress) => void) | null
  onUploaded: Function | null
  onReady: Function | null
  onCancel: Function | null

  upload(): Promise<UploadcareFile>

  getProgress(): UploadingProgress

  getFile(): UploadcareFile
}

export interface UploadCancellableInterface {
  cancel: Function
}

export abstract class UploadFrom implements UploadFromInterface {
  protected progress: UploadingProgress = {
    state: ProgressState.Pending,
    upload: null,
    value: 0,
  }
  protected file: UploadcareFile | undefined
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: Function | null = null
  onReady: Function | null = null
  onCancel: Function | null = null

  protected setProgress(state: ProgressState, progressEvent?: ProgressEvent) {
    switch (state) {
      case ProgressState.Uploading:
        this.progress = {
          ...this.getProgress(),
          state: ProgressState.Uploading,
          upload: progressEvent || null,
          value: progressEvent ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0,
        }
        break
      case ProgressState.Uploaded:
        this.progress = {
          ...this.getProgress(),
          state: ProgressState.Uploaded,
          value: 99,
        }
        break
      case ProgressState.Ready:
        this.progress = {
          ...this.getProgress(),
          state: ProgressState.Ready,
          value: 100,
        }
        break
      case ProgressState.Error:
        this.progress = {
          ...this.getProgress(),
          state: ProgressState.Error,
          value: 0,
        }
        break
    }
  }

  getProgress(): UploadingProgress {
    return this.progress
  }

  protected setFile(file: UploadcareFile) {
    this.file = {...file}
  }

  getFile(): UploadcareFile {
    return this.file as UploadcareFile
  }

  abstract upload(): Promise<UploadcareFile>

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
