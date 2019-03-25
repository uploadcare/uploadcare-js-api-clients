import base, {BaseProgress} from './api/base'
import checkFileIsReady from './checkFileIsReady'
import prettyFileInfo from './prettyFileInfo'
import {FileData, Settings, UploadcareFile} from './types'
import fromUrl, {TypeEnum, UrlData} from './api/fromUrl'
import {createCancelController} from './api/request'
import fromUrlStatus from './api/fromUrlStatus'

export enum FileFrom {
  Object = 'object',
  URL = 'url',
  DOM = 'input',
  Uploaded = 'uploaded',
}

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

interface UploadCancellableInterface {
  cancel: Function
}

abstract class UploadFrom implements UploadFromInterface {
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

class UploadFromObject extends UploadFrom implements UploadCancellableInterface {
  readonly data: FileData
  readonly settings: Settings
  cancel: Function

  constructor(data: FileData, settings: Settings) {
    super()
    const cancelController = createCancelController()

    this.data = data
    this.settings = settings
    this.cancel = cancelController.cancel
  }

  upload(): Promise<UploadcareFile> {
    const directUpload = base(this.data, this.settings)
    const filePromise = directUpload.upload()

    this.setProgress(ProgressState.Uploading)

    directUpload.onProgress = (progressEvent) => {
      this.setProgress(ProgressState.Uploading, progressEvent)

      if (typeof this.onProgress === 'function') {
        this.onProgress(this.getProgress())
      }
    }

    directUpload.onCancel = () => {
      if (typeof this.onCancel === 'function') {
        this.onCancel()
      }
    }

    return filePromise
      .then(({file: uuid}) => {
        return this.handleUploaded(uuid, this.settings)
      })
      .catch(this.handleError)
      .then(this.handleReady)
  }
}

class UploadFromUrl extends UploadFrom {
  readonly data: UrlData
  readonly settings: Settings

  constructor(data: UrlData, settings: Settings) {
    super()

    this.data = data
    this.settings = settings
  }

  upload(): Promise<UploadcareFile> {
    const urlPromise = fromUrl(this.data, this.settings)

    this.setProgress(ProgressState.Uploading)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }

    if (typeof this.onCancel === 'function') {
      this.onCancel()
    }

    return urlPromise
      .then(data => {
        const {type} = data

        if (type === TypeEnum.Token) {
          // @ts-ignore
          const {token} = data
          const status = fromUrlStatus(token, this.settings)

          status.then(data => {
            // @ts-ignore
            const {uuid} = data

            return this.handleUploaded(uuid, this.settings)
          })
        } else if (type === TypeEnum.FileInfo) {
          // @ts-ignore
          const {uuid} = data

          return this.handleUploaded(uuid, this.settings)
        }
      })
      .catch(this.handleError)
      .then(this.handleReady)
  }
}

/**
 * Uploads file from provided data
 *
 * @param {FileFrom} from
 * @param {FileData} data
 * @param {Settings} settings
 * @throws Error
 * @returns {UploadFromInterface}
 */
export default function fileFrom(from: FileFrom, data: FileData | UrlData, settings: Settings = {}): UploadFromInterface {
  switch (from) {
    case FileFrom.Object:
      return new UploadFromObject(data as FileData, settings)
    case FileFrom.URL:
      return new UploadFromUrl(data as UrlData, settings)
    default:
      throw new Error(`File uploading from "${from}" is not supported`)
  }
}
