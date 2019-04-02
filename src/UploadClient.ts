import defaultSettings from './defaultSettings'
import UploadAPI from './api/index'
import fileFrom, {FileFrom} from './fileFrom/fileFrom'
import {FileData, Settings} from './types'
import {UploadFromInterface} from './fileFrom/UploadFrom'
import {Url} from './api/fromUrl'

export default class UploadClient {
  settings: Settings
  updateSettingsListeners: Array<Function>
  api: UploadAPI

  constructor(settings: Settings = {}) {
    this.settings = {
      ...defaultSettings,
      ...settings,
    }
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

  fileFrom(from: FileFrom, data: FileData | Url, settings: Settings = {}): UploadFromInterface {
    return fileFrom(from, data, {
      ...this.settings,
      ...settings,
    })
  }
}
