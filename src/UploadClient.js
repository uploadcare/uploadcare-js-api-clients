/* @flow */
import defaultSettings from './default-settings'
import UploadAPI from './api'
import type {FileData, FileInfo, Settings} from './types'

export type File = {|
  status: 'uploading' | 'uploaded' | 'ready',
  info: FileInfo,
  promise: Promise<FileInfo>,
  onProgress: Function | null,
  onCancel: Function | null,
  cancel: Function,
|}

const MAX_TIMEOUT = 300

export default class UploadClient {
  settings: Settings
  updateSettingsListeners: Array<Function>
  api: UploadAPI

  constructor(settings: Settings = {}): void {
    this.settings = {
      ...defaultSettings,
      ...settings,
    }
    /* TODO Set up user agent */
    this.updateSettingsListeners = []
    this.api = new UploadAPI(this)
  }

  setSettings(newSettings: Settings = {}): void {
    const prevSettings = {...this.settings}

    this.settings = {
      ...prevSettings,
      ...newSettings,
    }

    this.updateSettingsListeners.forEach(listener => {
      listener(prevSettings)
    })
  }

  addUpdateSettingsListener(listener: Function): void {
    this.updateSettingsListeners.push(listener)
  }

  removeUpdateSettingsListener(listener: Function): void {
    for (let index = 0; index < this.updateSettingsListeners.length; index++) {
      if (this.updateSettingsListeners[index] === listener) {
        this.updateSettingsListeners.splice(index, 1)

        break
      }
    }
  }

  checkFileIsReady(uuid: string, handleFileInfo: (FileInfo) => void, timeout, settings: Settings = {}): Promise {
    return new Promise((resolve, reject) => {
      this.api.info(uuid, settings)
        .then(fileInfo => {
          handleFileInfo(fileInfo)

          if (fileInfo.is_ready) {
            resolve()
          }

          setTimeout(() => {
            this.checkFileIsReady(uuid, handleFileInfo, Math.min(MAX_TIMEOUT, timeout + 50), settings)
              .then(() => {
                resolve()
              })
              .catch(() => {
                reject()
              })
          }, timeout)
        })
        .catch(() => {
          reject()
        })
    })
  }

  fileFrom(from: string, data: FileData, settings: Settings = {}): File {
    const uploading = this.api.base(data, settings)

    const file = {
      status: 'uploading',
      info: {},
      promise: uploading.promise
        .then(({file: uuid}) => {
          file.status = 'uploaded'
          file.info = {uuid}

          return this.checkFileIsReady(uuid, (fileInfo) => {
            file.info = {...fileInfo}
          }, 100, settings)
        })
        .then(() => {
          file.status = 'ready'

          return {...file.info}
        })
        .catch(() => Promise.reject()),
      onProgress: null,
      onCancel: null,
      cancel: uploading.cancel,
    }

    return file
  }
}
