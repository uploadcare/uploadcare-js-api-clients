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

  fileFrom(from: string, data: FileData, settings: Settings = {}): File {
    const uploading = this.api.base(data, settings)
    const file = {
      status: 'uploading',
      info: {},
      promise: new Promise((resolve, reject) => {
        uploading.promise
          .then(({file: uuid}) => {
            file.status = 'uploaded'
            file.info = {uuid}

            let timeout = 100

            const updateFileInfo = () => new Promise((resolveUpdating, rejectUpdating) => {
              this.api.info(uuid, settings)
                .then(fileInfo => {
                  file.info = {...fileInfo}

                  if (file.info.is_ready) {
                    resolveUpdating()
                  }
                  else {
                    setTimeout(() => {
                      updateFileInfo()
                        .then(() => resolveUpdating())
                        .catch(() => rejectUpdating())
                    }, timeout)

                    timeout += 50
                  }
                })
                .catch(() => rejectUpdating())
            })

            updateFileInfo()
              .then(() => {
                file.status = 'ready'

                resolve(file.info)
              })
              .catch(() => {
                reject()
              })
          })
          .catch(error => {
            reject(error)
          })
      }),
      onProgress: null,
      onCancel: null,
      cancel: uploading.cancel,
    }

    return file
  }
}
