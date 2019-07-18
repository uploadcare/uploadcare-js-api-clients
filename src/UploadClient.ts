import defaultSettings from './defaultSettings'
import UploadAPI from './api/index'
import fileFrom from './fileFrom/fileFrom'
import {FileFrom} from './fileFrom/types'
import {FileData, Settings} from './types'
import {FileUploadInterface} from './fileFrom/types'
import {Url} from './api/fromUrl'
import {UploadAPIInterface} from './api/types'
import {Uuid} from './api/types'
import groupFrom from './groupFrom/groupFrom'
import {GroupFrom, GroupUploadInterface} from './groupFrom/types'

export interface UploadClientInterface {
  setSettings(newSettings: Settings): void

  getSettings(): Settings

  addUpdateSettingsListener(listener: Function): void

  removeUpdateSettingsListener(listener: Function): void

  fileFrom(from: FileFrom, data: FileData | Url | Uuid, settings?: Settings): FileUploadInterface

  groupFrom(from: GroupFrom, data: FileData[] | Url[] | Uuid[], settings?: Settings): GroupUploadInterface
}

class UploadClient implements UploadClientInterface {
  protected settings: Settings
  protected updateSettingsListeners: Array<Function>
  readonly api: UploadAPIInterface

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

  getSettings(): Settings {
    return this.settings
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

  fileFrom(from: FileFrom, data: FileData | Url | Uuid, settings: Settings = {}): FileUploadInterface {
    return fileFrom(from, data, {
      ...this.settings,
      ...settings,
    })
  }

  groupFrom(from: GroupFrom, data: FileData[] | Url[] | Uuid[], settings: Settings = {}): GroupUploadInterface {
    return groupFrom(from, data, {
      ...this.settings,
      ...settings,
    })
  }
}

export default UploadClient
