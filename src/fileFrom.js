/* @flow */
import base from './api/base'
import checkFileIsReady from './checkFileIsReady'
import type {FileData, FileInfo, Settings} from './types'

export class File {
  _promise: Promise<FileInfo>
  status: 'uploading' | 'uploaded' | 'ready'
  info: FileInfo
  onProgress: ?Function
  onCancel: ?Function
  cancel: Function

  constructor(data: FileData, settings: Settings) {
    const uploading = base(data, settings)

    this._promise = uploading
      .then(({file: uuid}) => {
        this.status = 'uploaded'
        this.info = {uuid}

        return checkFileIsReady(uuid, (fileInfo) => {
          this.info = {...fileInfo}
        }, 100, settings)
      })
      .then(() => {
        this.status = 'ready'

        return {...this.info}
      })
    this.onProgress = null
    this.onCancel = null
    this.cancel = uploading.cancel

    /* TODO Add progress for checking ready */
    uploading.onProgress = (progressEvent) => {
      if (typeof this.onProgress === 'function') {
        this.onProgress(progressEvent)
      }
    }

    uploading.onCancel = () => {
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
 * @returns {File}
 */
export default function fileFrom(from: string, data: FileData, settings: Settings = {}): File {
  return new File(data, settings)
}
