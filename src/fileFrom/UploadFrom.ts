import checkFileIsReady from '../checkFileIsReady'
import prettyFileInfo from '../prettyFileInfo'
import {Thenable} from '../thenable/Thenable'

/* Types */
import {SettingsInterface, UploadcareFileInterface, UploadingProgress, ProgressStateEnum, ProgressParamsInterface} from '../types'
import {FileInfoInterface, Uuid} from '../api/types'
import {PollPromiseInterface} from '../tools/poll'
import {UploadInterface} from '../lifecycle/types'
import defaultSettings from '../defaultSettings'

/**
 * Base abstract `thenable` implementation of `UploadInterface<UploadcareFileInterface>`.
 * You need to use this as base class for all uploading methods of `fileFrom`.
 * All that you need to implement — `promise` property and `cancel` method.
 */
export abstract class UploadFrom extends Thenable<UploadcareFileInterface> implements UploadInterface<UploadcareFileInterface> {
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareFileInterface) => void) | null = null
  onCancel: (() => void) | null = null

  abstract cancel(): void

  protected abstract readonly promise: Promise<UploadcareFileInterface>
  protected isFileReadyPolling: PollPromiseInterface<FileInfoInterface> | null = null

  private progress: UploadingProgress = {
    state: ProgressStateEnum.Pending,
    uploaded: null,
    value: 0,
  }
  private file: UploadcareFileInterface | null = null

  protected constructor() {
    super()
    this.handleCancelling = this.handleCancelling.bind(this)
  }

  /**
   * Update progress.
   *
   * @param {ProgressStateEnum} state
   * @param {ProgressParamsInterface} progress
   * @return {void}
   */
  protected setProgress(state: ProgressStateEnum, progress?: ProgressParamsInterface): void {
    switch (state) {
      case ProgressStateEnum.Pending:
        this.progress = {
          state: ProgressStateEnum.Pending,
          uploaded: null,
          value: 0,
        }
        break
      case ProgressStateEnum.Uploading:
        this.progress = {
          state: ProgressStateEnum.Uploading,
          uploaded: progress || null,
          // leave 1 percent for uploaded and 1 for ready on cdn
          value: progress ? Math.round((progress.loaded / progress.total) * 0.98) : 0,
        }
        break
      case ProgressStateEnum.Uploaded:
        this.progress = {
          state: ProgressStateEnum.Uploaded,
          uploaded: null,
          value: 0.99,
        }
        break
      case ProgressStateEnum.Ready:
        this.progress = {
          state: ProgressStateEnum.Ready,
          uploaded: null,
          value: 1,
        }
        break
      case ProgressStateEnum.Canceled:
        this.progress = {
          state: ProgressStateEnum.Canceled,
          uploaded: null,
          value: 0,
        }
        break
      case ProgressStateEnum.Error:
        this.progress = {
          state: ProgressStateEnum.Error,
          uploaded: null,
          value: 0,
        }
        break
    }
  }

  /**
   * Get current progress.
   *
   * @return {UploadingProgress}
   */
  protected getProgress(): UploadingProgress {
    return this.progress
  }

  /**
   * Update current file.
   *
   * @param {UploadcareFileInterface} file
   * @return {void}
   */
  protected setFile(file: UploadcareFileInterface): void {
    this.file = file
  }

  /**
   * Get current file.
   *
   * @return {UploadcareFileInterface}
   */
  protected getFile(): UploadcareFileInterface {
    return this.file as UploadcareFileInterface
  }

  /**
   * Handle cancelling of uploading file.
   * @return {void}
   */
  protected handleCancelling(): void {
    this.setProgress(ProgressStateEnum.Canceled)

    if (typeof this.onCancel === 'function') {
      this.onCancel()
    }
  }

  /**
   * Handle file uploading.
   *
   * @param {ProgressParamsInterface} progress
   * @return {void}
   */
  protected handleUploading(progress?: ProgressParamsInterface): void {
    this.setProgress(ProgressStateEnum.Uploading, progress)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }
  }

  /**
   * Handle uploaded file.
   *
   * @param {Uuid} uuid
   * @param {SettingsInterface} settings
   */
  protected handleUploaded(uuid: Uuid, settings: SettingsInterface): Promise<UploadcareFileInterface> {
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

    this.setProgress(ProgressStateEnum.Uploaded)

    if (typeof this.onUploaded === 'function') {
      this.onUploaded(uuid)
    }

    this.isFileReadyPolling = checkFileIsReady({
      uuid,
      timeout: settings.pollingTimeoutMilliseconds || defaultSettings.pollingTimeoutMilliseconds,
      settings,
    })

    return this.isFileReadyPolling
      .then(info => {
        this.setFile(prettyFileInfo(info, settings))

        return Promise.resolve(this.getFile())
      })
      .catch(error => Promise.reject(error))
  }

  /**
   * Handle uploaded file that ready on CDN.
   *
   * @return {Promise<UploadcareFileInterface>}
   */
  protected handleReady = (): Promise<UploadcareFileInterface> => {
    this.setProgress(ProgressStateEnum.Ready)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }

    if (typeof this.onReady === 'function') {
      this.onReady(this.getFile())
    }

    return Promise.resolve(this.getFile())
  }

  /**
   * Handle uploading error.
   *
   * @param error
   * @return {Promise<Error>}
   */
  protected handleError = (error): Promise<Error> => {
    if (error.name === 'CancelError') {
      this.handleCancelling()
    } else {
      this.setProgress(ProgressStateEnum.Error)
    }

    return Promise.reject(error)
  }
}
