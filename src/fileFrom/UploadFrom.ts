import {Settings, UploadcareFileInterface, UploadingProgress, ProgressState, ProgressParams} from '../types'
import checkFileIsReady from '../checkFileIsReady'
import prettyFileInfo from '../prettyFileInfo'
import {Thenable} from '../tools/Thenable'
import {Uuid} from '../api/types'
import {PollPromiseInterface} from '../tools/poll'
import {InfoResponse} from '../api/info'
import {FileUploadInterface} from './types'
import {UploadcareFile} from '../UploadcareFile'
import set = Reflect.set

/**
 * Base abstract `thenable` implementation of `FileUploadInterface`.
 * You need to use this as base class for all uploading methods of `fileFrom`.
 * All that you need to implement — `promise` property and `cancel` method.
 */
export abstract class UploadFrom extends Thenable<UploadcareFileInterface> implements FileUploadInterface {
  protected abstract readonly promise: Promise<UploadcareFileInterface>
  protected isFileReadyPolling: PollPromiseInterface<InfoResponse> | null = null
  abstract cancel(): void

  protected progress: UploadingProgress = {
    state: ProgressState.Pending,
    uploaded: null,
    value: 0,
  }
  protected file: UploadcareFileInterface | null = null

  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareFileInterface) => void) | null = null
  onCancel: VoidFunction | null = null

  protected constructor() {
    super()
    this.handleCancelling = this.handleCancelling.bind(this)
  }

  protected setProgress(state: ProgressState, progress?: ProgressParams) {
    switch (state) {
      case ProgressState.Pending:
        this.progress = {
          state: ProgressState.Pending,
          uploaded: null,
          value: 0,
        }
        break
      case ProgressState.Uploading:
        this.progress = {
          state: ProgressState.Uploading,
          uploaded: progress || null,
          // leave 1 percent for uploaded and 1 for ready on cdn
          value: progress ? Math.round((progress.loaded * 98) / progress.total) : 0,
        }
        break
      case ProgressState.Uploaded:
        this.progress = {
          state: ProgressState.Uploaded,
          uploaded: null,
          value: 99,
        }
        break
      case ProgressState.Ready:
        this.progress = {
          state: ProgressState.Ready,
          uploaded: null,
          value: 100,
        }
        break
      case ProgressState.Canceled:
        this.progress = {
          state: ProgressState.Canceled,
          uploaded: null,
          value: 0,
        }
        break
      case ProgressState.Error:
        this.progress = {
          state: ProgressState.Error,
          uploaded: null,
          value: 0,
        }
        break
    }
  }

  protected getProgress(): UploadingProgress {
    return this.progress
  }

  protected setFile(file: UploadcareFileInterface) {
    this.file = file
  }

  protected getFile(): UploadcareFileInterface {
    return this.file as UploadcareFileInterface
  }

  /**
   * Handle cancelling of uploading file.
   */
  protected handleCancelling(): void {
    this.setProgress(ProgressState.Canceled)

    if (typeof this.onCancel === 'function') {
      this.onCancel()
    }
  }

  /**
   * Handle file uploading.
   * @param {ProgressParams} progress
   */
  protected handleUploading(progress?: ProgressParams): void {
    this.setProgress(ProgressState.Uploading, progress)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }
  }

  /**
   * Handle uploaded file.
   * @param {Uuid} uuid
   * @param {Settings} settings
   */
  protected handleUploaded(uuid: Uuid, settings: Settings): Promise<UploadcareFileInterface> {
    this.setFile(new UploadcareFile({
      uuid,
      name: null,
      // @ts-ignore
      size: null,
      isStored: null,
      isImage: null,
      cdnUrl: null,
      cdnUrlModifiers: null,
      originalUrl: null,
      originalFilename: null,
      originalImageInfo: null,
    }, settings))

    this.setProgress(ProgressState.Uploaded)

    if (typeof this.onUploaded === 'function') {
      this.onUploaded(uuid)
    }

    this.isFileReadyPolling = checkFileIsReady({
      uuid,
      settings,
    })

    return this.isFileReadyPolling
      .then(info => {
        this.setFile(new UploadcareFile(info, settings))

        return Promise.resolve(this.getFile())
      })
      .catch(error => Promise.reject(error))
  }

  /**
   * Handle uploaded file that ready on CDN.
   */
  protected handleReady = (): Promise<UploadcareFileInterface> => {
    this.setProgress(ProgressState.Ready)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }

    if (typeof this.onReady === 'function') {
      this.onReady(this.getFile())
    }

    return Promise.resolve(this.getFile())
  }

  /**
   * Handle uploading error
   * @param error
   */
  protected handleError = (error) => {
    this.setProgress(ProgressState.Error)

    if (error.name === 'CancelError') {
      this.handleCancelling()
    }

    return Promise.reject(error)
  }
}
