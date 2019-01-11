/* @flow */
import base from './api/base'
import checkFileIsReady from './checkFileIsReady'
import type {FileData, FileInfo, Settings} from './types'

export class FileUpload {
  _promise: Promise<FileInfo>
  status: 'uploading' | 'uploaded' | 'ready'
  info: FileInfo
  onProgress: ?Function
  onUploaded: ?Function
  onReady: ?Function
  onCancel: ?Function
  cancel: Function

  constructor(data: FileData, settings: Settings) {
    const directUpload = base(data, settings)

    this._promise = directUpload
      .then(({file: uuid}) => {
        this.status = 'uploaded'
        this.info = {uuid}

        if (typeof this.onUploaded === 'function') {
          this.onUploaded(uuid)
        }

        return checkFileIsReady(uuid, (fileInfo) => {
          this.info = {...fileInfo}
        }, 100, settings)
      })
      .then(() => {
        this.status = 'ready'

        if (typeof this.onReady === 'function') {
          this.onReady({...this.info})
        }

        return {...this.info}
      })
    this.onProgress = null
    this.onUploaded = null
    this.onReady = null
    this.onCancel = null
    this.cancel = directUpload.cancel

    /* TODO Add progress for checking ready */
    directUpload.onProgress = (progressEvent) => {
      if (typeof this.onProgress === 'function') {
        this.onProgress(progressEvent)
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
