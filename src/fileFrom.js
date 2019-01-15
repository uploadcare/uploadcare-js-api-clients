/* @flow */
import base from './api/base'
import checkFileIsReady from './checkFileIsReady'
import prettyFileInfo from './prettyFileInfo'
import type {FileData, FileInfo, Settings} from './types'
import type {BaseProgress} from './api/base'

export type FileUploadProgress = {|
  state: string,
  uploadProgress: null | BaseProgress,
  value: number,
|}

export class FileUpload {
  _promise: Promise<FileInfo>
  progress: FileUploadProgress
  info: null | FileInfo
  onProgress: ?(progress: FileUploadProgress) => void
  onUploaded: ?Function
  onReady: ?Function
  onCancel: ?Function
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

        this.info = {
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

        return checkFileIsReady(uuid, (fileInfo) => {
          this.info = prettyFileInfo(fileInfo)
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
          this.onReady({...this.info})
        }

        // $FlowFixMe
        return {...this.info}
      })
    this.progress = {
      state: 'uploading',
      uploadProgress: null,
      value: 0,
    }
    this.info = null
    this.onProgress = null
    this.onUploaded = null
    this.onReady = null
    this.onCancel = null
    this.cancel = directUpload.cancel

    directUpload.onProgress = (progressEvent) => {
      this.progress = {
        ...this.progress,
        uploadProgress: progressEvent,
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
    return this._promise.then(onFulfilled, onRejected)
  }

  catch(onRejected?: Function) {
    return this._promise.catch(onRejected)
  }

  finally(onFinally: Function) {
    return this._promise.finally(onFinally)
  }
}

/**
 * Uploads file from provided data
 *
 * @param from
 * @param data
 * @param settings
 * @returns {FileUpload}
 */
export default function fileFrom(from: string, data: FileData, settings: Settings = {}): FileUpload {
  return new FileUpload(data, settings)
}
