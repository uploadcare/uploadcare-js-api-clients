import defaultSettings from './defaultSettings'
import UploadAPI from './api/index'
import fileFrom from './fileFrom/fileFrom'
import groupFrom from './groupFrom/groupFrom'

/* Types */
import {FileData, SettingsInterface} from './types'
import {FileUploadInterface} from './fileFrom/types'
import {Url} from './api/fromUrl'
import {UploadAPIInterface, Uuid} from './api/types'
import {GroupUploadInterface} from './groupFrom/types'

export interface UploadClientInterface {
  updateSettings(newSettings: SettingsInterface): void

  getSettings(): SettingsInterface

  fileFrom(data: FileData | Url | Uuid, settings?: SettingsInterface): FileUploadInterface

  groupFrom(data: FileData[] | Url[] | Uuid[], settings?: SettingsInterface): GroupUploadInterface
}

class UploadClient implements UploadClientInterface {
  private settings: SettingsInterface
  readonly api: UploadAPIInterface

  constructor(settings: SettingsInterface = {}) {
    this.settings = {
      ...defaultSettings,
      ...settings,
    }
    this.api = new UploadAPI(this)
  }

  updateSettings(newSettings: SettingsInterface = {}): void {
    const prevSettings = {...this.settings}

    this.settings = {
      ...prevSettings,
      ...newSettings,
    }
  }

  getSettings(): SettingsInterface {
    return this.settings
  }

  fileFrom(data: FileData | Url | Uuid, settings: SettingsInterface = {}): FileUploadInterface {
    return fileFrom(data, {
      ...this.settings,
      ...settings,
    })
  }

  groupFrom(data: FileData[] | Url[] | Uuid[], settings: SettingsInterface = {}): GroupUploadInterface {
    return groupFrom(data, {
      ...this.settings,
      ...settings,
    })
  }
}

export default UploadClient
