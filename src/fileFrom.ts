import base, {BaseResponse, DirectUpload} from './api/base'
import checkFileIsReady from './checkFileIsReady'
import prettyFileInfo from './prettyFileInfo'
import {FileData, UploadcareFile, Settings} from './types'
import {BaseProgress} from './api/base'

export enum FileFrom {
  Object = 'object',
  URL = 'url',
  DOM = 'input',
  Uploaded = 'uploaded',
}

export type FilePromiseProgress = {
  state: string,
  upload: null | BaseProgress,
  value: number,
}

export class FilePromise implements Promise<UploadcareFile> {
  private request: Promise<UploadcareFile>
  progress: FilePromiseProgress
  file: null | UploadcareFile
  onProgress: ((progress: FilePromiseProgress) => void) | null
  onUploaded: Function | null
  onReady: Function | null
  onCancel: Function | null
  cancel: Function

  constructor(data: FileData, settings: Settings) {
    const directUpload = base(data, settings)

    this.request = directUpload
      .then(({file: uuid}) => {
        this.progress = {
          ...this.progress,
          state: 'uploaded',
          value: 0.9,
        }

        if (typeof this.onProgress === 'function') {
          this.onProgress({...this.progress})
        }

        this.file = {
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
        }

        if (typeof this.onUploaded === 'function') {
          this.onUploaded(uuid)
        }

        const isReady = checkFileIsReady(uuid, (info) => {
          this.file = prettyFileInfo(info, settings)
        }, 100, settings)

        if (isReady) {
          this.progress = {
            ...this.progress,
            state: 'ready',
            value: 1,
          }

          if (typeof this.onProgress === 'function') {
            this.onProgress({...this.progress})
          }

          if (typeof this.onReady === 'function') {
            this.onReady({...this.file})
          }
        }

        return {...this.file}
      })
      // .then(() => {
      //   this.progress = {
      //     ...this.progress,
      //     state: 'ready',
      //     value: 1,
      //   }
      //
      //   if (typeof this.onProgress === 'function') {
      //     this.onProgress({...this.progress})
      //   }
      //
      //   if (typeof this.onReady === 'function') {
      //     this.onReady({...this.file})
      //   }
      //
      //   return {...this.file}
      // })
    this.progress = {
      state: 'uploading',
      upload: null,
      value: 0,
    }
    this.file = null
    this.onProgress = null
    this.onUploaded = null
    this.onReady = null
    this.onCancel = null
    this.cancel = directUpload.cancel

    directUpload.onProgress = (progressEvent) => {
      this.progress = {
        ...this.progress,
        upload: progressEvent,
        value: Math.round((progressEvent.loaded * 100) / progressEvent.total),
      }

      if (typeof this.onProgress === 'function') {
        this.onProgress({...this.progress})
      }
    }

    directUpload.onCancel = () => {
      if (typeof this.onCancel === 'function') {
        this.onCancel()
      }
    }
  }

  readonly [Symbol.toStringTag]: string

  catch<TResult = never>(
    onRejected?: ((reason: any) => (PromiseLike<TResult> | TResult)) | undefined | null
  ): Promise<UploadcareFile | TResult> {
    return this.request.catch(onRejected)
  }

  finally(onFinally?: (() => void) | undefined | null): Promise<UploadcareFile> {
    return this.request.finally(onFinally)
  }

  then<TResult1 = UploadcareFile, TResult2 = never>(
    onFulfilled?: ((value: UploadcareFile) => (PromiseLike<TResult1> | TResult1)) | undefined | null,
    onRejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.request.then(onFulfilled, onRejected)
  }
}

/**
 * Uploads file from provided data
 *
 * @param {FileFrom} from
 * @param {FileData} data
 * @param {Settings} settings
 * @returns {FilePromise}
 */
export default function fileFrom(from: FileFrom, data: FileData, settings: Settings = {}): FilePromise {
  return new FilePromise(data, settings)
}
