import base from './api/base'
import checkFileIsReady from './checkFileIsReady'
import prettyFileInfo from './prettyFileInfo'
import {FileData, UFile, Settings} from './types'
import {BaseProgress} from './api/base'

export type FilePromiseProgress = {
  state: string,
  upload: null | BaseProgress,
  value: number,
}

export class FilePromise {
  _promise: Promise<UFile>
  progress: FilePromiseProgress
  file: null | UFile
  onProgress: ((progress: FilePromiseProgress) => void) | null
  onUploaded: Function | null
  onReady: Function | null
  onCancel: Function | null
  cancel: Function

  constructor(data: FileData, settings: Settings) {
    const directUpload = base(data, settings)

    this._promise = directUpload
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
          originalImageInfo: null,
        }

        if (typeof this.onUploaded === 'function') {
          this.onUploaded(uuid)
        }

        return checkFileIsReady(uuid, (info) => {
          this.file = prettyFileInfo(info, settings)
        }, 100, settings)
      })
      .then(() => {
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

        return {...this.file}
      })
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
        value: (progressEvent.total / progressEvent.loaded) * 0.9,
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

  then(onFulfilled?: Function, onRejected?: Function) {
    // TODO: Fix ts-ignore
    // @ts-ignore
    return this._promise.then(onFulfilled, onRejected)
  }

  catch(onRejected?: Function) {
    // TODO: Fix ts-ignore
    // @ts-ignore
    return this._promise.catch(onRejected)
  }

  finally(onFinally: Function) {
    // TODO: Fix ts-ignore
    // @ts-ignore
    return this._promise.finally(onFinally)
  }
}

/**
 * Uploads file from provided data
 *
 * @param from
 * @param data
 * @param settings
 * @returns {FilePromise}
 */
export default function fileFrom(from: string, data: FileData, settings: Settings = {}): FilePromise {
  return new FilePromise(data, settings)
}
