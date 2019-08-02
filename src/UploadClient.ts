import defaultSettings from './defaultSettings'
import UploadAPI from './api/index'
import fileFrom from './fileFrom/fileFrom'
import groupFrom from './groupFrom/groupFrom'

/* Types */
import {FileFromEnum} from './fileFrom/types'
import {FileData, SettingsInterface} from './types'
import {FileUploadInterface} from './fileFrom/types'
import {Url} from './api/fromUrl'
import {UploadAPIInterface, Uuid} from './api/types'
import {GroupFromEnum, GroupUploadInterface} from './groupFrom/types'

export interface UploadClientInterface {
  setSettings(newSettings: SettingsInterface): void

  getSettings(): SettingsInterface

  addUpdateSettingsListener(listener: Function): void

  removeUpdateSettingsListener(listener: Function): void

  fileFrom(from: FileFromEnum, data: FileData | Url | Uuid, settings?: SettingsInterface): FileUploadInterface

  groupFrom(from: GroupFromEnum, data: FileData[] | Url[] | Uuid[], settings?: SettingsInterface): GroupUploadInterface
}

class UploadClient implements UploadClientInterface {
  protected settings: SettingsInterface
  protected updateSettingsListeners: Function[]
  readonly api: UploadAPIInterface

  constructor(settings: SettingsInterface = {}) {
    this.settings = {
      ...defaultSettings,
      ...settings,
    }
    this.updateSettingsListeners = []
    this.api = new UploadAPI(this)
  }

  setSettings(newSettings: SettingsInterface = {}): void {
    const prevSettings = {...this.settings}

    this.settings = {
      ...prevSettings,
      ...newSettings,
    }

    this.updateSettingsListeners.forEach(listener => {
      listener(prevSettings)
    })
  }

  getSettings(): SettingsInterface {
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

  fileFrom(from: FileFromEnum, data: FileData | Url | Uuid, settings: SettingsInterface = {}): FileUploadInterface {
    return fileFrom(from, data, {
      ...this.settings,
      ...settings,
    })
  }

  groupFrom(from: GroupFromEnum, data: FileData[] | Url[] | Uuid[], settings: SettingsInterface = {}): GroupUploadInterface {
    return groupFrom(from, data, {
      ...this.settings,
      ...settings,
    })
  }
}

export default UploadClient
